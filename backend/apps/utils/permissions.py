from rest_framework import permissions
from apps.usuarios.models import Rol


class IsCoordinadorRSU(permissions.BasePermission):
    """Allows access only to users with 'Coordinador RSU' or 'Administrador' role."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre in [Rol.COORDINADOR, Rol.ADMINISTRADOR]
        )


class IsDocente(permissions.BasePermission):
    """Allows access only to users with 'Docente' role."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.DOCENTE
        )


class IsComite(permissions.BasePermission):
    """Allows access only to users with 'Comite' role."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.COMITE
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


class IsAutoridadUniversitaria(permissions.BasePermission):
    """Allows access only to users with 'Autoridad Universitaria' role (solo consulta)."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol and
            request.user.rol.nombre == Rol.AUTORIDAD
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Safe methods are always allowed.
    Write methods (PATCH/PUT) require the user to be the object owner
    OR to hold an administrative role (Administrador / Coordinador RSU / Comité RSU).
    DELETE is intentionally excluded here: the view's queryset already
    filters to owner-only results, producing a 404 for non-owners.
    """
    _ROLES_ADMIN = [Rol.ADMINISTRADOR, Rol.COORDINADOR, Rol.COMITE]

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.rol and request.user.rol.nombre in self._ROLES_ADMIN:
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
