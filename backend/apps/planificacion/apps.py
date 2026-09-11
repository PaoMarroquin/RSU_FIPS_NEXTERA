"""
Configuracion de la aplicacion Django "planificacion".

Conecta con:
- config/settings.py: donde se declara en INSTALLED_APPS.
"""
from django.apps import AppConfig


class PlanificacionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.planificacion'
