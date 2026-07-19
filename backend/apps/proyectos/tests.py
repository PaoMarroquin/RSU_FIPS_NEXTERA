import tempfile
from decimal import Decimal
from django.urls import reverse
from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.usuarios.models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, MatrizOperativa, EjeRSU, ODS, LineaEstrategica, ObjetivoInstitucional
from apps.proyectos.models import (
    ProyectoRSU, ActividadProyecto, CronogramaAccion,
    PartidaPresupuestaria, MetaIndicadorProyecto, DocumentoSustentoProyecto,
    AvanceActividad, EvidenciaAvance, Notificacion,
)

class ProyectosAPITests(APITestCase):

    def setUp(self):
        # Retrieve seeded roles
        self.rol_coord = Rol.objects.get(nombre='Jefatura RSU')
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
        self.docente_user_2 = Usuario.objects.create_user(
            correo_institucional='docente2@unsa.edu.pe',
            password='password123',
            nombres='Otro Docente',
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

    def test_docente_can_save_project_with_nested_metas_indicadores(self):
        """
        Verify that a project can be saved using the new metas_indicadores relationship.
        """
        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-list')

        data = {
            'titulo': 'Proyecto con metas anidadas',
            'eje_rsu': self.eje_gestion.id,
            'periodo': self.periodo.id,
            'facultad': self.facultad.id,
            'escuela': self.escuela.id,
            'departamento': self.departamento.id,
            'semestre_academico': '2026-I',
            'ods': [self.ods_1.id],
            'metas_indicadores': [
                {
                    'meta_descripcion': 'Capacitar a 50 docentes',
                    'indicador_nombre': 'Nro. de docentes capacitados',
                    'linea_base': 10,
                    'valor_meta': 50,
                    'valor_alcanzado': 15,
                }
            ],
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        proyecto = ProyectoRSU.objects.get(pk=response.data['id'])
        self.assertEqual(proyecto.metas_indicadores.count(), 1)
        meta = proyecto.metas_indicadores.first()
        self.assertEqual(meta.meta_descripcion, 'Capacitar a 50 docentes')
        self.assertEqual(meta.valor_meta, Decimal('50'))

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

        # Authenticate with docente_user_2 (not the owner). get_queryset() scopes
        # a Docente to their own projects, so a non-owner's request 404s before
        # IsOwnerOrReadOnly is ever consulted (same pattern as the list view) -
        # this also avoids leaking the existence of other teachers' projects.
        self.client.force_authenticate(user=self.docente_user_2)
        url = reverse('proyecto-detail', args=[proyecto.id])
        data = {'titulo': 'Titulo modificado ilegalmente'}

        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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
        self.assertIn(
            "No se puede editar un proyecto que está en revisión",
            response.data['errors']['non_field_errors'][0],
        )

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
        url = reverse('proyecto-revisar', args=[proyecto.id])

        # Try sending to review - should fail
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ods', response.data['errors'])
        self.assertIn('asignaturas', response.data['errors'])
        self.assertIn('metas_indicadores', response.data['errors'])
        self.assertIn('presupuesto', response.data['errors'])

        # 2. Complete all required fields and relationships
        proyecto.fund_por_que_grupo = 'Completado'
        proyecto.fund_para_que_proyecto = 'Completado'
        proyecto.fund_mecanismo_ensenanza = 'Completado'
        proyecto.diag_estado_grupo = 'Completado'
        proyecto.diag_problemas_detectados = 'Completado'
        proyecto.diag_aportes_formacion = 'Completado'
        proyecto.obj_logro_intervencion = 'Completado'
        proyecto.resultado_en_beneficiarios = 'Completado'
        proyecto.resultado_en_curriculo = 'Completado'
        proyecto.linea_estrategica = self.linea
        proyecto.objetivo_institucional = self.objetivo
        proyecto.anio_carrera = 1
        proyecto.lugar_ejecucion = 'Arequipa'
        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto,
            meta_descripcion='Capacitar a 50 beneficiarios',
            indicador_nombre='Nro de beneficiarios',
            linea_base=10,
            valor_meta=50,
        )
        proyecto.fecha_inicio = '2026-01-01'
        proyecto.fecha_termino = '2026-12-31'
        proyecto.tipo_actividad = ['asesoria']
        proyecto.benef_otro_detalle = 'Comunidad universitaria'
        proyecto.save()

        proyecto.ods.add(self.ods_1)

        from apps.proyectos.models import ProyectoAsignatura
        ProyectoAsignatura.objects.create(
            proyecto=proyecto,
            nombre_asignatura='Curso Prueba',
            anio_carrera=1,
            semestre='I'
        )
        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto,
            meta_descripcion='Capacitar a 50 docentes en reciclaje',
            indicador_nombre='Nro de docentes capacitados',
            valor_meta=50,
        )
        PartidaPresupuestaria.objects.create(
            proyecto=proyecto,
            categoria='material_escritorio',
            cantidad=10,
            costo_unitario=15,
        )

        # Try sending to review again - should succeed
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['estado'], 'en_revision')
        self.assertIsNotNone(response.data['fecha_envio_revision'])

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


