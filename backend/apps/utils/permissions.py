from rest_framework import permissions
from apps.usuarios.models import Rol


class IsDocente(permissions.BasePermission):
    """Allows access only to users with 'Docente' role."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.DOCENTE
        )


class IsAdministrador(permissions.BasePermission):
    """Allows access only to users with 'Administrador' role or is_staff."""
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
    """Allows access to Docente or Administrador (used for creating proyectos)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        if request.user.rol and request.user.rol.nombre in [Rol.DOCENTE, Rol.ADMINISTRADOR]:
            return True
        return False


class IsJefaturaRSU(permissions.BasePermission):
    """Allows access only to Jefatura RSU."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.JEFATURA
        )


class IsDepartamento(permissions.BasePermission):
    """Allows access only to Departamento."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.DEPARTAMENTO
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Safe methods are always allowed.
    Write methods (PATCH/PUT) require the user to be the object owner
    OR to hold an administrative role (Administrador / Jefatura RSU / Departamento).
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
    """Object-level: allows writes only to the object owner or an admin/staff user."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user or request.user.is_staff
