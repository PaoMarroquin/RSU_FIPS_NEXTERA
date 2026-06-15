from rest_framework import permissions
from apps.usuarios.models import Rol

class IsCoordinador(permissions.BasePermission):
    """
    Allows access only to authenticated users with 'Coordinador' or 'Administrador' role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.rol and 
            request.user.rol.nombre in [Rol.COORDINADOR, Rol.ADMINISTRADOR]
        )

class IsDocente(permissions.BasePermission):
    """
    Allows access only to authenticated users with 'Docente' role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.rol and 
            request.user.rol.nombre == Rol.DOCENTE
        )

class IsComite(permissions.BasePermission):
    """
    Allows access only to authenticated users with 'Comite' role.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.rol and 
            request.user.rol.nombre == Rol.COMITE
        )

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'docente_responsable'):
            return obj.docente_responsable == request.user
        if hasattr(obj, 'coordinador'):
            return obj.coordinador == request.user
        return False