# ──────────────────────────────────────────────────────────────────────────────
# Shared fixture mixin
# ──────────────────────────────────────────────────────────────────────────────

class BaseProyectoTestCase(APITestCase):
    """Common setUp shared by actividades and cronograma test classes."""

    # Placeholder only - all tests use force_authenticate, not real login
    _cred = None

    def setUp(self):
        self.rol_docente = Rol.objects.get(nombre='Docente')
        self.eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.escuela = EscuelaProfesional.objects.get(codigo='EPIS')
        self.departamento = DepartamentoAcademico.objects.get(codigo='DAISI')

        self.docente = Usuario.objects.create_user(
            correo_institucional='docente.act@unsa.edu.pe',
            password=self._cred,
            nombres='Docente Actividades',
            rol=self.rol_docente,
            facultad=self.facultad,
        )
        self.otro_docente = Usuario.objects.create_user(
            correo_institucional='otro.act@unsa.edu.pe',
            password=self._cred,
            nombres='Otro Docente',
            rol=self.rol_docente,
            facultad=self.facultad,
        )

        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-II', anio=2026, semestre='II',
            fecha_inicio='2026-09-01', fecha_fin='2027-01-31', activo=True,
        )

        self.proyecto_borrador = ProyectoRSU.objects.create(
            titulo='Proyecto Base Borrador',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente,
            semestre_academico='2026-II',
            estado='borrador',
        )
        self.proyecto_en_revision = ProyectoRSU.objects.create(
            titulo='Proyecto Base En Revisión',
            eje_rsu=self.eje_gestion,
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente,
            semestre_academico='2026-II',
            estado='en_revision',
        )


