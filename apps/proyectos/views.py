from rest_framework import generics, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
from apps.utils.permissions import IsOwnerOrReadOnly, IsDocente
from .models import ProyectoRSU, ObjetivoEspecifico, ActividadProyecto, CronogramaAccion
from .serializers import (
    ProyectoRSUSerializer,
    ObjetivoEspecificoSerializer,
    ActividadProyectoSerializer,
    CronogramaAccionSerializer,
)
from apps.usuarios.models import Rol


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_proyecto_editable(pk, user):
    """
    Retorna el proyecto si existe y el usuario tiene permiso de edición.
    Lanza Response con error si no.
    """
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        return None, Response(
            {'detail': 'No tienes permisos para modificar este proyecto.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    if proyecto.estado not in ['borrador', 'observado']:
        return None, Response(
            {'detail': 'Solo se pueden modificar proyectos en estado Borrador u Observado.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return proyecto, None


# ──────────────────────────────────────────────────────────────────────────────
# Proyecto principal – CRUD
# ──────────────────────────────────────────────────────────────────────────────

class ProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ProyectoRSU.objects.all().select_related(
            'facultad', 'escuela', 'departamento', 'periodo',
            'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
            'docente_responsable',
        ).prefetch_related(
            'ods', 'asignaturas', 'docentes_adicionales',
            'objetivos_especificos', 'actividades', 'cronograma',
        ).order_by('-created_at')

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
        elif user.rol and user.rol.nombre == Rol.ESTUDIANTE:
            qs = qs.filter(estado='aprobado')

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsDocente()]
        return [IsAuthenticated()]


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ProyectoRSU.objects.all().select_related(
            'facultad', 'escuela', 'departamento', 'periodo',
            'eje_rsu', 'linea_estrategica', 'objetivo_institucional',
            'docente_responsable',
        ).prefetch_related(
            'ods', 'asignaturas', 'docentes_adicionales',
            'objetivos_especificos', 'actividades', 'cronograma',
        )
        if user.rol and user.rol.nombre == Rol.DOCENTE:
            return qs.filter(
                Q(docente_responsable=user) | Q(docentes_adicionales__docente=user)
            ).distinct()
        elif user.rol and user.rol.nombre == Rol.ESTUDIANTE:
            return qs.filter(estado='aprobado')
        return qs

    def get_permissions(self):
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def perform_destroy(self, instance):
        if instance.estado != 'borrador':
            raise serializers.ValidationError(
                'Solo se pueden eliminar proyectos en estado Borrador.'
            )
        instance.delete()


# ──────────────────────────────────────────────────────────────────────────────
# Envío a revisión
# ──────────────────────────────────────────────────────────────────────────────

class ProyectoEnviarRevisionView(APIView):
    """
    POST /api/proyectos/<id>/enviar-revision/
    Valida todos los campos obligatorios del ANEXO 4 y cambia el estado a en_revision.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            proyecto = ProyectoRSU.objects.get(pk=pk)
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

        errores = {}

        def req_text(field, label):
            val = getattr(proyecto, field, None)
            if not val or not str(val).strip():
                errores[field] = f'{label} es obligatorio.'

        # Sección I
        req_text('titulo', 'El título del proyecto')
        req_text('semestre_academico', 'El semestre académico')
        req_text('meta_cuantitativa', 'La meta cuantificable (1.12)')
        req_text('indicador', 'El indicador (1.13)')
        req_text('lugar_ejecucion', 'El lugar de ejecución (1.18)')

        if not proyecto.fecha_inicio:
            errores['fecha_inicio'] = 'La fecha de inicio es obligatoria (1.14).'
        if not proyecto.fecha_termino:
            errores['fecha_termino'] = 'La fecha de término es obligatoria (1.16).'

        tipos = proyecto.tipo_actividad or []
        if not tipos:
            errores['tipo_actividad'] = 'Debe seleccionar al menos un tipo de actividad (1.11).'

        # Sección II
        req_text('fund_por_que_grupo', '¿Por qué se eligió el grupo beneficiario?')
        req_text('fund_para_que_proyecto', '¿Para qué servirá el proyecto?')
        req_text('fund_mecanismo_ensenanza', 'El mecanismo de enseñanza-aprendizaje')

        # Sección III
        req_text('diag_estado_grupo', 'El estado actual del grupo beneficiario')
        req_text('diag_problemas_detectados', 'Los problemas detectados')
        req_text('diag_aportes_formacion', 'Los aportes desde la formación profesional')

        # Sección IV
        req_text('objetivo_general', 'El objetivo general')

        # Sección V
        req_text('resultado_en_beneficiarios', 'Los resultados esperados en los beneficiarios')
        req_text('resultado_en_curriculo', 'Los resultados esperados en el proceso curricular')

        # Relaciones obligatorias
        if not proyecto.eje_rsu_id:
            errores['eje_rsu'] = 'El eje RSU es obligatorio.'
        if not proyecto.periodo_id:
            errores['periodo'] = 'El periodo académico es obligatorio.'
        if not proyecto.facultad_id:
            errores['facultad'] = 'La facultad es obligatoria.'
        if not proyecto.escuela_id:
            errores['escuela'] = 'La escuela profesional es obligatoria.'
        if not proyecto.departamento_id:
            errores['departamento'] = 'El departamento académico es obligatorio.'

        # Al menos un beneficiario
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

        if proyecto.ods.count() == 0:
            errores['ods'] = 'Debe seleccionar al menos un ODS.'
        if proyecto.asignaturas.count() == 0:
            errores['asignaturas'] = 'Debe registrar al menos una asignatura vinculada (1.5).'

        if errores:
            return Response(
                {'detail': 'Faltan completar campos obligatorios.', 'errors': errores},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proyecto.estado = 'en_revision'
        proyecto.fecha_envio_revision = timezone.now()
        proyecto.save(update_fields=['estado', 'fecha_envio_revision'])

        serializer = ProyectoRSUSerializer(proyecto, context={'request': request})
        return Response(
            {'detail': 'El proyecto ha sido enviado a revisión exitosamente.', 'proyecto': serializer.data},
            status=status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────────────────────────────────────
# IV. Objetivos Específicos – CRUD independiente
# ──────────────────────────────────────────────────────────────────────────────

class ObjetivoEspecificoListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/proyectos/<proyecto_pk>/objetivos/   → lista objetivos específicos
    POST /api/proyectos/<proyecto_pk>/objetivos/   → agrega uno nuevo
    """
    serializer_class = ObjetivoEspecificoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ObjetivoEspecifico.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            raise serializer.ValidationError(error.data)
        serializer.save(proyecto=proyecto)


class ObjetivoEspecificoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/proyectos/<proyecto_pk>/objetivos/<pk>/
    PATCH  /api/proyectos/<proyecto_pk>/objetivos/<pk>/
    DELETE /api/proyectos/<proyecto_pk>/objetivos/<pk>/
    """
    serializer_class = ObjetivoEspecificoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ObjetivoEspecifico.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def check_editable(self):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            return error
        return None

    def update(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().destroy(request, *args, **kwargs)


# ──────────────────────────────────────────────────────────────────────────────
# VI. Actividades – CRUD independiente
# ──────────────────────────────────────────────────────────────────────────────

class ActividadProyectoListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/proyectos/<proyecto_pk>/actividades/
    POST /api/proyectos/<proyecto_pk>/actividades/
    """
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActividadProyecto.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden', 'fecha')

    def perform_create(self, serializer):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            raise serializers.ValidationError(error.data)
        serializer.save(proyecto=proyecto)


class ActividadProyectoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/proyectos/<proyecto_pk>/actividades/<pk>/
    PATCH  /api/proyectos/<proyecto_pk>/actividades/<pk>/
    DELETE /api/proyectos/<proyecto_pk>/actividades/<pk>/
    """
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActividadProyecto.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def check_editable(self):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            return error
        return None

    def update(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().destroy(request, *args, **kwargs)


# ──────────────────────────────────────────────────────────────────────────────
# VII. Cronograma – CRUD independiente
# ──────────────────────────────────────────────────────────────────────────────

class CronogramaAccionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/proyectos/<proyecto_pk>/cronograma/
    POST /api/proyectos/<proyecto_pk>/cronograma/
    """
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CronogramaAccion.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            raise serializers.ValidationError(error.data)
        serializer.save(proyecto=proyecto)


class CronogramaAccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/proyectos/<proyecto_pk>/cronograma/<pk>/
    PATCH  /api/proyectos/<proyecto_pk>/cronograma/<pk>/
    DELETE /api/proyectos/<proyecto_pk>/cronograma/<pk>/
    """
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CronogramaAccion.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def check_editable(self):
        proyecto, error = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        if error:
            return error
        return None

    def update(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self.check_editable()
        if err:
            return err
        return super().destroy(request, *args, **kwargs)
