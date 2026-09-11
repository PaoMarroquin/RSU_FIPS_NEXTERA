"""
Permisos de DRF reutilizables, basados en el rol del usuario.

Centraliza las reglas de "quien puede hacer que" para no repetir
comprobaciones de rol en cada vista. Todas las clases leen
`request.user.rol.nombre` y lo comparan contra las constantes del modelo Rol,
de modo que renombrar un rol solo obliga a tocar apps/usuarios/models.py.

Los cuatro roles del sistema son Administrador, Docente, Departamento y
Jefatura RSU. `is_staff` siempre equivale a Administrador.

Permisos disponibles:
- IsDocente, IsAdministrador, IsJefaturaRSU, IsDepartamento: exigen un rol
  concreto.
- IsDocenteOrAdmin: creacion de proyectos.
- IsOwnerOrReadOnly, IsOwnerOrAdmin: permisos a nivel de objeto.

Conecta con:
- apps/usuarios/models.py: constantes de Rol contra las que se compara.
- apps/proyectos/views.py, apps/proyectos/views_reportes.py y
  apps/planificacion/views.py: vistas que declaran estos permisos.
"""
from rest_framework import permissions
from apps.usuarios.models import Rol


class IsDocente(permissions.BasePermission):
    """Solo el rol Docente. Se usa en las acciones propias del formulador
    del proyecto (registrar avances, editar su propio proyecto)."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.DOCENTE
        )


class IsAdministrador(permissions.BasePermission):
    """Solo el rol Administrador. `is_staff` cuenta como Administrador para
    que el superusuario de Django no quede fuera de la API."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_staff or
                (request.user.rol and request.user.rol.nombre == Rol.ADMINISTRADOR)
            )
        )


class IsDocenteOrAdmin(permissions.BasePermission):
    """Docente o Administrador. Se usa al crear proyectos: el docente crea el
    suyo y el Administrador puede crear en nombre de otro durante la carga
    inicial."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        if request.user.rol and request.user.rol.nombre in [Rol.DOCENTE, Rol.ADMINISTRADOR]:
            return True
        return False


class IsJefaturaRSU(permissions.BasePermission):
    """Solo el rol Jefatura RSU, que coordina la matriz operativa de su
    facultad y consulta los informes institucionales."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.JEFATURA
        )


class IsDepartamento(permissions.BasePermission):
    """Solo el rol Departamento, que revisa, aprueba u observa los proyectos
    de su departamento academico."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.DEPARTAMENTO
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Lectura para todos; escritura solo para el dueno o un rol de revision.

    Los metodos seguros (GET, HEAD, OPTIONS) siempre pasan. Para escribir
    (PUT, PATCH, DELETE) hay que ser el dueno del objeto o tener un rol
    administrativo: Administrador, Jefatura RSU o Departamento.

    Se considera dueno al `docente_responsable` (proyectos) o al
    `coordinador` (matriz operativa), segun el atributo que exista.
    """
    _ROLES_REVISION = [Rol.ADMINISTRADOR, Rol.JEFATURA, Rol.DEPARTAMENTO]

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_staff or (request.user.rol and request.user.rol.nombre in self._ROLES_REVISION):
            return True

        if hasattr(obj, 'docente_responsable'):
            return obj.docente_responsable == request.user
        if hasattr(obj, 'coordinador'):
            return obj.coordinador == request.user
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permiso a nivel de objeto para el propio usuario.

    Lectura para todos; escritura solo si el objeto es el propio usuario o
    quien pide es Administrador. Se usa en el perfil (/usuarios/me/) y en la
    edicion de cuentas.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user or request.user.is_staff
