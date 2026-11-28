"""
Configuracion global del proyecto Django del backend RSU.

Define aplicaciones instaladas, base de datos PostgreSQL, autenticacion JWT,
CORS para el frontend React, documentacion OpenAPI y rutas de archivos
subidos (firmas, documentos de sustento, evidencias).

Los valores sensibles no estan escritos aqui: se leen del archivo .env con
python-decouple (SECRET_KEY, credenciales de base de datos, GOOGLE_CLIENT_ID,
origenes CORS permitidos).

Puntos clave:
- AUTH_USER_MODEL apunta a usuarios.Usuario: el login es por correo
  institucional, no por username.
- El manejador de errores de la API esta centralizado en
  apps.utils.exceptions.custom_exception_handler.

Conecta con:
- config/urls.py: enrutador raiz que se declara en ROOT_URLCONF.
- apps/usuarios/models.py: define el modelo Usuario referenciado por
  AUTH_USER_MODEL.
- apps/utils/exceptions.py: formato uniforme de los errores de la API.
- .env: variables de entorno del despliegue.
"""
from pathlib import Path
from datetime import timedelta

from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY')
# Apagado si no se define: con DEBUG=True cualquier error 500 devuelve la traza
# completa (rutas, código y variables) a quien haga la petición.
DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    # Propias
    'apps.usuarios',
    'apps.planificacion',
    'apps.proyectos',
    'apps.archivos',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST'),
        'PORT': config('POSTGRES_PORT'),
    }
}

AUTH_USER_MODEL = 'usuarios.Usuario'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.utils.autenticacion.JWTConCambioObligatorio',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'apps.utils.exceptions.custom_exception_handler',
    # Límite de intentos de inicio de sesión (por IP), contra fuerza bruta.
    'DEFAULT_THROTTLE_RATES': {
        'login': config('LOGIN_THROTTLE_RATE', default='10/min'),
    },
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'RSU FIPS NEXTERA API',
    'DESCRIPTION': 'Documentación de la API del sistema RSU FIPS NEXTERA',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)
# El navegador oculta las cabeceras de respuesta que no se expongan
# explicitamente. Sin esta linea el frontend descarga los informes de HU-06
# pero no puede leer el nombre del archivo que propone el backend.
CORS_EXPOSE_HEADERS = ['Content-Disposition']
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)

GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default=None)

# Detrás de un proxy con HTTPS (Nginx, Render) los enlaces a archivos deben salir con https aunque
# DEBUG esté encendido; si no, el navegador los bloquea por contenido mixto.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Producción (solo con DEBUG apagado).
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_URL_EXPIRACION_SEGUNDOS = config('MEDIA_URL_EXPIRACION_SEGUNDOS', default=7200, cast=int)

# Dónde se guardan los archivos subidos: 'disco' | 'bd' | 'supabase'.
MEDIA_BACKEND = config('MEDIA_BACKEND', default='disco').strip().lower()
# Compatibilidad con el flag anterior.
if MEDIA_BACKEND == 'disco' and config('MEDIA_EN_BD', default=False, cast=bool):
    MEDIA_BACKEND = 'bd'
if MEDIA_BACKEND not in ('disco', 'bd', 'supabase'):
    raise ImproperlyConfigured("MEDIA_BACKEND debe ser 'disco', 'bd' o 'supabase'.")
MEDIA_EN_BD = MEDIA_BACKEND == 'bd'
MEDIA_EN_SUPABASE = MEDIA_BACKEND == 'supabase'

if MEDIA_EN_SUPABASE:
    # Bucket privado en Supabase vía API S3; las URLs salen prefirmadas y con vencimiento.
    _storage_media = {
        'BACKEND': 'storages.backends.s3.S3Storage',
        'OPTIONS': {
            'bucket_name': config('SUPABASE_BUCKET'),
            'endpoint_url': config('SUPABASE_S3_ENDPOINT'),
            'region_name': config('SUPABASE_S3_REGION'),
            'access_key': config('SUPABASE_S3_KEY_ID'),
            'secret_key': config('SUPABASE_S3_SECRET'),
            'signature_version': 's3v4',
            'addressing_style': 'path',
            'querystring_auth': True,
            'querystring_expire': MEDIA_URL_EXPIRACION_SEGUNDOS,
            'file_overwrite': False,
            'default_acl': None,
        },
    }
elif MEDIA_EN_BD:
    _storage_media = {'BACKEND': 'apps.utils.almacenamiento.MediaBDStorage'}
else:
    _storage_media = {'BACKEND': 'apps.utils.almacenamiento.MediaFirmadoStorage'}

STORAGES = {
    'default': _storage_media,
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

# Solo modo disco: Nginx entrega el archivo tras la validación (X-Accel-Redirect).
MEDIA_X_ACCEL = config('MEDIA_X_ACCEL', default=False, cast=bool)
MEDIA_X_ACCEL_PREFIJO = '/media-protegido/'
# (Conserva aquí tu comentario largo sobre MEDIA_ROOT vacío.)
# En modo supabase solo lo usa migrate_supabase.py para leer los archivos viejos.
MEDIA_ROOT = config('MEDIA_ROOT', default='') or str(BASE_DIR / 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
