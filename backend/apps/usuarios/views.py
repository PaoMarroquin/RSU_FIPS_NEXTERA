from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.utils.permissions import IsOwnerOrAdmin
from .models import (
    AuditoriaUsuario,
    DepartamentoAcademico,
    EscuelaProfesional,
    Facultad,
    HistorialRolUsuario,
    Rol,
    Sesion,
    Usuario,
)
from .serializers import (
    AsignarRolSerializer,
    AuditoriaUsuarioSerializer,
    DepartamentoAcademicoSerializer,
    EscuelaProfesionalSerializer,
    FacultadSerializer,
    HistorialRolSerializer,
    MiPerfilUpdateSerializer,
    RolSerializer,
    UsuarioCreateSerializer,
    UsuarioEditSerializer,
    UsuarioListSerializer,
)

try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token
    from google.auth.exceptions import TransportError as GoogleTransportError
    _GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    _GOOGLE_AUTH_AVAILABLE = False


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _create_session(usuario, refresh, request):
    expira_en = datetime.fromtimestamp(refresh.payload['exp'], tz=dt_timezone.utc)
    Sesion.objects.create(
        usuario=usuario,
        token=str(refresh),
        expira_en=expira_en,
        ip_address=_get_client_ip(request),
    )


def _registrar_auditoria(ejecutado_por, usuario_afectado, accion, detalle='', request=None):
    ip = _get_client_ip(request) if request else None
    AuditoriaUsuario.objects.create(
        ejecutado_por=ejecutado_por,
        usuario_afectado=usuario_afectado,
        accion=accion,
        detalle=detalle,
        ip_address=ip,
    )


class CorreoTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = Usuario.USERNAME_FIELD

    def validate(self, attrs):
        correo = attrs.get(self.username_field, '')
        try:
            candidato = Usuario.objects.get(correo_institucional=correo)
            if candidato.estado == 'inactivo':
                raise PermissionDenied('Usuario inactivo. Contacte al administrador.')
        except Usuario.DoesNotExist:
            pass

        data = super().validate(attrs)
        data['usuario'] = {
            'id': self.user.id,
            'nombres': self.user.nombres,
            'correo_institucional': self.user.correo_institucional,
            'rol': self.user.rol.nombre if self.user.rol else None,
            'estado': self.user.estado,
        }
        return data


class SessionLoginView(TokenObtainPairView):
    serializer_class = CorreoTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh = RefreshToken(response.data['refresh'])
            usuario = Usuario.objects.get(pk=refresh['user_id'])
            _create_session(usuario, refresh, request)
            usuario.ultimo_acceso = timezone.now()
            usuario.save(update_fields=['ultimo_acceso'])
        return response


class SessionTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        token_str = request.data.get('refresh', '')
        session_exists = Sesion.objects.filter(
            token=token_str,
            expira_en__gt=timezone.now(),
        ).exists()
        if not session_exists:
            return Response(
                {'detail': 'Sesión inválida o expirada.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token_str = request.data.get('refresh')
        if not token_str:
            return Response(
                {'detail': 'refresh token es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = Sesion.objects.filter(
            token=token_str,
            usuario=request.user,
        ).delete()
        if not deleted:
            return Response(
                {'detail': 'Sesión no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID or not _GOOGLE_AUTH_AVAILABLE:
            return Response(
                {'detail': 'Google OAuth no está configurado aún. Use login con correo y contraseña.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        token_str = request.data.get('id_token')
        if not token_str:
            return Response(
                {'detail': 'id_token es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            idinfo = google_id_token.verify_oauth2_token(
                token_str,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10,
            )
        except ValueError:
            return Response(
                {'detail': 'Token de Google inválido o expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except GoogleTransportError:
            return Response(
                {'detail': 'No se pudo verificar el token. Intente nuevamente.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not idinfo.get('email_verified'):
            return Response(
                {'detail': 'El correo Google no está verificado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = idinfo.get('email', '')
        if not email.endswith('@unsa.edu.pe'):
            return Response(
                {'detail': 'Solo se permite acceso con correo institucional @unsa.edu.pe.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        nombre = idinfo.get('name', email)
        es_nuevo = False

        try:
            usuario = Usuario.objects.select_related('rol').get(correo_institucional=email)
            update_fields = ['ultimo_acceso']
            if not usuario.nombres:
                usuario.nombres = nombre
                update_fields.append('nombres')
            usuario.ultimo_acceso = timezone.now()
            usuario.save(update_fields=update_fields)
        except Usuario.DoesNotExist:
            try:
                usuario = Usuario.objects.create_user(
                    correo_institucional=email,
                    password=None,
                    nombres=nombre,
                )
                es_nuevo = True
            except IntegrityError:
                usuario = Usuario.objects.select_related('rol').get(correo_institucional=email)

        if usuario.estado == 'inactivo':
            return Response(
                {'detail': 'Usuario inactivo. Contacte al administrador.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(usuario)
        _create_session(usuario, refresh, request)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': {
                'id': usuario.id,
                'nombres': usuario.nombres,
                'correo_institucional': usuario.correo_institucional,
                'rol': usuario.rol.nombre if usuario.rol else None,
                'es_nuevo': es_nuevo,
            },
        }, status=status.HTTP_200_OK)


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

    def perform_create(self, serializer):
        usuario = serializer.save()
        _registrar_auditoria(
            ejecutado_por=self.request.user,
            usuario_afectado=usuario,
            accion='CREAR',
            detalle=f'Usuario creado: {usuario.correo_institucional}',
            request=self.request,
        )


class UsuarioRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.select_related('rol', 'facultad', 'escuela', 'departamento').all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UsuarioEditSerializer
        return UsuarioListSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdminUser()]
        if self.request.method in ('PUT', 'PATCH'):
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        usuario = serializer.save()
        if usuario.estado == 'inactivo':
            accion = 'DESACTIVAR'
        elif usuario.estado == 'activo':
            accion = 'ACTIVAR'
        else:
            accion = 'EDITAR'
        _registrar_auditoria(
            ejecutado_por=self.request.user,
            usuario_afectado=usuario,
            accion=accion,
            detalle=f'Usuario editado: {usuario.correo_institucional}',
            request=self.request,
        )


class MiPerfilView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MiPerfilUpdateSerializer
        return UsuarioListSerializer


class AsignarRolView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AsignarRolSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        rol_anterior = usuario.rol
        rol_nuevo    = serializer.validated_data['rol_id']
        motivo       = serializer.validated_data.get('motivo', '')

        HistorialRolUsuario.objects.create(
            usuario=usuario,
            cambiado_por=request.user,
            rol_anterior=rol_anterior,
            rol_nuevo=rol_nuevo,
            motivo=motivo,
        )
        usuario.rol = rol_nuevo
        usuario.save(update_fields=['rol', 'updated_at'])

        _registrar_auditoria(
            ejecutado_por=request.user,
            usuario_afectado=usuario,
            accion='CAMBIAR_ROL',
            detalle=f'Rol: {rol_anterior} → {rol_nuevo}. Motivo: {motivo}',
            request=request,
        )

        return Response({
            'detail': f'Rol asignado: {rol_nuevo.nombre}',
            'usuario': UsuarioListSerializer(usuario).data,
        }, status=status.HTTP_200_OK)


class RolListView(generics.ListAPIView):
    queryset = Rol.objects.filter(activo=True)
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]


class FacultadListView(generics.ListAPIView):
    queryset = Facultad.objects.all().order_by('nombre')
    serializer_class = FacultadSerializer
    permission_classes = [IsAuthenticated]


class EscuelaProfesionalListView(generics.ListAPIView):
    serializer_class = EscuelaProfesionalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EscuelaProfesional.objects.all().order_by('nombre')
        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)
        return qs


class DepartamentoAcademicoListView(generics.ListAPIView):
    serializer_class = DepartamentoAcademicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DepartamentoAcademico.objects.all().order_by('nombre')
        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)
        return qs


class HistorialRolUsuarioListView(generics.ListAPIView):
    serializer_class = HistorialRolSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            HistorialRolUsuario.objects
            .filter(usuario_id=self.kwargs['pk'])
            .select_related('cambiado_por', 'rol_anterior', 'rol_nuevo')
            .order_by('-created_at')
        )


class AuditoriaListView(generics.ListAPIView):
    queryset = (
        AuditoriaUsuario.objects
        .select_related('ejecutado_por', 'usuario_afectado')
        .order_by('-created_at')
    )
    serializer_class = AuditoriaUsuarioSerializer
    permission_classes = [IsAdminUser]
