"""
Consolidacion de informes de proyectos aprobados y finalizados (HU-06).

Reune en una sola estructura todo lo que hoy vive repartido entre el
proyecto, su presupuesto, sus metas e indicadores y sus avances, para que el
Coordinador RSU y la Autoridad Universitaria puedan consultarlo y exportarlo
sin recorrer proyecto por proyecto.

Reglas de HU-06 que se aplican aqui:
- CA-01: solo entran proyectos en estado aprobado o finalizado. Ese filtro es
  el punto de partida de todas las consultas y no se puede desactivar por
  parametro.
- CA-03: los filtros disponibles son facultad, eje RSU, ODS y periodo
  academico.

Por que no se calcula todo con anotaciones sobre un solo queryset: el
proyecto tiene varias relaciones de uno a muchos (partidas, fuentes, metas,
actividades, avances). Anotar sumas de todas a la vez multiplica las filas
del JOIN y devuelve totales inflados. En su lugar se lanza una consulta
agrupada por relacion, cada una devuelve un diccionario indexado por
proyecto, y luego se arma la ficha en memoria. Son unas pocas consultas fijas
sin importar cuantos proyectos haya, que es lo que permite cumplir el limite
de 30 segundos de CA-03.

Funciones principales:
- queryset_consolidable(user): base filtrada por estado y por rol.
- aplicar_filtros(qs, params): traduce los query params a filtros ORM.
- consolidar(qs, filtros): informe institucional completo.
- consolidar_proyecto(proyecto): ficha detallada de un solo proyecto.

Conecta con:
- apps/proyectos/models.py: modelos que consolida.
- apps/proyectos/views_consolidado.py: expone estas funciones por la API.
- apps/proyectos/exports_consolidado.py: convierte la salida a PDF y Excel.
- apps/usuarios/models.py: constantes de Rol para el scope por rol.
"""
from decimal import Decimal

from django.db.models import (
    Count, DecimalField, ExpressionWrapper, F, Max, Q, Sum, Value,
)
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.usuarios.models import Rol

from .models import (
    ActividadProyecto, AvanceActividad, EvidenciaAvance, FuenteFinanciamiento,
    MetaIndicadorProyecto, PartidaPresupuestaria, ProyectoRSU,
)

# CA-01: el informe consolidado solo mira estos dos estados.
ESTADOS_CONSOLIDABLES = ('aprobado', 'finalizado')

# CA-03: filtros que acepta el informe, mapeados a su lookup del ORM.
FILTROS_SOPORTADOS = {
    'facultad': 'facultad_id',
    'eje_rsu': 'eje_rsu_id',
    'ods': 'ods__id',
    'periodo': 'periodo_id',
    'escuela': 'escuela_id',
    'departamento': 'departamento_id',
    'estado': 'estado',
}

_DECIMAL = DecimalField(max_digits=14, decimal_places=2)
_CERO = Value(Decimal('0.00'), output_field=_DECIMAL)


def _dec(valor):
    """Normaliza a Decimal con 2 decimales, tratando None como cero."""
    if valor is None:
        return Decimal('0.00')
    return Decimal(valor).quantize(Decimal('0.01'))


def _float(valor):
    """Decimal a float para poder serializarlo a JSON."""
    return float(_dec(valor))


def _porcentaje(parte, total):
    """Porcentaje de parte sobre total, con 2 decimales. Total cero da 0."""
    parte, total = _dec(parte), _dec(total)
    if total == 0:
        return 0.0
    return float((parte / total * 100).quantize(Decimal('0.01')))


# ─────────────────────────────────────────────────────────────────────────────
# T-104: consultas base
# ─────────────────────────────────────────────────────────────────────────────

