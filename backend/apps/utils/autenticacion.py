"""
JWT con cambio de contraseña obligatorio.

Un usuario creado por el Administrador (o importado) entra con una contraseña
inicial conocida, por defecto su correo. Mientras no la cambie
(debe_cambiar_password=True) solo puede usar las rutas necesarias para
cambiarla; el resto responde 403 con el código "cambio_password_requerido".
"""
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

RUTAS_PERMITIDAS = (
    '/api/v1/usuarios/me/',
    '/api/v1/usuarios/me/cambiar-password/',
    '/api/v1/auth/logout/',
    '/api/v1/auth/token/refresh/',
)


class CambioPasswordRequerido(exceptions.PermissionDenied):
    default_detail = 'Debe cambiar su contraseña inicial antes de continuar.'
    default_code = 'cambio_password_requerido'


class JWTConCambioObligatorio(JWTAuthentication):

    def authenticate(self, request):
        resultado = super().authenticate(request)
        if resultado is None:
            return None
        usuario, _ = resultado
        if getattr(usuario, 'debe_cambiar_password', False) and request.path not in RUTAS_PERMITIDAS:
            raise CambioPasswordRequerido()
        return resultado
