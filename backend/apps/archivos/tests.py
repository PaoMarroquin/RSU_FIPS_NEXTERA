"""
Pruebas de los archivos guardados en la base de datos (MEDIA_EN_BD) y del límite mayor para PDF.

Conecta con:
- apps/utils/almacenamiento.py: MediaBDStorage y la vista media_protegido.
- apps/proyectos/models.py: validate_evidencia_size.
"""
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from apps.proyectos.models import validate_evidencia_size
from apps.utils.almacenamiento import MediaBDStorage

from .models import ArchivoMedia


@override_settings(MEDIA_EN_BD=True)
class MediaEnBaseDeDatosTests(TestCase):

    def setUp(self):
        self.storage = MediaBDStorage()

    def test_guarda_y_lee_el_archivo_desde_la_base_de_datos(self):
        nombre = self.storage.save('proyectos/evidencias/foto.jpeg', ContentFile(b'imagen'))
        self.assertEqual(ArchivoMedia.objects.get(nombre=nombre).tamano, 6)
        with self.storage.open(nombre) as archivo:
            self.assertEqual(archivo.read(), b'imagen')

    def test_no_pisa_un_archivo_con_el_mismo_nombre(self):
        primero = self.storage.save('evidencias/foto.jpeg', ContentFile(b'a'))
        segundo = self.storage.save('evidencias/foto.jpeg', ContentFile(b'b'))
        self.assertNotEqual(primero, segundo)
        self.assertEqual(ArchivoMedia.objects.count(), 2)

    def test_la_url_firmada_entrega_el_archivo_y_sin_token_no(self):
        nombre = self.storage.save('evidencias/foto.jpeg', ContentFile(b'imagen'))
        respuesta = self.client.get(self.storage.url(nombre))
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.content, b'imagen')
        self.assertEqual(respuesta['Content-Type'], 'image/jpeg')
        self.assertEqual(self.client.get(f'/media/{nombre}').status_code, 404)

    def test_borrar_quita_la_fila(self):
        nombre = self.storage.save('evidencias/foto.jpeg', ContentFile(b'imagen'))
        self.storage.delete(nombre)
        self.assertFalse(self.storage.exists(nombre))


class LimitePdfTests(TestCase):

    def test_un_pdf_puede_pesar_mas_que_una_imagen(self):
        quince_mb = b'0' * (15 * 1024 * 1024)
        validate_evidencia_size(SimpleUploadedFile('lista.pdf', quince_mb))
        with self.assertRaises(ValidationError):
            validate_evidencia_size(SimpleUploadedFile('foto.jpg', quince_mb))
