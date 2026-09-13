"""
Enrutador raiz del backend RSU.

Publica toda la API bajo el prefijo /api/v1/ y monta los tres modulos
funcionales del sistema, ademas del panel de administracion de Django y la
documentacion OpenAPI generada con drf-spectacular.

Rutas principales:
- /admin/                 panel de administracion de Django
- /api/v1/                usuarios, planificacion y proyectos
- /api/v1/schema/         esquema OpenAPI en formato JSON
- /api/v1/docs/           interfaz Swagger
- /api/v1/redoc/          interfaz Redoc

Tambien sirve los archivos subidos (MEDIA_ROOT) para poder abrir firmas,
documentos de sustento y evidencias sin un servidor de archivos aparte. Esto
se registra siempre, no solo en DEBUG. OJO: el helper static() de Django
(django.conf.urls.static) hace un no-op silencioso cuando DEBUG=False, asi
que no sirve para esto; se arma la ruta a mano con re_path() + serve() para
que exista tambien en produccion. Sin ella ningun archivo subido puede verse
via HTTP aunque se haya guardado correctamente, para ningun usuario. En un
despliegue con mas volumen de archivos convendria pasar esto a Nginx o a un
storage tipo S3, pero para el tamano actual del proyecto alcanza con que
Django la sirva.

Conecta con:
- apps/usuarios/urls.py: autenticacion, usuarios y catalogos institucionales.
- apps/planificacion/urls.py: periodos, ejes RSU, ODS y matriz operativa.
- apps/proyectos/urls.py: proyectos RSU, revision, seguimiento e informes.
- config/settings.py: de donde toma MEDIA_URL y MEDIA_ROOT.
"""
import re

from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

API_V1 = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),
    path(API_V1, include('apps.usuarios.urls')),
    path(API_V1, include('apps.planificacion.urls')),
    path(API_V1, include('apps.proyectos.urls')),

    path(API_V1 + 'schema/', SpectacularAPIView.as_view(), name='schema'),
    path(API_V1 + 'docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path(API_V1 + 'redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    re_path(
        r'^%s(?P<path>.*)$' % re.escape(settings.MEDIA_URL.lstrip('/')),
        serve, {'document_root': settings.MEDIA_ROOT},
    ),
]