def queryset_consolidable(user):
    """Proyectos que el usuario puede ver en el informe consolidado.

    Parte de CA-01 (solo aprobados y finalizados) y encima aplica el mismo
    criterio de alcance por rol que ya usa el resto del modulo:

    - Administrador o is_staff: toda la universidad.
    - Jefatura RSU: los proyectos de su facultad.
    - Departamento: los proyectos de su departamento academico.
    - Cualquier otro rol, o sin facultad/departamento asignado: nada.

    El Docente no aparece aqui a proposito: el informe consolidado es una
    vista institucional, y el docente ya consulta sus propios proyectos por
    /proyectos/.
    """
    qs = (
        ProyectoRSU.objects
        .filter(estado__in=ESTADOS_CONSOLIDABLES)
        .select_related(
            'facultad', 'escuela', 'departamento', 'periodo',
            'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
            'docente_responsable',
        )
        .prefetch_related('ods', 'beneficiarios')
    )

    if user.is_staff or (user.rol and user.rol.nombre == Rol.ADMINISTRADOR):
        return qs
    if user.rol and user.rol.nombre == Rol.JEFATURA:
        return qs.filter(facultad=user.facultad) if user.facultad_id else qs.none()
    if user.rol and user.rol.nombre == Rol.DEPARTAMENTO:
        return qs.filter(departamento=user.departamento) if user.departamento_id else qs.none()
    return qs.none()


def aplicar_filtros(qs, params):
    """Aplica los filtros de CA-03 y devuelve (queryset, filtros_aplicados).

    `params` es el QueryDict de la peticion. Se ignoran los parametros vacios
    o desconocidos, de modo que el frontend puede mandar siempre los mismos
    campos aunque el usuario no haya elegido nada.

    El filtro `estado` solo puede estrechar CA-01: si llega un estado que no
    es aprobado ni finalizado, se descarta en lugar de ampliar el informe.
    """
    aplicados = {}

    for nombre, lookup in FILTROS_SOPORTADOS.items():
        valor = params.get(nombre)
        if valor in (None, '', 'null', 'undefined'):
            continue

        if nombre == 'estado':
            if valor not in ESTADOS_CONSOLIDABLES:
                continue
        else:
            try:
                valor = int(valor)
            except (TypeError, ValueError):
                continue

        qs = qs.filter(**{lookup: valor})
        aplicados[nombre] = valor

    # El filtro por ODS cruza una relacion muchos a muchos y puede repetir
    # filas del proyecto; distinct() evita contarlo dos veces.
    if 'ods' in aplicados:
        qs = qs.distinct()

    return qs, aplicados


# ─────────────────────────────────────────────────────────────────────────────
# T-106: recoleccion de datos por relacion
#
# Cada funcion devuelve un dict {proyecto_id: {...}} con una sola consulta
# agrupada, para no disparar una consulta por proyecto.
# ─────────────────────────────────────────────────────────────────────────────

def _presupuesto_por_proyecto(ids):
    """Presupuestado (cantidad x costo unitario) y ejecutado, por proyecto."""
    presupuestado = ExpressionWrapper(
        F('cantidad') * F('costo_unitario'), output_field=_DECIMAL)
    filas = (
        PartidaPresupuestaria.objects
        .filter(proyecto_id__in=ids)
        .values('proyecto_id')
        .annotate(
            presupuestado=Coalesce(Sum(presupuestado), _CERO),
            ejecutado=Coalesce(Sum('monto_ejecutado'), _CERO),
            partidas=Count('id'),
        )
    )
    return {f['proyecto_id']: f for f in filas}


def _financiamiento_por_proyecto(ids):
    """Monto comprometido por las fuentes de financiamiento, por proyecto."""
    filas = (
        FuenteFinanciamiento.objects
        .filter(proyecto_id__in=ids)
        .values('proyecto_id')
        .annotate(
            financiado=Coalesce(Sum('monto'), _CERO),
            fuentes=Count('id'),
        )
    )
    return {f['proyecto_id']: f for f in filas}


