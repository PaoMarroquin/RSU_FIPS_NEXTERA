"""
Configuracion de la aplicacion Django "proyectos".

Conecta con:
- config/settings.py: donde se declara en INSTALLED_APPS.
"""
from django.apps import AppConfig


class ProyectosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.proyectos'
