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

En modo DEBUG tambien sirve los archivos subidos (MEDIA_ROOT) para poder
probar firmas, documentos de sustento y evidencias sin un servidor de
archivos aparte.

Conecta con:
- apps/usuarios/urls.py: autenticacion, usuarios y catalogos institucionales.
- apps/planificacion/urls.py: periodos, ejes RSU, ODS y matriz operativa.
- apps/proyectos/urls.py: proyectos RSU, revision, seguimiento e informes.
- config/settings.py: de donde toma DEBUG, MEDIA_URL y MEDIA_ROOT.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
