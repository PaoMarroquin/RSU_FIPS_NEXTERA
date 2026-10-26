"""Protecciones previas al piloto: contraseña inicial, intentos de login, archivos y firma."""
import shutil
import tempfile
from io import BytesIO

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Rol, Usuario

MEDIA_TEMPORAL = tempfile.mkdtemp()


def _png(tamano=(40, 20)):
    salida = BytesIO()
    Image.new('RGB', tamano, 'white').save(salida, 'PNG')
    return SimpleUploadedFile('firma.png', salida.getvalue(), content_type='image/png')


class CambioPasswordObligatorioTests(APITestCase):

    def setUp(self):
        self.admin = Usuario.objects.create_user(
            correo_institucional='admin.seg@unsa.edu.pe', password='Admin1234!',
            nombres='Admin', rol=Rol.objects.get(nombre=Rol.ADMINISTRADOR))
        self.client.force_authenticate(user=self.admin)
        self.client.post(reverse('usuario-list'), {
            'nombres': 'Nuevo', 'correo_institucional': 'nuevo.seg@unsa.edu.pe',
            'rol': Rol.objects.get(nombre=Rol.DOCENTE).pk}, format='json')
        self.client.force_authenticate(user=None)

    def _login(self, clave):
        r = self.client.post(reverse('auth-login'), {
            'correo_institucional': 'nuevo.seg@unsa.edu.pe', 'password': clave}, format='json')
        return r

    def test_usuario_creado_debe_cambiar_la_contrasena_antes_de_usar_el_sistema(self):
        r = self._login('nuevo.seg@unsa.edu.pe')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data['usuario']['debe_cambiar_password'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")

        bloqueado = self.client.get(reverse('rol-list'))
        self.assertEqual(bloqueado.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(bloqueado.data['codigo'], 'cambio_password_requerido')
        self.assertEqual(self.client.get(reverse('usuario-me')).status_code, status.HTTP_200_OK)

        cambio = self.client.post(reverse('usuario-cambiar-password'), {
            'password_actual': 'nuevo.seg@unsa.edu.pe', 'password_nueva': 'ClaveNueva2026!'}, format='json')
        self.assertEqual(cambio.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(reverse('rol-list')).status_code, status.HTTP_200_OK)
        self.assertFalse(Usuario.objects.get(correo_institucional='nuevo.seg@unsa.edu.pe').debe_cambiar_password)


class LimiteIntentosLoginTests(APITestCase):

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_bloquea_tras_demasiados_intentos(self):
        from unittest import mock
        from rest_framework.throttling import ScopedRateThrottle
        url = reverse('auth-login')
        mock.patch.object(ScopedRateThrottle, 'THROTTLE_RATES', {'login': '3/min'}).start()
        self.addCleanup(mock.patch.stopall)
        datos = {'correo_institucional': 'nadie@unsa.edu.pe', 'password': 'x'}
        codigos = [self.client.post(url, datos, format='json').status_code for _ in range(4)]
        self.assertNotEqual(codigos[0], status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(codigos[-1], status.HTTP_429_TOO_MANY_REQUESTS)


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class ArchivosProtegidosTests(APITestCase):

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            correo_institucional='firma.seg@unsa.edu.pe', password='Clave1234!', nombres='Firma')
        self.usuario.firma_digital = _png()
        self.usuario.save()

    def test_la_url_lleva_token_y_sin_token_no_se_abre(self):
        url = self.usuario.firma_digital.url
        self.assertIn('?t=', url)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get(url.split('?')[0]).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get(url[:-3] + 'abc').status_code, status.HTTP_404_NOT_FOUND)

    def test_el_token_no_sirve_para_otro_archivo(self):
        url = self.usuario.firma_digital.url
        ruta, token = url.split('?')
        otra = ruta.rsplit('/', 1)[0] + '/otro.png?' + token
        self.assertEqual(self.client.get(otra).status_code, status.HTTP_404_NOT_FOUND)

    def test_la_url_vence(self):
        url = self.usuario.firma_digital.url
        with override_settings(MEDIA_URL_EXPIRACION_SEGUNDOS=-1):
            self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)


class ValidacionFirmaTests(APITestCase):

    def test_firma_rechaza_formato_y_tamano(self):
        from django.core.exceptions import ValidationError
        from .models import validar_tamano_firma
        grande = SimpleUploadedFile('f.png', b'0' * (2 * 1024 * 1024 + 1))
        with self.assertRaises(ValidationError):
            validar_tamano_firma(grande)
        usuario = Usuario(correo_institucional='v@unsa.edu.pe', nombres='V')
        usuario.firma_digital = SimpleUploadedFile('firma.gif', b'GIF89a')
        with self.assertRaises(ValidationError):
            usuario.full_clean(exclude=['password'])
