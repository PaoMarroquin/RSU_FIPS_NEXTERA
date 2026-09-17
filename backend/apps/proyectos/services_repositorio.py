"""
Repositorio Historico de proyectos RSU finalizados (HU-07, T-120 a T-124).

Un proyecto entra al repositorio cuando pasa a estado finalizado (ver
ProyectoFinalizarView en views.py). A partir de ahi deja de ser un proyecto
"en curso" y se vuelve conocimiento institucional: cualquier usuario del
sistema puede consultarlo para ver que se hizo, con que resultados y que
lecciones dejo, y mas adelante usarlo como plantilla (T-126 en adelante).

Reglas que se aplican aqui:
- Solo entran proyectos en estado finalizado. Ese filtro es el punto de
  partida de todas las consultas y no se puede desactivar por parametro.
- El repositorio es institucional: no se recorta por facultad ni por
  departamento. Los cuatro roles ven todos los proyectos finalizados.
- Es de solo lectura. Nada de este modulo modifica el proyecto.

Filtros (T-120 y T-122):
- Por semestre, facultad, escuela, departamento, eje RSU y ODS, mas periodo,
  anio, rango de fecha de cierre y busqueda libre.
- Cada filtro acepta varios valores, separados por coma o repitiendo el
  parametro (?ods=1,4 o ?ods=1&ods=4). Dentro de un mismo filtro los valores
  se combinan con O; entre filtros distintos, con Y. Asi "ods=4,11&facultad=2"
  es "proyectos de la facultad 2 alineados al ODS 4 o al 11".
- Los valores invalidos se ignoran en lugar de dar error, igual que en el
  informe consolidado, y `filtros_aplicados` devuelve solo lo que se aplico.

Funciones principales:
- queryset_historico(): base de proyectos finalizados.
- aplicar_filtros(qs, params): traduce los query params a filtros ORM.
- ordenar(qs, params): ordenamiento con lista blanca de campos.
- resumen_proyecto(proyecto): tarjeta del listado.
- ficha_tecnica(proyecto): ANEXO 4 completo en solo lectura (T-123).
- informe_final(proyecto): informe final, resultados y lecciones (T-124).
- leccion_aprendida(proyecto): item del listado transversal de lecciones.

Conecta con:
- apps/proyectos/models.py: modelos que consulta.
- apps/proyectos/services_consolidado.py: reutiliza la consolidacion de
  presupuesto, metas y avance para el informe final.
- apps/proyectos/views_repositorio.py: expone estas funciones por la API.
"""
from datetime import date

from django.db.models import Q

from .models import ProyectoRSU

# Un proyecto solo forma parte del repositorio historico una vez finalizado.
ESTADO_HISTORICO = 'finalizado'

# T-120: filtros numericos (ids, salvo `anio`), mapeados a su lookup del ORM. Los que cruzan una
# relacion muchos a muchos pueden repetir filas y obligan a usar distinct().
FILTROS_POR_ID = {
    'facultad': 'facultad_id__in',
    'escuela': 'escuela_id__in',
    'departamento': 'departamento_id__in',
    'periodo': 'periodo_id__in',
    'eje_rsu': 'ejes_rsu__id__in',
    'ods': 'ods__id__in',
    'anio': 'periodo__anio__in',
}
FILTROS_MUCHOS_A_MUCHOS = {'eje_rsu', 'ods'}

# Campos por los que se puede ordenar el listado; cualquier otro se ignora.
ORDENAMIENTOS = {
    'fecha_cierre': 'fecha_cierre',
    'titulo': 'titulo',
    'codigo': 'codigo',
    'semestre': 'semestre_academico',
    'facultad': 'facultad__nombre',
}
ORDEN_POR_DEFECTO = ('-fecha_cierre', '-id')

_VACIOS = (None, '', 'null', 'undefined')

TIPOS_ACTIVIDAD_LABELS = {
    'programas_formativos': 'Programas formativos',
    'acompanamiento': 'Acompañamiento a sectores identificados',
    'asesoria': 'Asesoría',
    'acercamiento_comunidad': 'Iniciativas de acercamiento a la comunidad',
    'otro': 'Otros',
}