def _metas_por_proyecto(ids):
    """Total de metas y cuantas alcanzaron su valor objetivo, por proyecto.

    Una meta cuenta como cumplida cuando tiene valor meta y valor alcanzado
    y el alcanzado llega o supera al objetivo. Las metas sin medir no se
    cuentan como incumplidas: se reportan aparte como pendientes.
    """
    filas = (
        MetaIndicadorProyecto.objects
        .filter(proyecto_id__in=ids)
        .values('proyecto_id')
        .annotate(
            total=Count('id'),
            cumplidas=Count('id', filter=Q(
                valor_meta__isnull=False,
                valor_alcanzado__isnull=False,
                valor_alcanzado__gte=F('valor_meta'),
            )),
            medidas=Count('id', filter=Q(valor_alcanzado__isnull=False)),
        )
    )
    return {f['proyecto_id']: f for f in filas}


def _actividades_por_proyecto(ids):
    """Conteo de actividades por estado de ejecucion, por proyecto."""
    filas = (
        ActividadProyecto.objects
        .filter(proyecto_id__in=ids)
        .values('proyecto_id')
        .annotate(
            total=Count('id'),
            completadas=Count('id', filter=Q(estado='completada')),
            en_ejecucion=Count('id', filter=Q(estado='en_ejecucion')),
            pendientes=Count('id', filter=Q(estado='pendiente')),
        )
    )
    return {f['proyecto_id']: f for f in filas}


def _avances_por_proyecto(ids):
    """Cantidad de avances registrados y fecha del ultimo, por proyecto."""
    filas = (
        AvanceActividad.objects
        .filter(proyecto_id__in=ids)
        .values('proyecto_id')
        .annotate(
            total=Count('id'),
            observados=Count('id', filter=Q(estado_revision='observado')),
            ultimo=Max('created_at'),
        )
    )
    return {f['proyecto_id']: f for f in filas}


def _evidencias_por_proyecto(ids):
    """Evidencias vigentes (sin borrado logico), por proyecto."""
    filas = (
        EvidenciaAvance.objects
        .filter(avance__proyecto_id__in=ids, eliminada=False)
        .values('avance__proyecto_id')
        .annotate(total=Count('id'))
    )
    return {f['avance__proyecto_id']: f['total'] for f in filas}


def _recolectar(ids):
    """Lanza de una vez todas las consultas agrupadas que necesita la ficha."""
    return {
        'presupuesto': _presupuesto_por_proyecto(ids),
        'financiamiento': _financiamiento_por_proyecto(ids),
        'metas': _metas_por_proyecto(ids),
        'actividades': _actividades_por_proyecto(ids),
        'avances': _avances_por_proyecto(ids),
        'evidencias': _evidencias_por_proyecto(ids),
    }


# ─────────────────────────────────────────────────────────────────────────────
# T-106: armado de la ficha de un proyecto
# ─────────────────────────────────────────────────────────────────────────────

def _bloque_presupuesto(proyecto, datos):
    pres = datos['presupuesto'].get(proyecto.id, {})
    fin = datos['financiamiento'].get(proyecto.id, {})

    presupuestado = _dec(pres.get('presupuestado'))
    ejecutado = _dec(pres.get('ejecutado'))
    financiado = _dec(fin.get('financiado'))

    return {
        'monto_declarado': _float(proyecto.monto_financiamiento),
        'monto_financiado': _float(financiado),
        'monto_presupuestado': _float(presupuestado),
        'monto_ejecutado': _float(ejecutado),
        'saldo_por_ejecutar': _float(presupuestado - ejecutado),
        'porcentaje_ejecucion_presupuestal': _porcentaje(ejecutado, presupuestado),
        'nro_partidas': pres.get('partidas', 0),
        'nro_fuentes': fin.get('fuentes', 0),
        'financiamiento_confirmado': proyecto.financiamiento_confirmado,
    }


def _bloque_metas(proyecto, datos):
    metas = datos['metas'].get(proyecto.id, {})
    total = metas.get('total', 0)
    cumplidas = metas.get('cumplidas', 0)
    medidas = metas.get('medidas', 0)
    return {
        'total': total,
        'cumplidas': cumplidas,
        'medidas': medidas,
        'sin_medir': total - medidas,
        'porcentaje_cumplimiento': _porcentaje(cumplidas, total),
    }


