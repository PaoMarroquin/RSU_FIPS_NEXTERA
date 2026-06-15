from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from apps.utils.permissions import IsOwnerOrReadOnly
from .models import ProyectoRSU
from .serializers import ProyectoRSUSerializer
from apps.usuarios.models import Rol

class ProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = ProyectoRSU.objects.all().order_by('-created_at')

        # Filter by faculty if query param is set
        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)

        # Filter by state if query param is set
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        # If user is Docente, they can only see projects they are responsible for, or participate in
        if user.rol and user.rol.nombre == Rol.DOCENTE:
            qs = qs.filter(
                Q(docente_responsable=user) | Q(docentes_adicionales__docente=user)
            ).distinct()
        
        # If user is Estudiante, they can only see projects they participate in or approved projects
        elif user.rol and user.rol.nombre == Rol.ESTUDIANTE:
            qs = qs.filter(estado='aprobado')

        return qs

    def get_permissions(self):
        return [IsAuthenticated()]


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProyectoRSU.objects.all()
    serializer_class = ProyectoRSUSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsOwnerOrReadOnly()]


class ProyectoEnviarRevisionView(APIView):
    """
    POST /api/proyectos/<id>/enviar-revision/
    Submits the project for review after validating that all required fields are filled.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            proyecto = ProyectoRSU.objects.get(pk=pk)
        except ProyectoRSU.DoesNotExist:
            return Response(
                {'detail': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify ownership
        if proyecto.docente_responsable != request.user:
            return Response(
                {'detail': 'No tienes permisos para enviar este proyecto a revisión.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify current state
        if proyecto.estado not in ['borrador', 'observado']:
            return Response(
                {'detail': f'Solo se pueden enviar a revisión proyectos en estado Borrador u Observado. Estado actual: {proyecto.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validation logic for sending to review
        errores = {}

        if not proyecto.titulo or not proyecto.titulo.strip():
            errores['titulo'] = 'El título del proyecto es obligatorio.'

        if not proyecto.descripcion_general or not proyecto.descripcion_general.strip():
            errores['descripcion_general'] = 'La descripción general es obligatoria.'

        if not proyecto.fundamentacion or not proyecto.fundamentacion.strip():
            errores['fundamentacion'] = 'La fundamentación es obligatoria.'

        if not proyecto.diagnostico_situacional or not proyecto.diagnostico_situacional.strip():
            errores['diagnostico_situacional'] = 'El diagnóstico situacional es obligatorio.'

        if not proyecto.eje_rsu:
            errores['eje_rsu'] = 'El eje RSU es obligatorio.'

        if not proyecto.linea_estrategica:
            errores['linea_estrategica'] = 'La línea estratégica es obligatoria.'

        if not proyecto.objetivo_institucional:
            errores['objetivo_institucional'] = 'El objetivo institucional es obligatorio.'

        if not proyecto.periodo:
            errores['periodo'] = 'El periodo académico es obligatorio.'

        if not proyecto.facultad:
            errores['facultad'] = 'La facultad es obligatoria.'

        if not proyecto.escuela:
            errores['escuela'] = 'La escuela profesional es obligatoria.'

        if not proyecto.departamento:
            errores['departamento'] = 'El departamento académico es obligatorio.'

        if not proyecto.semestre_academico or not proyecto.semestre_academico.strip():
            errores['semestre_academico'] = 'El semestre académico es obligatorio.'

        if not proyecto.anio_carrera:
            errores['anio_carrera'] = 'El año de carrera es obligatorio.'

        # Check relationships
        if proyecto.ods.count() == 0:
            errores['ods'] = 'Debe seleccionar al menos un Objetivo de Desarrollo Sostenible (ODS).'

        if proyecto.asignaturas.count() == 0:
            errores['asignaturas'] = 'Debe registrar al menos una asignatura vinculada.'

        if errores:
            return Response(
                {
                    'detail': 'Faltan completar campos obligatorios para enviar a revisión.',
                    'errors': errores
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status and dates
        proyecto.estado = 'en_revision'
        proyecto.fecha_envio_revision = timezone.now()
        proyecto.save(update_fields=['estado', 'fecha_envio_revision'])

        serializer = ProyectoRSUSerializer(proyecto, context={'request': request})
        return Response(
            {
                'detail': 'El proyecto ha sido enviado a revisión exitosamente.',
                'proyecto': serializer.data
            },
            status=status.HTTP_200_OK
        )
