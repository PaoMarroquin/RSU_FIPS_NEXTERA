"""
Seguimiento de la ejecución (HU-16) e Informe de Finalización (HU-09, Sprint 8).

Arma, a partir de lo registrado durante la ejecución, las dos vistas que
consumen docente, Departamento y Jefatura RSU:

- seguimiento_proyecto(): avance por actividad en solo lectura. Cada
  actividad trae su bloque del cronograma, sus avances y las evidencias
  vigentes con su enlace, y el porcentaje de ejecución del proyecto.
- informe_finalizacion(): el Informe de Finalización con los datos de la
  planificación ya cargados (T-137/T-138), lo que el docente debe completar y
  el historial de observaciones del Departamento.

Los textos y cifras de cierre (conclusiones, lecciones, metas alcanzadas,
presupuesto ejecutado) se calculan con services_repositorio.informe_final(),
el mismo que usa el Repositorio Histórico, para que el informe que aprueba el
Departamento y el que se publica después den las mismas cifras.

Conecta con:
- apps/proyectos/views_finalizacion.py: vistas que exponen estas funciones.
- apps/proyectos/services_repositorio.py: informe_final() y su cabecera.
- apps/proyectos/exports_finalizacion.py: PDF del informe y de la constancia.
"""
from .models import InformeFinalizacion
from .services_repositorio import informe_final

TEXTOS_INFORME = ('conclusiones', 'recomendaciones', 'lecciones_aprendidas', 'medio_difusion')


def _url_archivo(archivo, request):
    if not archivo:
        return None
    return request.build_absolute_uri(archivo.url) if request else archivo.url


def _evidencia(ev, request):
    return {
        'id': ev.id,
        'tipo': ev.tipo,
        'nombre': ev.nombre,
        'url': ev.enlace_drive if ev.tipo == 'enlace' else _url_archivo(ev.archivo, request),
        'uploaded_at': ev.uploaded_at.isoformat(),
    }


def seguimiento_proyecto(proyecto, request=None):
    """Avance del proyecto por actividad, en solo lectura (HU-16)."""
    actividades = proyecto.actividades.prefetch_related(
        'acciones', 'avances__evidencias', 'avances__autor').order_by('orden')

    filas = []
    for act in actividades:
        avances = sorted(act.avances.all(), key=lambda a: a.created_at, reverse=True)
        evidencias = [
            _evidencia(ev, request)
            for av in avances for ev in av.evidencias.all() if not ev.eliminada
        ]
        filas.append({
            'id': act.id,
            'nombre': act.nombre,
            'descripcion': act.descripcion,
            'estado': act.estado,
            'estado_display': act.get_estado_display(),
            'completada': act.estado == 'completada',
            'acciones': [
                {
                    'id': ac.id,
                    'descripcion': ac.descripcion,
                    'fecha_inicio': ac.fecha_inicio.isoformat() if ac.fecha_inicio else None,
                    'fecha_fin': ac.fecha_fin.isoformat() if ac.fecha_fin else None,
                    'responsable': ac.responsable,
                    'evidencia_esperada': ac.evidencia_esperada,
                }
                for ac in sorted(act.acciones.all(), key=lambda a: a.orden)
            ],
            'avances': [
                {
                    'id': av.id,
                    'descripcion': av.descripcion,
                    'observaciones': av.observaciones,
                    'estado_revision': av.estado_revision,
                    'comentario_revision': av.comentario_revision,
                    'autor': f'{av.autor.nombres} {av.autor.apellidos}'.strip(),
                    'created_at': av.created_at.isoformat(),
                }
                for av in avances
            ],
            'evidencias': evidencias,
            'ultimo_avance': avances[0].created_at.isoformat() if avances else None,
        })

    total = len(filas)
    completadas = sum(1 for f in filas if f['completada'])
    return {
        'proyecto_id': proyecto.id,
        'codigo': proyecto.codigo,
        'titulo': proyecto.titulo,
        'estado': proyecto.estado,
        'porcentaje_ejecucion': float(proyecto.porcentaje_ejecucion),
        'actividades_total': total,
        'actividades_completadas': completadas,
        'actividades': filas,
    }


def obtener_informe(proyecto):
    """Informe de finalización del proyecto, o None si todavía no existe."""
    try:
        return proyecto.informe_finalizacion
    except InformeFinalizacion.DoesNotExist:
        return None


def campos_pendientes(proyecto):
    """Lo que falta completar para poder enviar el informe a revisión.

    Los textos admiten 'n/a' si al docente no le aplican, pero no pueden
    quedar vacíos; cada meta necesita su valor alcanzado.
    """
    pendientes = [
        campo for campo in TEXTOS_INFORME
        if not (getattr(proyecto, campo) or '').strip()
    ]
    metas_sin_valor = [
        m.id for m in proyecto.metas_indicadores.all() if m.valor_alcanzado is None
    ]
    if metas_sin_valor:
        pendientes.append('metas_valor_alcanzado')
    return pendientes, metas_sin_valor


def informe_finalizacion(proyecto, request=None):
    """Informe de Finalización con los datos de planificación y ejecución."""
    informe = obtener_informe(proyecto)
    datos = informe_final(proyecto)
    pendientes, metas_sin_valor = campos_pendientes(proyecto)
    estado = informe.estado if informe else None
    habilitado = proyecto.estado == 'en_ejecucion' and proyecto.porcentaje_ejecucion >= 100

    datos['finalizacion'] = {
        'estado': estado,
        'estado_display': informe.get_estado_display() if informe else None,
        'habilitado': habilitado,
        'editable': habilitado and estado in (None, 'borrador', 'observado'),
        'campos_pendientes': pendientes,
        'metas_sin_valor_alcanzado': metas_sin_valor,
        'fecha_envio': informe.fecha_envio.isoformat() if informe and informe.fecha_envio else None,
        'fecha_aprobacion': (
            informe.fecha_aprobacion.isoformat() if informe and informe.fecha_aprobacion else None),
        'constancia_aprobada': bool(informe and informe.constancia_aprobada),
    }
    datos['presupuesto_detalle'] = [
        {
            'id': p.id,
            'descripcion': p.descripcion,
            'categoria': p.get_categoria_display() if p.categoria else '',
            'cantidad': p.cantidad,
            'costo_unitario': float(p.costo_unitario),
            'monto_presupuestado': float(p.monto_presupuestado),
            'monto_ejecutado': float(p.monto_ejecutado),
        }
        for p in proyecto.partidas_presupuesto.all()
    ]
    datos['observaciones'] = [
        {
            'id': r.id,
            'decision': r.decision,
            'comentario': r.comentario_tecnico,
            'revisor': f'{r.revisor.nombres} {r.revisor.apellidos}'.strip(),
            'created_at': r.created_at.isoformat(),
        }
        for r in proyecto.revisiones.filter(etapa='finalizacion').select_related('revisor')
    ]
    datos['ejecucion'] = seguimiento_proyecto(proyecto, request)
    return datos
