"""
Punto de entrada WSGI del backend RSU.

Expone el objeto `application` que usan los servidores WSGI sincronos
(Gunicorn, uWSGI, mod_wsgi) para servir el proyecto en produccion.

Conecta con:
- config/settings.py: configuracion que carga al arrancar.
- Dockerfile y docker-compose.yml: donde se referencia config.wsgi.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