def _bloque_avance(proyecto, datos):
    act = datos['actividades'].get(proyecto.id, {})
    av = datos['avances'].get(proyecto.id, {})
    ultimo = av.get('ultimo')
    return {
        'porcentaje_ejecucion': _float(proyecto.porcentaje_ejecucion),
        'actividades_total': act.get('total', 0),
        'actividades_completadas': act.get('completadas', 0),
        'actividades_en_ejecucion': act.get('en_ejecucion', 0),
        'actividades_pendientes': act.get('pendientes', 0),
        'avances_registrados': av.get('total', 0),
        'avances_observados': av.get('observados', 0),
        'evidencias_vigentes': datos['evidencias'].get(proyecto.id, 0),
        'ultimo_avance': ultimo.isoformat() if ultimo else None,
    }


def ficha_proyecto(proyecto, datos):
    """Ficha consolidada de un proyecto, con los datos ya recolectados.

    `datos` es lo que devuelve _recolectar(); se pasa desde fuera para poder
    armar muchas fichas sin repetir consultas.
    """
    docente = proyecto.docente_responsable
    return {
        'id': proyecto.id,
        'codigo': proyecto.codigo or '',
        'titulo': proyecto.titulo,
        'estado': proyecto.estado,
        'estado_display': proyecto.get_estado_display(),
        'facultad': proyecto.facultad.nombre if proyecto.facultad else None,
        'facultad_id': proyecto.facultad_id,
        'escuela': proyecto.escuela.nombre if proyecto.escuela else None,
        'escuela_id': proyecto.escuela_id,
        'departamento': proyecto.departamento.nombre if proyecto.departamento else None,
        'departamento_id': proyecto.departamento_id,
        'periodo': proyecto.periodo.nombre if proyecto.periodo else None,
        'periodo_id': proyecto.periodo_id,
        'semestre_academico': proyecto.semestre_academico,
        'eje_rsu': proyecto.eje_rsu.nombre if proyecto.eje_rsu else None,
        'eje_rsu_id': proyecto.eje_rsu_id,
        'linea_estrategica': (
            proyecto.linea_estrategica.nombre if proyecto.linea_estrategica else None),
        'objetivo_institucional': (
            proyecto.objetivo_institucional.nombre
            if proyecto.objetivo_institucional else None),
        'ods': [{'numero': o.numero, 'nombre': o.nombre} for o in proyecto.ods.all()],
        'beneficiarios': [b.label for b in proyecto.beneficiarios.all()],
        'docente_responsable': (
            f'{docente.nombres} {docente.apellidos}'.strip() if docente else None),
        'docente_responsable_id': proyecto.docente_responsable_id,
        'nro_docentes': proyecto.nro_docentes or 0,
        'nro_estudiantes': proyecto.nro_estudiantes or 0,
        'fecha_inicio': proyecto.fecha_inicio.isoformat() if proyecto.fecha_inicio else None,
        'fecha_termino': proyecto.fecha_termino.isoformat() if proyecto.fecha_termino else None,
        'fecha_aprobacion': (
            proyecto.fecha_aprobacion.isoformat() if proyecto.fecha_aprobacion else None),
        'fecha_cierre': proyecto.fecha_cierre.isoformat() if proyecto.fecha_cierre else None,
        'presupuesto': _bloque_presupuesto(proyecto, datos),
        'metas': _bloque_metas(proyecto, datos),
        'avance': _bloque_avance(proyecto, datos),
    }