# ─────────────────────────────────────────────────────────────────────────────
# T-120 / T-121: consultas base
# ─────────────────────────────────────────────────────────────────────────────

def queryset_historico():
    """Proyectos finalizados, con las relaciones que usa la tarjeta del listado."""
    return (
        ProyectoRSU.objects
        .filter(estado=ESTADO_HISTORICO)
        .select_related('facultad', 'escuela', 'departamento', 'periodo',
                        'docente_responsable')
        .prefetch_related('ejes_rsu', 'ods')
    )


def queryset_ficha():
    """Proyectos finalizados con todo lo que necesita la ficha tecnica."""
    return (
        queryset_historico()
        .select_related('linea_estrategica', 'objetivo_institucional')
        .prefetch_related(
            'beneficiarios', 'objetivos_regionales', 'objetivos_nacionales',
            'asignaturas', 'docentes_adicionales__docente',
            'ejes_subitems__sub_eje__eje_rsu',
            'actividades', 'cronograma', 'metas_indicadores',
            'fuentes_financiamiento', 'partidas_presupuesto__fuente',
            'documentos_sustento',
        )
    )


def _valores(params, nombre):
    """Lista de valores de un parametro, admitiendo coma y repeticion."""
    crudos = params.getlist(nombre) if hasattr(params, 'getlist') else [params.get(nombre)]
    valores = []
    for crudo in crudos:
        if crudo in _VACIOS:
            continue
        for parte in str(crudo).split(','):
            parte = parte.strip()
            if parte not in _VACIOS and parte not in valores:
                valores.append(parte)
    return valores


def _enteros(valores):
    enteros = []
    for valor in valores:
        try:
            enteros.append(int(valor))
        except (TypeError, ValueError):
            continue
    return enteros


def _fecha(valor):
    """Fecha ISO (AAAA-MM-DD) o None si no es valida."""
    try:
        return date.fromisoformat(valor)
    except (TypeError, ValueError):
        return None


def aplicar_filtros(qs, params):
    """Aplica los filtros combinados de T-122 y devuelve (queryset, aplicados).

    Filtros soportados:
    - facultad, escuela, departamento, periodo, eje_rsu, ods: ids.
    - anio: anio del periodo academico.
    - semestre: texto exacto del semestre academico (campo 1.4, p. ej.
      "2025-A"), sin distinguir mayusculas.
    - fecha_cierre_desde, fecha_cierre_hasta: AAAA-MM-DD, ambos inclusive.
    - q: busqueda libre en titulo, codigo, docente responsable, lugar de
      ejecucion y lecciones aprendidas.
    """
    aplicados = {}
    usa_muchos_a_muchos = False

    for nombre, lookup in FILTROS_POR_ID.items():
        ids = _enteros(_valores(params, nombre))
        if not ids:
            continue
        qs = qs.filter(**{lookup: ids})
        aplicados[nombre] = ids
        usa_muchos_a_muchos |= nombre in FILTROS_MUCHOS_A_MUCHOS

    semestres = _valores(params, 'semestre')
    if semestres:
        condicion = Q()
        for semestre in semestres:
            condicion |= Q(semestre_academico__iexact=semestre)
        qs = qs.filter(condicion)
        aplicados['semestre'] = semestres

    desde = _fecha(params.get('fecha_cierre_desde'))
    if desde:
        qs = qs.filter(fecha_cierre__date__gte=desde)
        aplicados['fecha_cierre_desde'] = desde.isoformat()
    hasta = _fecha(params.get('fecha_cierre_hasta'))
    if hasta:
        qs = qs.filter(fecha_cierre__date__lte=hasta)
        aplicados['fecha_cierre_hasta'] = hasta.isoformat()

    texto = (params.get('q') or '').strip()
    if texto:
        qs = qs.filter(
            Q(titulo__icontains=texto)
            | Q(codigo__icontains=texto)
            | Q(docente_responsable__nombres__icontains=texto)
            | Q(docente_responsable__apellidos__icontains=texto)
            | Q(lugar_ejecucion__icontains=texto)
            | Q(lecciones_aprendidas__icontains=texto)
        )
        aplicados['q'] = texto

    if usa_muchos_a_muchos:
        qs = qs.distinct()

    return qs, aplicados


