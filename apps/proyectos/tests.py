from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.usuarios.models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, MatrizOperativa, EjeRSU, ODS, LineaEstrategica, ObjetivoInstitucional
from apps.proyectos.models import ProyectoRSU

class ProyectosAPITests(APITestCase):

    def setUp(self):
        # Retrieve seeded roles
        self.rol_coord = Rol.objects.get(nombre='Coordinador')
        self.rol_docente = Rol.objects.get(nombre='Docente')

        # Retrieve seeded ejes and ODS
        self.eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        self.ods_1 = ODS.objects.get(numero=1)
        self.ods_2 = ODS.objects.get(numero=2)

        # Retrieve seeded institutional structures
        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.escuela = EscuelaProfesional.objects.get(codigo='EPIS')
        self.departamento = DepartamentoAcademico.objects.get(codigo='DAISI')

        # Create users
        self.coord_user = Usuario.objects.create_user(
            correo_institucional='coord@unsa.edu.pe',
            password='password123',
            nombre_completo='Coordinador RSU',
            rol=self.rol_coord,
            facultad=self.facultad
        )
        self.docente_user = Usuario.objects.create_user(
            correo_institucional='docente@unsa.edu.pe',
            password='password123',
            nombre_completo='Docente Prueba',
            rol=self.rol_docente,
            facultad=self.facultad
        )
        self.docente_user_2 = Usuario.objects.create_user(
            correo_institucional='docente2@unsa.edu.pe',
            password='password123',
            nombre_completo='Otro Docente',
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

        # Create MatrizOperativa
        self.matriz = MatrizOperativa.objects.create(
            periodo=self.periodo,
            facultad=self.facultad,
            coordinador=self.coord_user,
            presupuesto_global=10000.00,
            estado='publicada'
        )

        # Create Objetivo
        self.objetivo = ObjetivoInstitucional.objects.create(
            matriz=self.matriz,
            linea_estrategica=self.linea,
            eje_rsu=self.eje_gestion,
            nombre='Reducir huella de carbono',
            meta_cuantitativa='Reducir un 15%'
        )

    def test_docente_can_register_project_in_draft(self):
        """
        Verify that a teacher can save an RSU project in draft state with nested relationships.
        """
        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-list')

        data = {
            'titulo': 'Campaña Eco-Eficiencia FIPS',
            'descripcion_general': 'Proyecto de prueba para concientizar sobre el consumo energético.',
            'fundamentacion': 'Se justifica en la necesidad de reducir la huella de carbono en aulas.',
            'diagnostico_situacional': 'Se observa un uso inadecuado de luces y computadoras encendidas.',
            'eje_rsu': self.eje_gestion.id,
            'linea_estrategica': self.linea.id,
            'objetivo_institucional': self.objetivo.id,
            'periodo': self.periodo.id,
            'facultad': self.facultad.id,
            'escuela': self.escuela.id,
            'departamento': self.departamento.id,
            'semestre_academico': '2026-I',
            'anio_carrera': 1,
            'ods': [self.ods_1.id, self.ods_2.id],
            'asignaturas': [
                {
                    'nombre_asignatura': 'Introducción a Sistemas',
                    'codigo_asignatura': 'IS101',
                    'anio_carrera': 1,
                    'semestre': 'I'
                }
            ],
            'docentes_adicionales': [
                {
                    'docente': self.docente_user_2.id,
                    'rol_en_proyecto': 'Colaborador'
                }
            ]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estado'], 'borrador')
        self.assertEqual(response.data['docente_responsable'], self.docente_user.id)
        self.assertEqual(len(response.data['ods']), 2)
        self.assertEqual(len(response.data['asignaturas']), 1)
        self.assertEqual(response.data['asignaturas'][0]['nombre_asignatura'], 'Introducción a Sistemas')
        self.assertEqual(len(response.data['docentes_adicionales']), 1)
        self.assertEqual(response.data['docentes_adicionales'][0]['docente'], self.docente_user_2.id)

    def test_only_owner_can_modify_project(self):
        """
        Verify that only the responsible teacher can modify a draft project.
        """
        # Create project with docente_user as owner
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto Docente 1',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )

        # Authenticate with docente_user_2 (not the owner)
        self.client.force_authenticate(user=self.docente_user_2)
        url = reverse('proyecto-detail', args=[proyecto.id])
        data = {'titulo': 'Titulo modificado ilegalmente'}
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticate with docente_user (the owner)
        self.client.force_authenticate(user=self.docente_user)
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['titulo'], 'Titulo modificado ilegalmente')

    def test_cannot_edit_project_in_review(self):
        """
        Verify that projects in review cannot be modified.
        """
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto en Revisión',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='en_revision'
        )

        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-detail', args=[proyecto.id])
        data = {'titulo': 'Titulo modificado'}
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No se puede editar un proyecto que está en revisión", response.data[0])

    def test_validation_before_sending_to_review(self):
        """
        Verify validation errors when submitting an incomplete project, and success when complete.
        """
        # 1. Create an incomplete project
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto Incompleto',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )

        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-enviar-revision', args=[proyecto.id])
        
        # Try sending to review - should fail
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ods', response.data['errors'])
        self.assertIn('asignaturas', response.data['errors'])

        # 2. Complete all required fields and relationships
        proyecto.fund_por_que_grupo = 'Completado'
        proyecto.fund_para_que_proyecto = 'Completado'
        proyecto.fund_mecanismo_ensenanza = 'Completado'
        proyecto.diag_estado_grupo = 'Completado'
        proyecto.diag_problemas_detectados = 'Completado'
        proyecto.diag_aportes_formacion = 'Completado'
        proyecto.objetivo_general = 'Completado'
        proyecto.resultado_en_beneficiarios = 'Completado'
        proyecto.resultado_en_curriculo = 'Completado'
        proyecto.linea_estrategica = self.linea
        proyecto.objetivo_institucional = self.objetivo
        proyecto.anio_carrera = 1
        proyecto.meta_cuantitativa = '50 beneficiarios'
        proyecto.indicador = 'Nro de beneficiarios'
        proyecto.lugar_ejecucion = 'Arequipa'
        proyecto.fecha_inicio = '2026-01-01'
        proyecto.fecha_termino = '2026-12-31'
        proyecto.tipo_actividad = ['asesoria']
        proyecto.benef_otro = True
        proyecto.save()
        
        proyecto.ods.add(self.ods_1)
        
        from apps.proyectos.models import ProyectoAsignatura
        ProyectoAsignatura.objects.create(
            proyecto=proyecto,
            nombre_asignatura='Curso Prueba',
            anio_carrera=1,
            semestre='I'
        )

        # Try sending to review again - should succeed
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['proyecto']['estado'], 'en_revision')
        self.assertIsNotNone(response.data['proyecto']['fecha_envio_revision'])

    def test_docente_can_delete_draft_project(self):
        """
        Verify that a teacher (owner) can delete a project in draft state.
        """
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto a Eliminar',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )

        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-detail', args=[proyecto.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProyectoRSU.objects.filter(id=proyecto.id).exists())

    def test_cannot_delete_project_in_review(self):
        """
        Verify that a project in review state cannot be deleted.
        """
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto en Revisión',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='en_revision'
        )

        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-detail', args=[proyecto.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(ProyectoRSU.objects.filter(id=proyecto.id).exists())

    def test_non_owner_cannot_delete_project(self):
        """
        Verify that a non-owner docente cannot see or delete another teacher's draft project.
        """
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto de Otro Docente',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )

        self.client.force_authenticate(user=self.docente_user_2)
        url = reverse('proyecto-detail', args=[proyecto.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(ProyectoRSU.objects.filter(id=proyecto.id).exists())

    def test_non_docente_cannot_create_project(self):
        """
        Verify that a Coordinador cannot create an RSU project (only Docentes can).
        """
        self.client.force_authenticate(user=self.coord_user)
        url = reverse('proyecto-list')

        data = {
            'titulo': 'Proyecto No Permitido',
            'eje_rsu': self.eje_gestion.id,
            'periodo': self.periodo.id,
            'facultad': self.facultad.id,
            'escuela': self.escuela.id,
            'departamento': self.departamento.id,
            'semestre_academico': '2026-I',
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
