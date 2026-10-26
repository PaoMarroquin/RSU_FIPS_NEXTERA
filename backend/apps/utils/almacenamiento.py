"""
Archivos subidos (firmas, evidencias, documentos) accesibles solo con URL firmada.

MediaFirmadoStorage agrega a cada URL un token firmado y con vencimiento
(?t=...). La vista media_protegido lo valida antes de entregar el archivo, así
que una URL copiada deja de servir al vencer y sin token no se puede abrir
nada. Como todas las URLs salen de storage.url(), no hace falta cambiar los
serializers ni el frontend: siguen usando la URL que devuelve la API.

Con MEDIA_X_ACCEL=True (producción detrás de Nginx) la vista solo valida y
Nginx entrega el archivo desde una ubicación interna.
"""
import mimetypes
import posixpath
from urllib.parse import quote

from django.conf import settings
from django.core import signing
from django.core.files.storage import FileSystemStorage
from django.http import Http404, HttpResponse
from django.views.static import serve

SALT = 'media-protegido'


def _firmador():
    return signing.TimestampSigner(salt=SALT)


class MediaFirmadoStorage(FileSystemStorage):

    def url(self, name):
        base = super().url(name)
        if name is None:
            return base
        return f'{base}?t={_firmador().sign(name)}'


def media_protegido(request, path):
    token = request.GET.get('t', '')
    try:
        nombre = _firmador().unsign(token, max_age=settings.MEDIA_URL_EXPIRACION_SEGUNDOS)
    except signing.BadSignature:
        raise Http404('Archivo no disponible.')
    if posixpath.normpath(nombre) != posixpath.normpath(path):
        raise Http404('Archivo no disponible.')

    if settings.MEDIA_X_ACCEL:
        respuesta = HttpResponse()
        respuesta['X-Accel-Redirect'] = settings.MEDIA_X_ACCEL_PREFIJO + quote(path)
        tipo, _ = mimetypes.guess_type(path)
        respuesta['Content-Type'] = tipo or 'application/octet-stream'
        return respuesta
    return serve(request, path, document_root=settings.MEDIA_ROOT)
