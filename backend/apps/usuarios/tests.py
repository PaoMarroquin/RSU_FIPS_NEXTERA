"""
Pruebas del módulo de usuarios: alta con contraseña inicial, cambio de
contraseña desde Configuración y estadísticas del dashboard del Administrador.

El resto de permisos por rol se prueba en apps/planificacion/tests.py y
apps/proyectos/tests.py, donde se crean usuarios de cada rol.

Conecta con:
- apps/usuarios/views.py y serializers.py: comportamiento bajo prueba.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Rol, Usuario


class UsuariosAPITests(APITestCase):

    def setUp(self):
        self.admin = Usuario.objects.create_user(
            correo_institucional='admin.test@unsa.edu.pe', password='Admin1234!',
            nombres='Admin', rol=Rol.objects.get(nombre=Rol.ADMINISTRADOR))
        self.rol_docente = Rol.objects.get(nombre=Rol.DOCENTE)

    def test_sin_contrasena_la_inicial_es_el_correo(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse('usuario-list'), {
            'nombres': 'Nuevo', 'correo_institucional': 'nuevo.docente@unsa.edu.pe',
            'rol': self.rol_docente.pk,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        usuario = Usuario.objects.get(correo_institucional='nuevo.docente@unsa.edu.pe')
        self.assertTrue(usuario.check_password('nuevo.docente@unsa.edu.pe'))

    def test_si_se_indica_contrasena_se_usa_esa(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(reverse('usuario-list'), {
            'nombres': 'Otro', 'correo_institucional': 'otro.docente@unsa.edu.pe',
            'password': 'ClaveSegura1', 'rol': self.rol_docente.pk,
        }, format='json')
        usuario = Usuario.objects.get(correo_institucional='otro.docente@unsa.edu.pe')
        self.assertTrue(usuario.check_password('ClaveSegura1'))

    def test_cambiar_contrasena(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('usuario-cambiar-password')
        response = self.client.post(url, {'password_actual': 'incorrecta', 'password_nueva': 'NuevaClave9'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(url, {'password_actual': 'Admin1234!', 'password_nueva': 'NuevaClave9'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('NuevaClave9'))

    def test_estadisticas_solo_para_administrador(self):
        docente = Usuario.objects.create_user(
            correo_institucional='doc.stats@unsa.edu.pe', password='x' * 8,
            nombres='Doc', rol=self.rol_docente)
        url = reverse('usuario-estadisticas')

        self.client.force_authenticate(user=docente)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        por_rol = {fila['rol']: fila['total'] for fila in response.data['por_rol']}
        self.assertEqual(por_rol[Rol.DOCENTE], 1)
        self.assertEqual(por_rol[Rol.ADMINISTRADOR], 1)
        self.assertEqual(por_rol[Rol.JEFATURA], 0)