def consolidar_proyecto(proyecto):
    """Ficha consolidada de un unico proyecto, con el detalle linea a linea.

    Amplia lo que devuelve ficha_proyecto() con las listas completas de
    partidas presupuestarias, fuentes, metas e indicadores y avances, para la
    pantalla de detalle de un proyecto dentro del informe.
    """
    datos = _recolectar([proyecto.id])
    ficha = ficha_proyecto(proyecto, datos)

    ficha['detalle_presupuesto'] = [
        {
            'categoria': p.get_categoria_display() if p.categoria else '',
            'tipo_recurso': p.get_tipo_recurso_display() if p.tipo_recurso else '',
            'descripcion': p.descripcion,
            'unidad': p.unidad,
            'cantidad': p.cantidad,
            'costo_unitario': _float(p.costo_unitario),
            'monto_presupuestado': _float(p.monto_presupuestado),
            'monto_ejecutado': _float(p.monto_ejecutado),
            'fuente': p.fuente.get_fuente_display() if p.fuente else '',
        }
        for p in proyecto.partidas_presupuesto.select_related('fuente').all()
    ]

    ficha['detalle_fuentes'] = [
        {
            'fuente': f.get_fuente_display(),
            'monto': _float(f.monto),
            'descripcion': f.descripcion,
        }
        for f in proyecto.fuentes_financiamiento.all()
    ]

    ficha['detalle_metas'] = [
        {
            'meta': m.meta_descripcion,
            'indicador': m.indicador_nombre,
            'unidad_medida': m.unidad_medida,
            'linea_base': _float(m.linea_base) if m.linea_base is not None else None,
            'valor_meta': _float(m.valor_meta) if m.valor_meta is not None else None,
            'valor_alcanzado': (
                _float(m.valor_alcanzado) if m.valor_alcanzado is not None else None),
            'porcentaje_avance': _porcentaje(m.valor_alcanzado, m.valor_meta),
            'metodo_verificacion': m.metodo_verificacion,
            'fuente_verificacion': m.fuente_verificacion,
        }
        for m in proyecto.metas_indicadores.all()
    ]

    ficha['detalle_avances'] = [
        {
            'id': a.id,
            'actividad': a.actividad.nombre if a.actividad else '',
            'descripcion': a.descripcion,
            'estado_actividad': a.estado_actividad,
            'estado_revision': a.estado_revision,
            'autor': (
                f'{a.autor.nombres} {a.autor.apellidos}'.strip() if a.autor else None),
            'created_at': a.created_at.isoformat(),
            'evidencias': a.evidencias.filter(eliminada=False).count(),
        }
        for a in proyecto.avances.select_related('actividad', 'autor').all()
    ]

    return ficha


# ─────────────────────────────────────────────────────────────────────────────
# T-106: informe institucional
# ─────────────────────────────────────────────────────────────────────────────

def _distribucion(qs, campo, etiqueta):
    """Conteo de proyectos agrupado por un campo relacionado."""
    filas = (
        qs.values(campo)
        .annotate(total=Count('id', distinct=True))
        .order_by('-total')
    )
    return [
        {'etiqueta': f[campo] or 'Sin asignar', 'total': f['total'], 'campo': etiqueta}
        for f in filas
    ]


def _distribucion_ods(qs):
    """Conteo de proyectos por ODS. Un proyecto puede sumar en varios ODS."""
    filas = (
        qs.filter(ods__isnull=False)
        .values('ods__numero', 'ods__nombre')
        .annotate(total=Count('id', distinct=True))
        .order_by('ods__numero')
    )
    return [
        {
            'numero': f['ods__numero'],
            'etiqueta': f'ODS {f["ods__numero"]}: {f["ods__nombre"]}',
            'total': f['total'],
        }
        for f in filas
    ]


