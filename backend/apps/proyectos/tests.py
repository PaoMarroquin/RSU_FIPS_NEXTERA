from decimal import Decimal
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.usuarios.models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, MatrizOperativa, EjeRSU, ODS, LineaEstrategica, ObjetivoInstitucional
from apps.proyectos.models import (
    ProyectoRSU, ActividadProyecto, CronogramaAccion,
    PartidaPresupuestaria, MetaIndicadorProyecto, DocumentoSustentoProyecto,
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

        from apps.proyectos.models import ProyectoAsignatura, MetaIndicadorProyecto, PartidaPresupuestaria
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
