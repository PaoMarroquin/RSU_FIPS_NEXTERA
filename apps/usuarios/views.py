from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Rol, Usuario, HistorialRolUsuario
from .serializers import (
    AsignarRolSerializer,
    RolSerializer,
    UsuarioCreateSerializer,
    UsuarioEditSerializer,
    UsuarioListSerializer,
)


class UsuarioListCreateView(generics.ListCreateAPIView):
    queryset = Usuario.objects.select_related('rol', 'facultad').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UsuarioCreateSerializer
        return UsuarioListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [IsAuthenticated()]


class UsuarioRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.select_related('rol', 'facultad', 'escuela', 'departamento').all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UsuarioEditSerializer
        return UsuarioListSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdminUser()]
        return [IsAuthenticated()]


@api_view(['POST'])
@permission_classes([IsAdminUser])
def asignar_rol(request, pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AsignarRolSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    rol_anterior = usuario.rol
    rol_nuevo = serializer.validated_data['rol_id']
    motivo = serializer.validated_data.get('motivo', '')

    HistorialRolUsuario.objects.create(
        usuario=usuario,
        cambiado_por=request.user,
        rol_anterior=rol_anterior,
        rol_nuevo=rol_nuevo,
        motivo=motivo,
    )

    usuario.rol = rol_nuevo
    usuario.save(update_fields=['rol'])

    return Response({'detail': f'Rol asignado: {rol_nuevo.nombre}'}, status=status.HTTP_200_OK)


class RolListView(generics.ListAPIView):
    queryset = Rol.objects.filter(activo=True)
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]