def ordenar(qs, params):
    """Ordena por `ordering` (con '-' para descendente) o por fecha de cierre."""
    pedido = (params.get('ordering') or '').strip()
    campo = ORDENAMIENTOS.get(pedido.lstrip('-'))
    if not campo:
        return qs.order_by(*ORDEN_POR_DEFECTO), '-fecha_cierre'
    prefijo = '-' if pedido.startswith('-') else ''
    return qs.order_by(prefijo + campo, '-id'), pedido


# ─────────────────────────────────────────────────────────────────────────────
# Piezas comunes de las respuestas
# ─────────────────────────────────────────────────────────────────────────────

def _iso(valor):
    return valor.isoformat() if valor else None


def _ref(objeto):
    """{id, nombre} de un catalogo, o None si no esta asignado."""
    return {'id': objeto.id, 'nombre': objeto.nombre} if objeto else None


def _nombre_usuario(usuario):
    return f'{usuario.nombres} {usuario.apellidos}'.strip() if usuario else None


def _ods(proyecto):
    return [
        {'id': o.id, 'numero': o.numero, 'nombre': o.nombre, 'icono_url': o.icono_url}
        for o in sorted(proyecto.ods.all(), key=lambda o: o.numero)
    ]


def _cabecera(proyecto):
    """Datos de identificacion que comparten todas las respuestas."""
    return {
        'id': proyecto.id,
        'codigo': proyecto.codigo or '',
        'titulo': proyecto.titulo,
        'estado': proyecto.estado,
        'estado_display': proyecto.get_estado_display(),
        'semestre_academico': proyecto.semestre_academico,
        'periodo': _ref(proyecto.periodo),
        'facultad': _ref(proyecto.facultad),
        'escuela': _ref(proyecto.escuela),
        'departamento': _ref(proyecto.departamento),
        'ejes_rsu': [_ref(e) for e in proyecto.ejes_rsu.all()],
        'ods': _ods(proyecto),
        'docente_responsable': _nombre_usuario(proyecto.docente_responsable),
        'fecha_inicio': _iso(proyecto.fecha_inicio),
        'fecha_termino': _iso(proyecto.fecha_termino),
        'fecha_cierre': _iso(proyecto.fecha_cierre),
    }


def _tiene_texto(valor):
    return bool(valor and valor.strip())


# ─────────────────────────────────────────────────────────────────────────────
# T-121: tarjeta del listado
# ─────────────────────────────────────────────────────────────────────────────

def resumen_proyecto(proyecto):
    """Tarjeta de un proyecto en el listado del repositorio."""
    resumen = _cabecera(proyecto)
    resumen.update({
        'nro_docentes': proyecto.nro_docentes or 0,
        'nro_estudiantes': proyecto.nro_estudiantes or 0,
        'lugar_ejecucion': proyecto.lugar_ejecucion,
        'tiene_informe_final': any(_tiene_texto(v) for v in (
            proyecto.conclusiones, proyecto.recomendaciones,
            proyecto.lecciones_aprendidas)),
        'tiene_lecciones_aprendidas': _tiene_texto(proyecto.lecciones_aprendidas),
    })
    return resumen


# ─────────────────────────────────────────────────────────────────────────────
# T-123: ficha tecnica
# ─────────────────────────────────────────────────────────────────────────────

