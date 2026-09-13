"""
Punto de entrada ASGI del backend RSU.

Expone el objeto `application` que usan los servidores ASGI asincronos
(Uvicorn, Daphne). El proyecto es sincrono hoy, pero se mantiene el archivo
para poder desplegar sobre ASGI sin cambios.

Conecta con:
- config/settings.py: configuracion que carga al arrancar.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_asgi_application()
