from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, F, ExpressionWrapper, DecimalField
from django.shortcuts import get_object_or_404
from apps.utils.permissions import IsOwnerOrReadOnly, IsDocente
from apps.planificacion.models import PeriodoAcademico
from .models import (
    ProyectoRSU, ProyectoDocente, ActividadProyecto, CronogramaAccion,
    PartidaPresupuestaria, MetaIndicadorProyecto,
)
from .serializers import (
    ProyectoRSUSerializer,
    ActividadProyectoSerializer,
    CronogramaAccionSerializer,
    PartidaPresupuestariaSerializer,
    MetaIndicadorProyectoSerializer,
)
from apps.usuarios.models import Rol


def _proyecto_qs_base():
    return ProyectoRSU.objects.select_related(
        'facultad', 'escuela', 'departamento', 'periodo',
        'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
        'docente_responsable',
    ).prefetch_related(
        'ods', 'asignaturas', 'docentes_adicionales',
        'actividades', 'cronograma',
    )


def get_proyecto_editable(pk, user):
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        raise PermissionDenied('No tienes permisos para modificar este proyecto.')
    if proyecto.estado not in ['borrador', 'observado']:
        raise serializers.ValidationError(
            'Solo se pueden modificar proyectos en estado Borrador u Observado.')
    return proyecto


def _validar_campos_obligatorios(proyecto):
    """Retorna un dict con los errores de validación del ANEXO 4, o {} si es válido."""
    errores = {}

    def req_text(field, label):
        val = getattr(proyecto, field, None)
        if not val or not str(val).strip():
            errores[field] = f'{label} es obligatorio.'

    req_text('titulo', 'El título del proyecto')
    req_text('semestre_academico', 'El semestre académico')
    req_text('meta_cuantitativa', 'La meta cuantificable (1.12)')
    req_text('indicador', 'El indicador (1.13)')
    req_text('lugar_ejecucion', 'El lugar de ejecución (1.18)')
    req_text('fund_por_que_grupo', '¿Por qué se eligió el grupo beneficiario?')
    req_text('fund_para_que_proyecto', '¿Para qué servirá el proyecto?')
    req_text('fund_mecanismo_ensenanza', 'El mecanismo de enseñanza-aprendizaje')
    req_text('diag_estado_grupo', 'El estado actual del grupo beneficiario')
    req_text('diag_problemas_detectados', 'Los problemas detectados')
    req_text('diag_aportes_formacion', 'Los aportes desde la formación profesional')
    req_text('objetivo_general', 'El objetivo general')
    req_text('resultado_en_beneficiarios', 'Los resultados esperados en los beneficiarios')
    req_text('resultado_en_curriculo', 'Los resultados esperados en el proceso curricular')

    if not proyecto.fecha_inicio:
        errores['fecha_inicio'] = 'La fecha de inicio es obligatoria (1.14).'
    if not proyecto.fecha_termino:
        errores['fecha_termino'] = 'La fecha de término es obligatoria (1.16).'
    if not (proyecto.tipo_actividad or []):
        errores['tipo_actividad'] = 'Debe seleccionar al menos un tipo de actividad (1.11).'

    for campo, label in [
        ('eje_rsu_id', 'El eje RSU'),
        ('periodo_id', 'El periodo académico'),
        ('facultad_id', 'La facultad'),
        ('escuela_id', 'La escuela profesional'),
        ('departamento_id', 'El departamento académico'),
    ]:
        if not getattr(proyecto, campo):
            errores[campo.replace('_id', '')] = f'{label} es obligatorio.'

    campos_benef = [
        'benef_comunidad_universitaria', 'benef_inst_educativas_basicas',
        'benef_inst_educativas_especiales', 'benef_gobierno_local',
        'benef_gobierno_regional', 'benef_gobierno_nacional',
        'benef_asociaciones', 'benef_organizaciones_comunales',
        'benef_sector_empresarial', 'benef_sectores_laborales',
        'benef_centros_penitenciarios', 'benef_otro',
    ]
    if not any(getattr(proyecto, c) for c in campos_benef):
        errores['beneficiarios'] = 'Debe seleccionar al menos un tipo de beneficiario (1.9).'

    if not proyecto.ods.all():
        errores['ods'] = 'Debe seleccionar al menos un ODS.'
    if not proyecto.asignaturas.all():
        errores['asignaturas'] = 'Debe registrar al menos una asignatura vinculada (1.5).'

    return errores


class ProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = _proyecto_qs_base().order_by('-created_at')

        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        periodo_id = self.request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        if user.rol and user.rol.nombre == Rol.DOCENTE:
            qs = qs.filter(
                Q(docente_responsable=user) | Q(docentes_adicionales__docente=user)
            ).distinct()

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsDocente()]
        return [IsAuthenticated()]


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = _proyecto_qs_base()

        if user.rol and user.rol.nombre == Rol.DOCENTE:
            if self.request.method == 'DELETE':
                return qs.filter(docente_responsable=user)
            return qs.filter(
                Q(docente_responsable=user) | Q(docentes_adicionales__docente=user)
            ).distinct()
        return qs

    def get_permissions(self):
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def perform_destroy(self, instance):
        if instance.estado != 'borrador':
            raise serializers.ValidationError(
                'Solo se pueden eliminar proyectos en estado Borrador.'
            )
        instance.delete()


class ProyectoEnviarRevisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            proyecto = (
                ProyectoRSU.objects
                .select_related(
                    'facultad', 'escuela', 'departamento', 'periodo',
                    'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
                    'docente_responsable',
                )
                .prefetch_related('ods', 'asignaturas', 'docentes_adicionales',
                                  'actividades', 'cronograma')
                .get(pk=pk)
            )
        except ProyectoRSU.DoesNotExist:
            return Response({'detail': 'Proyecto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if proyecto.docente_responsable != request.user:
            return Response(
                {'detail': 'No tienes permisos para enviar este proyecto a revisión.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if proyecto.estado not in ['borrador', 'observado']:
            return Response(
                {'detail': f'Estado actual {proyecto.estado} no permite envío a revisión.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        errores = _validar_campos_obligatorios(proyecto)
        if errores:
            return Response(
                {'detail': 'Faltan completar campos obligatorios.', 'errors': errores},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proyecto.estado = 'en_revision'
        proyecto.fecha_envio_revision = timezone.now()
        proyecto.save(update_fields=['estado', 'fecha_envio_revision'])

        proyecto = (
            ProyectoRSU.objects
            .prefetch_related('ods', 'asignaturas', 'docentes_adicionales',
                              'actividades', 'cronograma')
            .get(pk=pk)
        )
        serializer = ProyectoRSUSerializer(proyecto, context={'request': request})
        return Response(
            {'detail': 'El proyecto ha sido enviado a revisión exitosamente.', 'proyecto': serializer.data},
            status=status.HTTP_200_OK,
        )


class ActividadProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActividadProyecto.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class ActividadProyectoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return ActividadProyecto.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


class CronogramaAccionListCreateView(generics.ListCreateAPIView):
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CronogramaAccion.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class CronogramaAccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return CronogramaAccion.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


# ─── Presupuesto ─────────────────────────────────────────────────────────────

def _get_proyecto_propietario(pk, user):
    """Verifica que el usuario sea el docente responsable. Sin restricción de estado."""
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        raise PermissionDenied('No tienes permisos para modificar este proyecto.')
    return proyecto


class PartidaPresupuestariaListCreateView(generics.ListCreateAPIView):
    serializer_class = PartidaPresupuestariaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PartidaPresupuestaria.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class PartidaPresupuestariaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PartidaPresupuestariaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return PartidaPresupuestaria.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


class PresupuestoResumenView(APIView):
    """
    GET /proyectos/<pk>/presupuesto/resumen/
    Devuelve el total estimado del proyecto y el desglose por fuente de financiamiento.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_pk):
        get_object_or_404(ProyectoRSU, pk=proyecto_pk)

        partidas = PartidaPresupuestaria.objects.filter(proyecto_id=proyecto_pk)

        total_presupuestado = sum(p.monto_presupuestado for p in partidas)
        total_ejecutado = sum(p.monto_ejecutado for p in partidas)

        desglose = {}
        for p in partidas:
            fuente_key = p.fuente or 'sin_especificar'
            fuente_label = p.get_fuente_display() if p.fuente else 'Sin especificar'
            if fuente_key not in desglose:
                desglose[fuente_key] = {'fuente': fuente_label, 'presupuestado': 0, 'ejecutado': 0}
            desglose[fuente_key]['presupuestado'] += float(p.monto_presupuestado)
            desglose[fuente_key]['ejecutado'] += float(p.monto_ejecutado)

        return Response({
            'proyecto_id': proyecto_pk,
            'total_presupuestado': float(total_presupuestado),
            'total_ejecutado': float(total_ejecutado),
            'nro_partidas': partidas.count(),
            'desglose_por_fuente': list(desglose.values()),
        })


# ─── Metas e Indicadores ─────────────────────────────────────────────────────

def _get_proyecto_seguimiento(pk, user):
    """
    Permite modificar metas/indicadores en estados borrador, observado y en_ejecucion.
    Esto habilita actualizar valor_alcanzado durante la fase de ejecución.
    """
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        raise PermissionDenied('No tienes permisos para modificar este proyecto.')
    estados_validos = ['borrador', 'observado', 'en_ejecucion']
    if proyecto.estado not in estados_validos:
        raise serializers.ValidationError(
            f"No se pueden modificar metas/indicadores con el proyecto en estado '{proyecto.estado}'."
        )
    return proyecto


class MetaIndicadorProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = MetaIndicadorProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MetaIndicadorProyecto.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = _get_proyecto_seguimiento(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class MetaIndicadorProyectoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MetaIndicadorProyectoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return MetaIndicadorProyecto.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        _get_proyecto_seguimiento(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        _get_proyecto_seguimiento(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


# ─── Continuación de proyectos ────────────────────────────────────────────────

class ProyectoContinuarView(APIView):
    """
    POST /proyectos/<pk>/continuar/
    Crea una continuación del proyecto en un nuevo periodo.
    Copia los campos principales, conserva los docentes originales
    y permite añadir nuevos docentes adicionales.

    Body: { "periodo": <id>, "docentes_adicionales": [{"docente": <id>, "rol_en_proyecto": "..."}] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        original = get_object_or_404(
            ProyectoRSU.objects.select_related(
                'facultad', 'escuela', 'departamento',
                'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
                'docente_responsable',
            ).prefetch_related('ods', 'docentes_adicionales__docente'),
            pk=pk,
        )

        if original.docente_responsable != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sin permiso',
                 'detail': 'Solo el docente responsable puede crear una continuación.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        estados_validos = ['aprobado', 'en_ejecucion', 'finalizado']
        if original.estado not in estados_validos:
            return Response(
                {'error': 'Estado inválido',
                 'detail': f'Solo se puede continuar un proyecto en estado: {", ".join(estados_validos)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        periodo_id = request.data.get('periodo')
        if not periodo_id:
            return Response(
                {'error': 'Campo requerido', 'detail': 'Debe indicar el periodo para la continuación.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            nuevo_periodo = PeriodoAcademico.objects.get(pk=periodo_id)
        except PeriodoAcademico.DoesNotExist:
            return Response(
                {'error': 'No encontrado', 'detail': f'No existe un periodo con id={periodo_id}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ProyectoRSU.objects.filter(proyecto_origen=original, periodo=nuevo_periodo).exists():
            return Response(
                {'error': 'Duplicado',
                 'detail': 'Ya existe una continuación de este proyecto para ese periodo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nuevos_docentes = request.data.get('docentes_adicionales', [])

        with transaction.atomic():
            nuevo = ProyectoRSU.objects.create(
                facultad=original.facultad,
                escuela=original.escuela,
                departamento=original.departamento,
                eje_rsu=original.eje_rsu,
                eje_rsu_subitems=original.eje_rsu_subitems,
                eje_rsu_otro_detalle=original.eje_rsu_otro_detalle,
                linea_estrategica=original.linea_estrategica,
                objetivo_institucional=original.objetivo_institucional,
                titulo=f'{original.titulo} (Continuación)',
                anio_carrera=original.anio_carrera,
                es_tesis_quinto_anio=original.es_tesis_quinto_anio,
                docente_responsable=original.docente_responsable,
                periodo=nuevo_periodo,
                semestre_academico=nuevo_periodo.nombre,
                estado='borrador',
                es_continuacion=True,
                proyecto_origen=original,
                fund_por_que_grupo=original.fund_por_que_grupo,
                fund_para_que_proyecto=original.fund_para_que_proyecto,
                fund_mecanismo_ensenanza=original.fund_mecanismo_ensenanza,
                diag_estado_grupo=original.diag_estado_grupo,
                diag_problemas_detectados=original.diag_problemas_detectados,
                diag_aportes_formacion=original.diag_aportes_formacion,
                diag_justificacion_intervencion=original.diag_justificacion_intervencion,
            )
            nuevo.codigo = f'PROY-FIPS-{nuevo.id:04d}'
            nuevo.save(update_fields=['codigo'])

            nuevo.ods.set(original.ods.all())

            # Docentes originales (responsable ya está en docente_responsable, copiar adicionales)
            for pd in original.docentes_adicionales.all():
                ProyectoDocente.objects.create(
                    proyecto=nuevo,
                    docente=pd.docente,
                    rol_en_proyecto=pd.rol_en_proyecto,
                )

            # Nuevos docentes adicionales enviados en el request
            for item in nuevos_docentes:
                docente_id = item.get('docente')
                rol = item.get('rol_en_proyecto', 'Colaborador')
                if docente_id:
                    ProyectoDocente.objects.get_or_create(
                        proyecto=nuevo,
                        docente_id=docente_id,
                        defaults={'rol_en_proyecto': rol},
                    )

        serializer = ProyectoRSUSerializer(
            _proyecto_qs_base().get(pk=nuevo.pk),
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