def consolidar(qs, filtros_aplicados=None, incluir_proyectos=True):
    """Informe consolidado completo sobre un queryset ya filtrado.

    Devuelve un diccionario con cuatro partes:

    - `resumen`: totales de proyectos, participantes y avance promedio.
    - `presupuesto`: presupuestado, ejecutado y saldo de todo el conjunto.
    - `metas`: cuantas metas hay y cuantas se cumplieron.
    - `distribuciones`: reparto por facultad, escuela, eje RSU, ODS, periodo
      y estado, listo para alimentar los graficos del dashboard.

    Con `incluir_proyectos` en True agrega tambien la lista de fichas, que es
    lo que consumen la tabla del dashboard y las exportaciones.

    El campo `solo_lectura` viaja siempre en True: es la senal para que el
    frontend deshabilite cualquier accion de edicion en el perfil de
    Autoridad Universitaria (CA-02).
    """
    proyectos = list(qs)
    ids = [p.id for p in proyectos]
    datos = _recolectar(ids)

    fichas = [ficha_proyecto(p, datos) for p in proyectos]

    total = len(proyectos)
    aprobados = sum(1 for p in proyectos if p.estado == 'aprobado')
    finalizados = sum(1 for p in proyectos if p.estado == 'finalizado')

    presupuestado = sum((_dec(v.get('presupuestado')) for v in datos['presupuesto'].values()),
                        Decimal('0.00'))
    ejecutado = sum((_dec(v.get('ejecutado')) for v in datos['presupuesto'].values()),
                    Decimal('0.00'))
    financiado = sum((_dec(v.get('financiado')) for v in datos['financiamiento'].values()),
                     Decimal('0.00'))

    metas_total = sum(v.get('total', 0) for v in datos['metas'].values())
    metas_cumplidas = sum(v.get('cumplidas', 0) for v in datos['metas'].values())

    act_total = sum(v.get('total', 0) for v in datos['actividades'].values())
    act_completadas = sum(v.get('completadas', 0) for v in datos['actividades'].values())

    avance_promedio = 0.0
    if total:
        suma = sum((_dec(p.porcentaje_ejecucion) for p in proyectos), Decimal('0.00'))
        avance_promedio = float((suma / total).quantize(Decimal('0.01')))

    # Los docentes se cuentan sin repetir: un docente con tres proyectos es
    # una sola persona involucrada.
    docentes = {p.docente_responsable_id for p in proyectos if p.docente_responsable_id}

    informe = {
        'generado_en': timezone.now().isoformat(),
        'solo_lectura': True,
        'estados_incluidos': list(ESTADOS_CONSOLIDABLES),
        'filtros_aplicados': filtros_aplicados or {},
        'resumen': {
            'total_proyectos': total,
            'aprobados': aprobados,
            'finalizados': finalizados,
            'docentes_responsables': len(docentes),
            'total_docentes_declarados': sum(p.nro_docentes or 0 for p in proyectos),
            'total_estudiantes_declarados': sum(p.nro_estudiantes or 0 for p in proyectos),
            'avance_promedio': avance_promedio,
            'actividades_total': act_total,
            'actividades_completadas': act_completadas,
            'porcentaje_actividades_completadas': _porcentaje(act_completadas, act_total),
        },
        'presupuesto': {
            'monto_financiado': _float(financiado),
            'monto_presupuestado': _float(presupuestado),
            'monto_ejecutado': _float(ejecutado),
            'saldo_por_ejecutar': _float(presupuestado - ejecutado),
            'porcentaje_ejecucion_presupuestal': _porcentaje(ejecutado, presupuestado),
        },
        'metas': {
            'total': metas_total,
            'cumplidas': metas_cumplidas,
            'porcentaje_cumplimiento': _porcentaje(metas_cumplidas, metas_total),
        },
        'distribuciones': {
            'por_facultad': _distribucion(qs, 'facultad__nombre', 'facultad'),
            'por_escuela': _distribucion(qs, 'escuela__nombre', 'escuela'),
            'por_eje_rsu': _distribucion(qs, 'eje_rsu__nombre', 'eje_rsu'),
            'por_periodo': _distribucion(qs, 'periodo__nombre', 'periodo'),
            'por_estado': _distribucion(qs, 'estado', 'estado'),
            'por_ods': _distribucion_ods(qs),
        },
    }

    if incluir_proyectos:
        informe['proyectos'] = fichas

    return informe
