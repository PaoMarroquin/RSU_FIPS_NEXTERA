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