class ActividadesAPITests(BaseProyectoTestCase):

    def test_listar_actividades_del_proyecto(self):
        ActividadProyecto.objects.create(proyecto=self.proyecto_borrador, nombre='Act 1', orden=1)
        ActividadProyecto.objects.create(proyecto=self.proyecto_borrador, nombre='Act 2', orden=2)

        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_no_propietario_no_puede_listar_actividades(self):
        ActividadProyecto.objects.create(proyecto=self.proyecto_borrador, nombre='Act 1', orden=1)

        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('actividad-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_docente_puede_agregar_actividad_a_proyecto_borrador(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-list', args=[self.proyecto_borrador.id])
        data = {'nombre': 'Taller de reciclaje', 'orden': 1, 'fecha': '2026-10-15'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'Taller de reciclaje')
        self.assertTrue(ActividadProyecto.objects.filter(proyecto=self.proyecto_borrador).exists())

    def test_no_propietario_no_puede_agregar_actividad(self):
        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('actividad-list', args=[self.proyecto_borrador.id])
        data = {'nombre': 'Actividad no autorizada', 'orden': 1}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_puede_agregar_actividad_a_proyecto_en_revision(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-list', args=[self.proyecto_en_revision.id])
        data = {'nombre': 'Actividad bloqueada', 'orden': 1}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_docente_puede_editar_actividad(self):
        actividad = ActividadProyecto.objects.create(
            proyecto=self.proyecto_borrador, nombre='Act original', orden=1)

        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-detail', args=[self.proyecto_borrador.id, actividad.id])
        response = self.client.patch(url, {'nombre': 'Act editada'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Act editada')

    def test_no_propietario_no_puede_editar_actividad(self):
        actividad = ActividadProyecto.objects.create(
            proyecto=self.proyecto_borrador, nombre='Act original', orden=1)

        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('actividad-detail', args=[self.proyecto_borrador.id, actividad.id])
        response = self.client.patch(url, {'nombre': 'Intento ilegal'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_puede_eliminar_actividad(self):
        actividad = ActividadProyecto.objects.create(
            proyecto=self.proyecto_borrador, nombre='Act a eliminar', orden=1)

        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-detail', args=[self.proyecto_borrador.id, actividad.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ActividadProyecto.objects.filter(id=actividad.id).exists())


class CronogramaAPITests(BaseProyectoTestCase):

    def test_listar_cronograma_del_proyecto(self):
        CronogramaAccion.objects.create(proyecto=self.proyecto_borrador, descripcion='Acción 1', orden=1)
        CronogramaAccion.objects.create(proyecto=self.proyecto_borrador, descripcion='Acción 2', orden=2)

        self.client.force_authenticate(user=self.docente)
        url = reverse('cronograma-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_docente_puede_agregar_accion_cronograma(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('cronograma-list', args=[self.proyecto_borrador.id])
        data = {'descripcion': 'Reunión inicial', 'mes_semana': 'Mes 1', 'orden': 1}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['descripcion'], 'Reunión inicial')
        self.assertTrue(CronogramaAccion.objects.filter(proyecto=self.proyecto_borrador).exists())

    def test_no_propietario_no_puede_agregar_accion_cronograma(self):
        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('cronograma-list', args=[self.proyecto_borrador.id])
        data = {'descripcion': 'Acción no autorizada', 'orden': 1}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_puede_agregar_cronograma_a_proyecto_en_revision(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('cronograma-list', args=[self.proyecto_en_revision.id])
        data = {'descripcion': 'Acción bloqueada', 'orden': 1}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_docente_puede_editar_accion_cronograma(self):
        accion = CronogramaAccion.objects.create(
            proyecto=self.proyecto_borrador, descripcion='Acción original', orden=1)

        self.client.force_authenticate(user=self.docente)
        url = reverse('cronograma-detail', args=[self.proyecto_borrador.id, accion.id])
        response = self.client.patch(url, {'descripcion': 'Acción editada'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['descripcion'], 'Acción editada')

    def test_no_propietario_no_puede_editar_accion_cronograma(self):
        accion = CronogramaAccion.objects.create(
            proyecto=self.proyecto_borrador, descripcion='Acción original', orden=1)

        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('cronograma-detail', args=[self.proyecto_borrador.id, accion.id])
        response = self.client.patch(url, {'descripcion': 'Intento ilegal'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_puede_eliminar_accion_cronograma(self):
        accion = CronogramaAccion.objects.create(
            proyecto=self.proyecto_borrador, descripcion='Acción a eliminar', orden=1)

        self.client.force_authenticate(user=self.docente)
        url = reverse('cronograma-detail', args=[self.proyecto_borrador.id, accion.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CronogramaAccion.objects.filter(id=accion.id).exists())


class PresupuestoAPITests(BaseProyectoTestCase):

    def test_listar_partidas_del_proyecto(self):
        PartidaPresupuestaria.objects.create(
            proyecto=self.proyecto_borrador, categoria='refrigerio', cantidad=2, costo_unitario=10)

        self.client.force_authenticate(user=self.docente)
        url = reverse('presupuesto-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_no_propietario_no_puede_listar_partidas(self):
        PartidaPresupuestaria.objects.create(
            proyecto=self.proyecto_borrador, categoria='refrigerio', cantidad=2, costo_unitario=10)

        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('presupuesto-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_docente_puede_agregar_partida_presupuestaria(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('presupuesto-list', args=[self.proyecto_borrador.id])
        data = {'categoria': 'transporte', 'cantidad': 3, 'costo_unitario': '15.00'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['monto_presupuestado'], Decimal('45.00'))

    def test_partida_otros_requiere_descripcion(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('presupuesto-list', args=[self.proyecto_borrador.id])
        data = {'categoria': 'otros', 'cantidad': 1, 'costo_unitario': '10.00'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_propietario_no_puede_agregar_partida(self):
        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('presupuesto-list', args=[self.proyecto_borrador.id])
        data = {'categoria': 'transporte', 'cantidad': 1, 'costo_unitario': '10.00'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MetasIndicadoresAPITests(BaseProyectoTestCase):

    def test_listar_metas_indicadores_del_proyecto(self):
        MetaIndicadorProyecto.objects.create(
            proyecto=self.proyecto_borrador,
            meta_descripcion='Capacitar a 50 docentes',
            indicador_nombre='Nro de docentes capacitados',
            valor_meta=50,
        )

        self.client.force_authenticate(user=self.docente)
        url = reverse('meta-indicador-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_no_propietario_no_puede_listar_metas_indicadores(self):
        MetaIndicadorProyecto.objects.create(
            proyecto=self.proyecto_borrador,
            meta_descripcion='Capacitar a 50 docentes',
            indicador_nombre='Nro de docentes capacitados',
            valor_meta=50,
        )

        self.client.force_authenticate(user=self.otro_docente)
        url = reverse('meta-indicador-list', args=[self.proyecto_borrador.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_docente_puede_agregar_meta_indicador(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('meta-indicador-list', args=[self.proyecto_borrador.id])
        data = {
            'meta_descripcion': 'Capacitar a 50 docentes',
            'indicador_nombre': 'Nro de docentes capacitados',
            'linea_base': 0,
            'valor_meta': 50,
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_valor_meta_debe_superar_linea_base(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('meta-indicador-list', args=[self.proyecto_borrador.id])
        data = {
            'meta_descripcion': 'Capacitar a 50 docentes',
            'indicador_nombre': 'Nro de docentes capacitados',
            'linea_base': 50,
            'valor_meta': 10,
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_puede_agregar_meta_indicador_a_proyecto_en_revision(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('meta-indicador-list', args=[self.proyecto_en_revision.id])
        data = {
            'meta_descripcion': 'Meta bloqueada',
            'indicador_nombre': 'Indicador bloqueado',
            'valor_meta': 10,
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DocumentoSustentoValidationTests(BaseProyectoTestCase):

    def test_extension_no_permitida_es_rechazada(self):
        documento = DocumentoSustentoProyecto(
            proyecto=self.proyecto_borrador,
            archivo=SimpleUploadedFile('malware.exe', b'contenido', content_type='application/octet-stream'),
        )
        with self.assertRaises(ValidationError):
            documento.full_clean()

    def test_pdf_es_aceptado(self):
        documento = DocumentoSustentoProyecto(
            proyecto=self.proyecto_borrador,
            archivo=SimpleUploadedFile('sustento.pdf', b'%PDF-1.4 contenido', content_type='application/pdf'),
        )
        documento.full_clean()

    def test_archivo_demasiado_grande_es_rechazado(self):
        contenido_grande = b'0' * (11 * 1024 * 1024)  # 11MB > limite de 10MB
        documento = DocumentoSustentoProyecto(
            proyecto=self.proyecto_borrador,
            archivo=SimpleUploadedFile('sustento.pdf', contenido_grande, content_type='application/pdf'),
        )
        with self.assertRaises(ValidationError):
            documento.full_clean()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class AvancesEvidenciasAPITests(APITestCase):
    """HU-05 (T-86 a T-90): registro de avances, evidencias y notificaciones."""

    # Placeholder only - all tests use force_authenticate, not real login
    _cred = None

    def setUp(self):
        self.rol_docente = Rol.objects.get(nombre='Docente')
        self.rol_jefatura = Rol.objects.get(nombre='Jefatura RSU')
        self.eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.escuela = EscuelaProfesional.objects.get(codigo='EPIS')
        self.departamento = DepartamentoAcademico.objects.get(codigo='DAISI')

        self.docente = Usuario.objects.create_user(
            correo_institucional='docente.avance@unsa.edu.pe', password=self._cred,
            nombres='Docente Avances', rol=self.rol_docente, facultad=self.facultad,
        )
        self.otro_docente = Usuario.objects.create_user(
            correo_institucional='otro.avance@unsa.edu.pe', password=self._cred,
            nombres='Otro Docente', rol=self.rol_docente, facultad=self.facultad,
        )
        self.jefatura = Usuario.objects.create_user(
            correo_institucional='jefatura.avance@unsa.edu.pe', password=self._cred,
            nombres='Jefatura RSU', rol=self.rol_jefatura, facultad=self.facultad,
        )

        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-HU05', anio=2026, semestre='II',
            fecha_inicio='2026-09-01', fecha_fin='2027-01-31', activo=True,
        )
        self.proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto Aprobado HU05',
            eje_rsu=self.eje_gestion, periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente, semestre_academico='2026-II',
            estado='aprobado',
        )
        self.proyecto_borrador = ProyectoRSU.objects.create(
            titulo='Proyecto Borrador HU05',
            eje_rsu=self.eje_gestion, periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente, semestre_academico='2026-II',
            estado='borrador',
        )
        self.act1 = ActividadProyecto.objects.create(
            proyecto=self.proyecto, nombre='Taller de capacitación', orden=1)
        self.act2 = ActividadProyecto.objects.create(
            proyecto=self.proyecto, nombre='Jornada de limpieza', orden=2)

    # ── helpers ──────────────────────────────────────────────────────────────

    def _url_avances(self, proyecto=None):
        return reverse('avance-list', kwargs={'proyecto_pk': (proyecto or self.proyecto).pk})

    def _url_evidencias(self, avance):
        return reverse('evidencia-list', kwargs={
            'proyecto_pk': self.proyecto.pk, 'avance_pk': avance.pk})

    def _registrar_avance(self, actividad=None, estado='completada'):
        self.client.force_authenticate(user=self.docente)
        return self.client.post(self._url_avances(), {
            'actividad': (actividad or self.act1).pk,
            'descripcion': 'Se ejecutó el taller con 30 asistentes.',
            'estado_actividad': estado,
        }, format='json')

    def _crear_avance_directo(self):
        return AvanceActividad.objects.create(
            proyecto=self.proyecto, actividad=self.act1,
            descripcion='Avance base', estado_actividad='en_ejecucion', autor=self.docente)

    @staticmethod
    def _items(response):
        """La lista viene paginada por defecto (PAGE_SIZE=20)."""
        return response.data['results'] if isinstance(response.data, dict) else response.data

    # ── T-86: registro de avances ────────────────────────────────────────────

    def test_registrar_avance_actualiza_estado_actividad_y_porcentaje(self):
        response = self._registrar_avance(estado='completada')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.act1.refresh_from_db()
        self.proyecto.refresh_from_db()
        self.assertEqual(self.act1.estado, 'completada')                        # CA-01
        self.assertEqual(self.proyecto.porcentaje_ejecucion, Decimal('50.00'))  # CA-02: 1 de 2
        self.assertEqual(self.proyecto.estado, 'en_ejecucion')
        self.assertIsNotNone(self.proyecto.fecha_inicio_ejecucion)
        self.assertIsNotNone(response.data['created_at'])                       # CA-05
        self.assertEqual(response.data['autor'], self.docente.pk)               # CA-05

    def test_porcentaje_llega_a_100_con_todas_las_actividades_completadas(self):
        self._registrar_avance(actividad=self.act1, estado='completada')
        self._registrar_avance(actividad=self.act2, estado='completada')
        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.porcentaje_ejecucion, Decimal('100.00'))

    def test_actividad_en_ejecucion_no_suma_al_porcentaje(self):
        self._registrar_avance(actividad=self.act1, estado='en_ejecucion')
        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.porcentaje_ejecucion, Decimal('0.00'))

    def test_no_se_registra_avance_en_proyecto_borrador(self):
        actividad = ActividadProyecto.objects.create(
            proyecto=self.proyecto_borrador, nombre='Act borrador', orden=1)
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_avances(self.proyecto_borrador), {
            'actividad': actividad.pk, 'descripcion': 'x', 'estado_actividad': 'completada',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_docente_no_responsable_no_puede_registrar_avance(self):
        self.client.force_authenticate(user=self.otro_docente)
        response = self.client.post(self._url_avances(), {
            'actividad': self.act1.pk, 'descripcion': 'x', 'estado_actividad': 'completada',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_avance_con_actividad_de_otro_proyecto_es_rechazado(self):
        actividad_ajena = ActividadProyecto.objects.create(
            proyecto=self.proyecto_borrador, nombre='Ajena', orden=1)
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_avances(), {
            'actividad': actividad_ajena.pk, 'descripcion': 'x', 'estado_actividad': 'completada',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_descripcion_es_obligatoria(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_avances(), {
            'actividad': self.act1.pk, 'descripcion': '   ', 'estado_actividad': 'completada',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_historial_de_avances_es_append_only(self):
        self._registrar_avance()
        avance = AvanceActividad.objects.get(proyecto=self.proyecto)
        url = reverse('avance-detail', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.docente)
        self.assertEqual(
            self.client.patch(url, {'descripcion': 'otra'}, format='json').status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_jefatura_rsu_visualiza_historial_de_avances(self):
        self._registrar_avance()
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(self._url_avances())          # CA-06
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self._items(response)), 1)

    # ── T-87: evidencias ─────────────────────────────────────────────────────

    def test_carga_evidencia_pdf(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_evidencias(avance), {
            'tipo': 'archivo',
            'archivo': SimpleUploadedFile(
                'asistencia.pdf', b'%PDF-1.4 contenido', content_type='application/pdf'),
            'nombre': 'Lista de asistencia',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)   # CA-03

    def test_carga_evidencia_imagen_png(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_evidencias(avance), {
            'tipo': 'archivo',
            'archivo': SimpleUploadedFile('foto.png', b'\x89PNG\r\n', content_type='image/png'),
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_evidencia_con_formato_no_permitido_es_rechazada(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_evidencias(avance), {
            'tipo': 'archivo',
            'archivo': SimpleUploadedFile(
                'malware.exe', b'contenido', content_type='application/octet-stream'),
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # CA-04

    def test_carga_evidencia_como_enlace_drive(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_evidencias(avance), {
            'tipo': 'enlace',
            'enlace_drive': 'https://drive.google.com/file/d/abc123/view',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_evidencia_tipo_enlace_sin_url_es_rechazada(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url_evidencias(avance), {'tipo': 'enlace'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eliminar_evidencia_es_soft_delete_y_conserva_el_registro(self):
        avance = self._crear_avance_directo()
        evidencia = EvidenciaAvance.objects.create(
            avance=avance, tipo='enlace', enlace_drive='https://drive.google.com/file/d/x/view')
        url = reverse('evidencia-detail', kwargs={
            'proyecto_pk': self.proyecto.pk, 'avance_pk': avance.pk, 'pk': evidencia.pk})

        self.client.force_authenticate(user=self.docente)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        evidencia.refresh_from_db()   # el registro histórico se conserva
        self.assertTrue(evidencia.eliminada)
        self.assertIsNotNone(evidencia.eliminada_en)
        self.assertEqual(len(self._items(self.client.get(self._url_evidencias(avance)))), 0)

    def test_otro_docente_no_puede_cargar_evidencias(self):
        avance = self._crear_avance_directo()
        self.client.force_authenticate(user=self.otro_docente)
        response = self.client.post(self._url_evidencias(avance), {
            'tipo': 'enlace', 'enlace_drive': 'https://drive.google.com/file/d/x/view',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── T-90: observación y notificaciones ───────────────────────────────────

    def test_jefatura_observa_avance_y_notifica_al_docente(self):
        avance = self._crear_avance_directo()
        url = reverse('avance-observar', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.post(url, {'comentario': 'Falta la lista de asistencia.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        avance.refresh_from_db()
        self.assertEqual(avance.estado_revision, 'observado')
        self.assertEqual(avance.revisor, self.jefatura)
        self.assertIsNotNone(avance.revisado_en)

        notificacion = Notificacion.objects.get(
            destinatario=self.docente, tipo='avance_observado')
        self.assertIn('Falta la lista de asistencia.', notificacion.mensaje)

    def test_observar_avance_requiere_comentario(self):
        avance = self._crear_avance_directo()
        url = reverse('avance-observar', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.post(url, {'comentario': '   '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_docente_no_puede_observar_avances(self):
        avance = self._crear_avance_directo()
        url = reverse('avance-observar', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(url, {'comentario': 'auto-observación'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_docente_corrige_avance_observado_y_notifica_al_revisor(self):
        avance = self._crear_avance_directo()
        avance.estado_revision = 'observado'
        avance.revisor = self.jefatura
        avance.save(update_fields=['estado_revision', 'revisor'])

        url = reverse('avance-corregir', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(url, {'comentario': 'Ya subí la lista.'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        avance.refresh_from_db()
        self.assertEqual(avance.estado_revision, 'corregido')
        self.assertTrue(Notificacion.objects.filter(
            destinatario=self.jefatura, tipo='avance_corregido').exists())

    def test_no_se_puede_corregir_un_avance_no_observado(self):
        avance = self._crear_avance_directo()
        url = reverse('avance-corregir', kwargs={'proyecto_pk': self.proyecto.pk, 'pk': avance.pk})
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
