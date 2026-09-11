"""
Configuracion de la aplicacion Django "usuarios".

Declara el nombre completo del paquete (apps.usuarios) y el tipo de clave
primaria por defecto.

Conecta con:
- config/settings.py: donde se declara en INSTALLED_APPS.
"""
from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.usuarios'
