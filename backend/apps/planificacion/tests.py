"""
Pruebas de la API de planificacion.

Verifican el acceso por rol a los catalogos y a los documentos de guia: que la
Jefatura RSU pueda publicarlos, que el Administrador
pueda gestionar catalogos y que un usuario sin rol adecuado reciba 403.

Conecta con:
- apps/planificacion/views.py: comportamiento bajo prueba.
- apps/usuarios/models.py: usuarios y roles que se crean en setUp.
"""
import tempfile

from django.urls import reverse
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from apps.usuarios.models import Usuario, Rol, Facultad
from apps.planificacion.models import (
    PeriodoAcademico, MatrizOperativa, EjeRSU, ODS, LineaEstrategica,
)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class PlanificacionAPITests(APITestCase):

    def setUp(self):
        # Retrieve seeded roles
        self.rol_admin = Rol.objects.get(nombre='Administrador')
        self.rol_coord = Rol.objects.get(nombre='Jefatura RSU')
        self.rol_docente = Rol.objects.get(nombre='Docente')

        # Retrieve seeded ejes and ODS
        self.eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        self.ods_1 = ODS.objects.get(numero=1)

        # Retrieve seeded Facultad
        self.facultad = Facultad.objects.get(codigo='FIPS')

        # Create users
        self.coord_user = Usuario.objects.create_user(
            correo_institucional='coord@unsa.edu.pe',
            password='password123',
            nombres='Coordinador RSU',
            rol=self.rol_coord,
            facultad=self.facultad
        )
        self.docente_user = Usuario.objects.create_user(
            correo_institucional='docente@unsa.edu.pe',
            password='password123',
            nombres='Docente Prueba',
            rol=self.rol_docente,
            facultad=self.facultad
        )

        # Create academic period
        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-I',
            anio=2026,
            semestre='I',
            fecha_inicio='2026-04-01',
            fecha_fin='2026-08-31',
            activo=True
        )

        # Create LineaEstrategica
        self.linea = LineaEstrategica.objects.create(
            nombre='Línea de Gestión Ambiental',
            eje_rsu=self.eje_gestion
        )

    def test_jefatura_puede_publicar_matriz_con_archivo(self):
        """La matriz es un documento de guia: nombre, descripcion y archivo."""
        self.client.force_authenticate(user=self.coord_user)
        archivo = SimpleUploadedFile(
            'lineas.pdf', b'contenido', content_type='application/pdf')

        response = self.client.post(reverse('matriz-list'), {
            'nombre': 'Líneas de Investigación 2026',
            'descripcion': 'Líneas vigentes para formular proyectos',
            'archivo': archivo,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'Líneas de Investigación 2026')
        self.assertIn('lineas', response.data['archivo'])

    def test_matriz_requiere_archivo(self):
        self.client.force_authenticate(user=self.coord_user)
        response = self.client.post(reverse('matriz-list'), {
            'nombre': 'Sin adjunto',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('archivo', response.data['errors'])

    def test_docente_cannot_create_matriz(self):
        """
        Verify that a standard teacher cannot create a matrix.
        """
        self.client.force_authenticate(user=self.docente_user)
        archivo = SimpleUploadedFile(
            'guia.pdf', b'contenido', content_type='application/pdf')
        response = self.client.post(reverse('matriz-list'), {
            'nombre': 'Intento de docente',
            'archivo': archivo,
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_puede_consultar_las_matrices(self):
        """El docente las consulta como guia, aunque no pueda publicarlas."""
        matriz = MatrizOperativa.objects.create(
            nombre='Objetivos Regionales',
            archivo=SimpleUploadedFile('obj.pdf', b'x', content_type='application/pdf'),
        )

        self.client.force_authenticate(user=self.docente_user)
        response = self.client.get(reverse('matriz-list'), format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resultados = response.data['results']
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]['id'], matriz.id)

    def test_configure_objectives_indicators_and_suggested_activities(self):
        """
        Verify institutional objective, indicator, and suggested activities parameterization.
        """
        self.client.force_authenticate(user=self.coord_user)

        # 1. Create Objective
        obj_url = reverse('objetivo-list')
        obj_data = {
            'linea_estrategica': self.linea.id,
            'eje_rsu': self.eje_gestion.id,
            'nombre': 'Reducir huella de carbono',
            'meta_cuantitativa': 'Reducir un 15%'
        }
        obj_response = self.client.post(obj_url, obj_data, format='json')
        self.assertEqual(obj_response.status_code, status.HTTP_201_CREATED)
        objetivo_id = obj_response.data['id']

        # 2. Create Indicator for that Objective
        ind_url = reverse('indicador-list')
        ind_data = {
            'objetivo': objetivo_id,
            'nombre': 'Porcentaje de reducción de emisiones',
            'unidad_medida': 'Porcentaje',
            'valor_meta': 15.00
        }
        ind_response = self.client.post(ind_url, ind_data, format='json')
        self.assertEqual(ind_response.status_code, status.HTTP_201_CREATED)

        # 3. Create Suggested Activity for 1st Year (e.g. "Afiches")
        act_url = reverse('actividad-sugerida-list')
        act_data = {
            'objetivo': objetivo_id,
            'eje_rsu': self.eje_gestion.id,
            'nombre': 'Elaboración de Afiches y Campaña de Sensibilización',
            'anio_academico': 1,  # 1st Year
            'tipo_actividad': 'Sensibilización'
        }
        act_response = self.client.post(act_url, act_data, format='json')
        self.assertEqual(act_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(act_response.data['anio_academico_display'], '1.er año')

        # 4. Create Suggested Activity for 2nd Year (e.g. "Foros")
        act_data_2 = {
            'objetivo': objetivo_id,
            'eje_rsu': self.eje_gestion.id,
            'nombre': 'Foro Universitario sobre Reciclaje',
            'anio_academico': 2,  # 2nd Year
            'tipo_actividad': 'Foros'
        }
        self.client.post(act_url, act_data_2, format='json')

        # 5. Verify filtering suggested activities by academic year
        self.client.force_authenticate(user=self.docente_user)
        # Filter for 1st year
        response_1st_year = self.client.get(act_url + '?anio_academico=1', format='json')
        self.assertEqual(response_1st_year.status_code, status.HTTP_200_OK)
        # La respuesta viene paginada
        actividades_1er_anio = response_1st_year.data['results']
        self.assertEqual(len(actividades_1er_anio), 1)
        self.assertEqual(actividades_1er_anio[0]['nombre'], 'Elaboración de Afiches y Campaña de Sensibilización')


class MatrizAlineamientoAPITests(APITestCase):
    """Catálogos de Objetivos Regionales/Nacionales y su correlación con el
    proyecto (matriz de alineamiento estratégico)."""

    def setUp(self):
        self.rol_jefatura = Rol.objects.get(nombre='Jefatura RSU')
        self.rol_docente = Rol.objects.get(nombre='Docente')
        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.jefatura_user = Usuario.objects.create_user(
            correo_institucional='jefatura2@unsa.edu.pe', password='password123',
            nombres='Jefatura RSU', rol=self.rol_jefatura, facultad=self.facultad,
        )
        self.docente_user = Usuario.objects.create_user(
            correo_institucional='docente2@unsa.edu.pe', password='password123',
            nombres='Docente Prueba', rol=self.rol_docente, facultad=self.facultad,
        )

    def test_jefatura_puede_crear_objetivo_regional_y_nacional(self):
        self.client.force_authenticate(user=self.jefatura_user)
        r1 = self.client.post(reverse('objetivo-regional-list'), {
            'codigo': 'OR-01', 'nombre': 'Reducir la pobreza en Arequipa',
        }, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post(reverse('objetivo-nacional-list'), {
            'codigo': 'ON-01', 'nombre': 'Educación de calidad para todos',
        }, format='json')
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_docente_no_puede_crear_objetivo_regional(self):
        self.client.force_authenticate(user=self.docente_user)
        response = self.client.post(reverse('objetivo-regional-list'), {
            'nombre': 'No autorizado',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_puede_listar_catalogos_para_su_formulario(self):
        from apps.planificacion.models import ObjetivoRegional, ObjetivoNacional
        ObjetivoRegional.objects.create(codigo='OR-01', nombre='Objetivo Regional 1')
        ObjetivoNacional.objects.create(codigo='ON-01', nombre='Objetivo Nacional 1')
        self.client.force_authenticate(user=self.docente_user)
        self.assertEqual(
            self.client.get(reverse('objetivo-regional-list')).status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.get(reverse('objetivo-nacional-list')).status_code, status.HTTP_200_OK)
