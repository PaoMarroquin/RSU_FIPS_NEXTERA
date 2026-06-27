from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.shortcuts import get_object_or_404

from apps.usuarios.models import Rol, Facultad
from apps.utils.permissions import IsAdministrador, IsCoordinadorRSU
from .models import ProyectoRSU


def _build_report(qs):
    """
    Genera el resumen agregado de un queryset de ProyectoRSU.
    Retorna: total, desglose por estado, por eje RSU, por ODS, por periodo y
    total de docentes únicos involucrados.
    """
    total = qs.count()

    por_estado = list(
        qs.values('estado')
        .annotate(total=Count('id'))
        .order_by('estado')
    )

    por_eje = list(
        qs.values('eje_rsu__nombre')
        .annotate(total=Count('id'))
        .order_by('eje_rsu__nombre')
    )

    por_periodo = list(
        qs.values('periodo__nombre')
        .annotate(total=Count('id'))
        .order_by('periodo__nombre')
    )

    por_ods = list(
        qs.values('ods__numero', 'ods__nombre')
        .annotate(total=Count('id'))
        .order_by('ods__numero')
    )

    docentes_responsables = (
        qs.exclude(docente_responsable__isnull=True)
        .values_list('docente_responsable_id', flat=True)
        .distinct()
    )
    docentes_adicionales = (
        qs.values_list('docentes_adicionales__docente_id', flat=True)
        .exclude(docentes_adicionales__docente_id__isnull=True)
        .distinct()
    )
    total_docentes = len(set(list(docentes_responsables) + list(docentes_adicionales)))

    presupuesto_total = qs.aggregate(
        total=Sum('monto_financiamiento')
    )['total'] or 0

    return {
        'total_proyectos': total,
        'total_docentes_involucrados': total_docentes,
        'presupuesto_total_estimado': float(presupuesto_total),
        'por_estado': por_estado,
        'por_eje_rsu': por_eje,
        'por_periodo': por_periodo,
        'por_ods': [
            entry for entry in por_ods
            if entry.get('ods__numero') is not None
        ],
    }


class ReporteGeneralView(APIView):
    """
    GET /reportes/general/
    Reporte agregado de todos los proyectos UNSA.
    Solo Administrador.
    """
    permission_classes = [IsAuthenticated, IsAdministrador]

    def get(self, request):
        qs = ProyectoRSU.objects.select_related(
            'eje_rsu', 'periodo'
        ).prefetch_related('ods', 'docentes_adicionales')

        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        periodo_id = request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        return Response(_build_report(qs))


class ReporteFacultadView(APIView):
    """
    GET /reportes/facultad/<facultad_pk>/
    Reporte agregado de proyectos de una facultad específica.
    - Administrador: puede ver cualquier facultad.
    - Coordinador RSU: solo puede ver su propia facultad.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, facultad_pk):
        facultad = get_object_or_404(Facultad, pk=facultad_pk)

        user = request.user
        es_admin = user.is_staff or (user.rol and user.rol.nombre == Rol.ADMINISTRADOR)
        es_coordinador = user.rol and user.rol.nombre == Rol.COORDINADOR

        if not (es_admin or es_coordinador):
            return Response(
                {'error': 'Sin permiso',
                 'detail': 'Solo Administrador o Coordinador RSU pueden acceder a reportes por facultad.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if es_coordinador and not es_admin:
            if not user.facultad_id or user.facultad_id != facultad.pk:
                return Response(
                    {'error': 'Sin permiso',
                     'detail': 'Solo puede consultar el reporte de su propia facultad.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        qs = ProyectoRSU.objects.filter(facultad=facultad).select_related(
            'eje_rsu', 'periodo'
        ).prefetch_related('ods', 'docentes_adicionales')

        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        periodo_id = request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        report = _build_report(qs)
        report['facultad'] = {'id': facultad.pk, 'nombre': facultad.nombre}
        return Response(report)