def ficha_tecnica(proyecto):
    """Ficha tecnica completa del proyecto historico, por secciones del ANEXO 4.

    Espera un proyecto obtenido de queryset_ficha() para no disparar una
    consulta por relacion. Deja fuera a proposito la bitacora interna del
    flujo de aprobacion (revisiones e historial de estados con IP): el
    repositorio muestra el proyecto, no su tramite.
    """
    ficha = _cabecera(proyecto)

    ficha['datos_generales'] = {
        'asignaturas': [
            {
                'nombre': a.nombre_asignatura,
                'codigo': a.codigo_asignatura,
                'anio_carrera': a.anio_carrera,
                'semestre': a.semestre,
            }
            for a in proyecto.asignaturas.all()
        ],
        'nro_docentes': proyecto.nro_docentes or 0,
        'nro_estudiantes': proyecto.nro_estudiantes or 0,
        'docentes_adicionales': [
            {'nombre': _nombre_usuario(d.docente), 'rol': d.rol_en_proyecto}
            for d in proyecto.docentes_adicionales.all()
        ],
        'beneficiarios': [b.label for b in proyecto.beneficiarios.all()],
        'beneficiarios_otro_detalle': proyecto.benef_otro_detalle,
        'ejes_subitems': [
            {
                'eje_rsu': s.sub_eje.eje_rsu.nombre,
                'subitem': s.sub_eje.nombre,
                'detalle': s.detalle,
            }
            for s in proyecto.ejes_subitems.all()
        ],
        'eje_detalle': proyecto.eje_detalle,
        'tipo_actividad': [
            TIPOS_ACTIVIDAD_LABELS.get(t, t) for t in (proyecto.tipo_actividad or [])],
        'tipo_actividad_otro': proyecto.tipo_actividad_otro,
        'anio_carrera': proyecto.get_anio_carrera_display() if proyecto.anio_carrera else None,
        'es_tesis_quinto_anio': proyecto.es_tesis_quinto_anio,
        'fecha_evaluacion_avance': _iso(proyecto.fecha_evaluacion_avance),
        'fecha_encuesta_docentes': _iso(proyecto.fecha_encuesta_docentes),
        'fecha_encuesta_alumnos': _iso(proyecto.fecha_encuesta_alumnos),
        'fecha_encuesta_grupo_destinatario': _iso(proyecto.fecha_encuesta_grupo_destinatario),
        'lugar_ejecucion': proyecto.lugar_ejecucion,
    }

    ficha['alineamiento'] = {
        'linea_estrategica': _ref(proyecto.linea_estrategica),
        'objetivo_institucional': _ref(proyecto.objetivo_institucional),
        'objetivos_regionales': [
            {'id': o.id, 'codigo': o.codigo, 'nombre': o.nombre}
            for o in proyecto.objetivos_regionales.all()
        ],
        'objetivos_nacionales': [
            {'id': o.id, 'codigo': o.codigo, 'nombre': o.nombre}
            for o in proyecto.objetivos_nacionales.all()
        ],
    }

    ficha['fundamentacion'] = {
        'por_que_grupo': proyecto.fund_por_que_grupo,
        'para_que_proyecto': proyecto.fund_para_que_proyecto,
        'mecanismo_ensenanza': proyecto.fund_mecanismo_ensenanza,
    }

    ficha['diagnostico'] = {
        'estado_grupo': proyecto.diag_estado_grupo,
        'problemas_detectados': proyecto.diag_problemas_detectados,
        'aportes_formacion': proyecto.diag_aportes_formacion,
        'justificacion_intervencion': proyecto.diag_justificacion_intervencion,
    }

    ficha['objetivos'] = {
        'logro_intervencion': proyecto.obj_logro_intervencion,
        'mejora_curricular': proyecto.obj_mejora_curricular,
    }

    ficha['resultados_esperados'] = _resultados_esperados(proyecto)

    ficha['actividades'] = [
        {
            'nombre': a.nombre,
            'descripcion': a.descripcion,
            'curso_vinculado': a.curso_vinculado,
            'responsable': a.responsable,
            'fecha': _iso(a.fecha),
            'evidencia_esperada': a.evidencia_esperada,
            'estado': a.estado,
            'estado_display': a.get_estado_display(),
        }
        for a in proyecto.actividades.all()
    ]

    ficha['cronograma'] = [
        {
            'descripcion': c.descripcion,
            'fecha_inicio': _iso(c.fecha_inicio),
            'fecha_fin': _iso(c.fecha_fin),
            'responsable': c.responsable,
            'estado_avance': c.estado_avance,
            'estado_avance_display': c.get_estado_avance_display(),
        }
        for c in proyecto.cronograma.all()
    ]

    ficha['recursos'] = {
        'humanos': {
            'docentes': proyecto.rec_hum_docentes,
            'administrativos': proyecto.rec_hum_administrativos,
            'estudiantes': proyecto.rec_hum_estudiantes,
            'egresados': proyecto.rec_hum_egresados,
            'voluntarios': proyecto.rec_hum_voluntarios,
            'otros': proyecto.rec_hum_otros,
        },
        'materiales': {
            'material_didactico': proyecto.rec_mat_material_didactico,
            'afiches': proyecto.rec_mat_afiches,
            'equipos': proyecto.rec_mat_equipos,
            'utiles': proyecto.rec_mat_utiles,
            'otros': proyecto.rec_mat_otros,
        },
    }

    ficha['financiamiento'] = {
        'monto_total': float(proyecto.monto_financiamiento or 0),
        'fuente_principal': proyecto.get_fuente_financiamiento_display() or None,
        'descripcion_gastos': proyecto.descripcion_gastos,
        'observaciones': proyecto.observaciones_financiamiento,
        'fuentes': [
            {
                'fuente': f.get_fuente_display(),
                'monto': float(f.monto),
                'descripcion': f.descripcion,
            }
            for f in proyecto.fuentes_financiamiento.all()
        ],
        'partidas': [
            {
                'categoria': p.get_categoria_display() if p.categoria else '',
                'tipo_recurso': p.get_tipo_recurso_display() if p.tipo_recurso else '',
                'descripcion': p.descripcion,
                'unidad': p.unidad,
                'cantidad': p.cantidad,
                'costo_unitario': float(p.costo_unitario),
                'monto_presupuestado': float(p.monto_presupuestado),
                'monto_ejecutado': float(p.monto_ejecutado),
                'fuente': p.fuente.get_fuente_display() if p.fuente else '',
            }
            for p in proyecto.partidas_presupuesto.all()
        ],
    }

    ficha['metas_indicadores'] = [
        {
            'meta': m.meta_descripcion,
            'indicador': m.indicador_nombre,
            'unidad_medida': m.unidad_medida,
            'linea_base': float(m.linea_base) if m.linea_base is not None else None,
            'valor_meta': float(m.valor_meta) if m.valor_meta is not None else None,
            'valor_alcanzado': (
                float(m.valor_alcanzado) if m.valor_alcanzado is not None else None),
            'metodo_verificacion': m.metodo_verificacion,
            'fuente_verificacion': m.fuente_verificacion,
        }
        for m in proyecto.metas_indicadores.all()
    ]

    ficha['documentos_sustento'] = [
        {
            'id': d.id,
            'nombre': d.nombre or d.archivo.name.rsplit('/', 1)[-1],
            'url': d.archivo.url if d.archivo else None,
            'uploaded_at': _iso(d.uploaded_at),
        }
        for d in proyecto.documentos_sustento.all()
    ]

    ficha['trazabilidad'] = {
        'created_at': _iso(proyecto.created_at),
        'fecha_envio_revision': _iso(proyecto.fecha_envio_revision),
        'fecha_aprobacion': _iso(proyecto.fecha_aprobacion),
        'fecha_inicio_ejecucion': _iso(proyecto.fecha_inicio_ejecucion),
        'fecha_cierre': _iso(proyecto.fecha_cierre),
        'es_continuacion': proyecto.es_continuacion,
        'proyecto_origen_id': proyecto.proyecto_origen_id,
    }

    return ficha


def _resultados_esperados(proyecto):
    return {
        'en_beneficiarios': proyecto.resultado_en_beneficiarios,
        'en_curriculo': proyecto.resultado_en_curriculo,
        'impacto_esperado': proyecto.impacto_esperado,
    }
