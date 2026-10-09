"""
Pruebas de la API de proyectos RSU.

Cubren el ciclo de vida completo y las reglas de negocio del modulo.

Casos cubiertos:
- Alta y edicion del proyecto, y bloqueo de la edicion fuera de borrador u
  observado.
- Visibilidad por rol: cada rol solo ve lo que le corresponde.
- Validaciones del ANEXO 4: coherencia facultad/escuela/departamento,
  detalle obligatorio de "otro", tipo de actividad valido.
- Sub-recursos: actividades, cronograma, presupuesto y metas e indicadores.
- Documentos de sustento: formato y tamano permitidos.
- Seguimiento (HU-05): registro de avances, evidencias, recalculo del
  porcentaje de ejecucion y caracter no editable del historial.
- Informes consolidados (HU-06): alcance por estado y por rol, filtros,
  caracter de solo lectura y descarga en PDF y Excel.
- Repositorio historico (HU-07): solo proyectos finalizados, filtros simples
  y combinados, ficha tecnica, informe final y lecciones aprendidas.

Conecta con:
- apps/proyectos/views.py y serializers.py: comportamiento bajo prueba.
- apps/usuarios/models.py y apps/planificacion/models.py: datos de apoyo que
  se crean en setUp.
"""
import tempfile
from decimal import Decimal
from io import BytesIO

import openpyxl
from django.urls import reverse
from django.test import override_settings
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.usuarios.models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, EjeRSU, ODS, LineaEstrategica, ObjetivoInstitucional
from apps.proyectos.models import (
    InformeFinalizacion,
    ProyectoRSU, ActividadProyecto, CronogramaAccion,
    PartidaPresupuestaria, MetaIndicadorProyecto, DocumentoSustentoProyecto,
    AvanceActividad, EvidenciaAvance, Notificacion, FuenteFinanciamiento,
    HistorialEstadoProyecto,
)


def completar_para_revision(proyecto, ods):
    """Llena todo lo que exige el envío a revisión (los textos admiten "n/a")."""
    from apps.proyectos.models import ProyectoAsignatura
    from apps.planificacion.models import EjeRSU as _Eje
    for campo in [
        'lugar_ejecucion', 'fund_por_que_grupo', 'fund_para_que_proyecto',
        'fund_mecanismo_ensenanza', 'diag_estado_grupo', 'diag_problemas_detectados',
        'diag_aportes_formacion', 'diag_justificacion_intervencion',
        'obj_logro_intervencion', 'obj_mejora_curricular',
        'resultado_en_beneficiarios', 'resultado_en_curriculo',
        'rec_mat_material_didactico', 'rec_mat_afiches', 'rec_mat_equipos',
        'rec_mat_utiles', 'rec_mat_otros',
    ]:
        setattr(proyecto, campo, 'n/a')
    for campo in ['fecha_inicio', 'fecha_evaluacion_avance', 'fecha_encuesta_docentes',
                  'fecha_encuesta_alumnos', 'fecha_encuesta_grupo_destinatario']:
        setattr(proyecto, campo, '2026-04-01')
    proyecto.fecha_termino = '2026-12-31'
    proyecto.tipo_actividad = ['asesoria']
    proyecto.benef_otro_detalle = 'Comunidad universitaria'
    proyecto.nro_docentes = 2
    proyecto.docentes_participantes = ['Ana Pérez', 'Luis Quispe']
    proyecto.nro_estudiantes = 20
    proyecto.rec_hum_docentes = 2
    proyecto.save()
    if not proyecto.ejes_rsu.exists():
        proyecto.ejes_rsu.add(_Eje.objects.first())
    proyecto.ods.add(ods)
    ProyectoAsignatura.objects.create(proyecto=proyecto, nombre_asignatura='Curso Prueba')
    MetaIndicadorProyecto.objects.create(
        proyecto=proyecto, meta_descripcion='Capacitar a 50 beneficiarios',
        indicador_nombre='Nro de beneficiarios', linea_base=0, valor_meta=50)
    fuente = FuenteFinanciamiento.objects.create(
        proyecto=proyecto, fuente='autofinanciado', monto=150)
    PartidaPresupuestaria.objects.create(
        proyecto=proyecto, categoria='material_escritorio', cantidad=10,
        costo_unitario=15, fuente=fuente)
    actividad = ActividadProyecto.objects.create(
        proyecto=proyecto, nombre='Taller', descripcion='Taller de capacitación', orden=1)
    CronogramaAccion.objects.create(
        proyecto=proyecto, actividad=actividad, descripcion='Preparar materiales',
        fecha_inicio='2026-04-01', fecha_fin='2026-04-10', responsable='Docente',
        evidencia_esperada='Fotos', orden=1)
    return actividad

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

        # Create Objetivo
        self.objetivo = ObjetivoInstitucional.objects.create(
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
            'ejes_rsu': [self.eje_gestion.id],
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
            'ejes_rsu': [self.eje_gestion.id],
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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='en_revision'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

        self.client.force_authenticate(user=self.docente_user)
        url = reverse('proyecto-revisar', args=[proyecto.id])

        # Try sending to review - should fail
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for campo in ['ods', 'asignaturas', 'metas_indicadores', 'presupuesto',
                      'actividades', 'docentes_participantes', 'fuentes_financiamiento',
                      'obj_mejora_curricular', 'fecha_evaluacion_avance']:
            self.assertIn(campo, response.data['errors'])

        # 2. Complete all required fields and relationships
        completar_para_revision(proyecto, self.ods_1)

        # Try sending to review again - should succeed
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['estado'], 'en_revision')
        self.assertIsNotNone(response.data['fecha_envio_revision'])

    def test_enviar_exige_acciones_en_cada_actividad(self):
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto cronograma', periodo=self.periodo, facultad=self.facultad,
            escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente_user, estado='borrador')
        completar_para_revision(proyecto, self.ods_1)
        ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Sin acciones', descripcion='Falta su bloque', orden=2)
        self.client.force_authenticate(user=self.docente_user)

        response = self.client.post(reverse('proyecto-revisar', args=[proyecto.id]), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cronograma', response.data['errors'])

    def test_enviar_rechaza_acciones_sin_actividad(self):
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto acción suelta', periodo=self.periodo, facultad=self.facultad,
            escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente_user, estado='borrador')
        completar_para_revision(proyecto, self.ods_1)
        CronogramaAccion.objects.create(proyecto=proyecto, descripcion='Suelta', orden=9)
        self.client.force_authenticate(user=self.docente_user)

        response = self.client.post(reverse('proyecto-revisar', args=[proyecto.id]), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cronograma', response.data['errors'])

    def test_enviar_exige_un_nombre_por_cada_docente(self):
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto docentes', periodo=self.periodo, facultad=self.facultad,
            escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente_user, estado='borrador')
        completar_para_revision(proyecto, self.ods_1)
        proyecto.nro_docentes = 3
        proyecto.save(update_fields=['nro_docentes'])
        self.client.force_authenticate(user=self.docente_user)

        response = self.client.post(reverse('proyecto-revisar', args=[proyecto.id]), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('docentes_participantes', response.data['errors'])

    def test_docente_can_delete_draft_project(self):
        """
        Verify that a teacher (owner) can delete a project in draft state.
        """
        proyecto = ProyectoRSU.objects.create(
            titulo='Proyecto a Eliminar',
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='en_revision'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente_user,
            semestre_academico='2026-I',
            estado='borrador'
        )
        proyecto.ejes_rsu.set([self.eje_gestion])

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
            'ejes_rsu': [self.eje_gestion.id],
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
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente,
            semestre_academico='2026-II',
            estado='borrador',
        )
        self.proyecto_borrador.ejes_rsu.set([self.eje_gestion])
        self.proyecto_en_revision = ProyectoRSU.objects.create(
            titulo='Proyecto Base En Revisión',
            periodo=self.periodo,
            facultad=self.facultad,
            escuela=self.escuela,
            departamento=self.departamento,
            docente_responsable=self.docente,
            semestre_academico='2026-II',
            estado='en_revision',
        )
        self.proyecto_en_revision.ejes_rsu.set([self.eje_gestion])


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
            periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente, semestre_academico='2026-II',
            estado='aprobado',
        )
        self.proyecto.ejes_rsu.set([self.eje_gestion])
        self.proyecto_borrador = ProyectoRSU.objects.create(
            titulo='Proyecto Borrador HU05',
            periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente, semestre_academico='2026-II',
            estado='borrador',
        )
        self.proyecto_borrador.ejes_rsu.set([self.eje_gestion])
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


# ──────────────────────────────────────────────────────────────────────────────
# Revisión de la planificación (HU-06): número de proyecto y observaciones
# ──────────────────────────────────────────────────────────────────────────────

class _BaseFlujoTestCase(APITestCase):
    """Usuarios de los cuatro roles sobre un mismo departamento, y uno ajeno."""

    def setUp(self):
        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.escuela = EscuelaProfesional.objects.get(codigo='EPIS')
        self.departamento = DepartamentoAcademico.objects.get(codigo='DAISI')
        self.otro_departamento = DepartamentoAcademico.objects.filter(
            facultad=self.facultad).exclude(pk=self.departamento.pk).first()
        self.ods = ODS.objects.get(numero=4)

        def usuario(correo, nombre_rol, **extra):
            return Usuario.objects.create_user(
                correo_institucional=correo, password=None, nombres=correo.split('@')[0],
                rol=Rol.objects.get(nombre=nombre_rol), facultad=self.facultad, **extra)

        self.docente = usuario('docente.flujo@unsa.edu.pe', 'Docente')
        self.otro_docente = usuario('otro.flujo@unsa.edu.pe', 'Docente')
        self.depto = usuario('depto.flujo@unsa.edu.pe', 'Departamento', departamento=self.departamento)
        self.depto_ajeno = usuario('depto.ajeno@unsa.edu.pe', 'Departamento',
                                   departamento=self.otro_departamento)
        self.jefatura = usuario('jefatura.flujo@unsa.edu.pe', 'Jefatura RSU')
        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-FLUJO', anio=2026, semestre='II',
            fecha_inicio='2026-09-01', fecha_fin='2027-01-31', activo=True)

    def crear_proyecto(self, estado, **extra):
        proyecto = ProyectoRSU.objects.create(
            titulo=extra.pop('titulo', 'Proyecto del flujo'), periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela, departamento=self.departamento,
            docente_responsable=self.docente, estado=estado, **extra)
        proyecto.ejes_rsu.set([EjeRSU.objects.get(nombre='Gestión')])
        return proyecto


class RevisionPlanificacionAPITests(_BaseFlujoTestCase):

    def test_aprobar_exige_numero_de_proyecto(self):
        proyecto = self.crear_proyecto('en_revision')
        self.client.force_authenticate(user=self.depto)
        url = reverse('proyecto-aprobar', args=[proyecto.pk])

        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('codigo', response.data['errors'])

        response = self.client.post(url, {'codigo': 'RSU-FIPS-2026-015'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        proyecto.refresh_from_db()
        self.assertEqual(proyecto.estado, 'aprobado')
        self.assertEqual(proyecto.codigo, 'RSU-FIPS-2026-015')

    def test_aprobar_rechaza_numero_repetido(self):
        self.crear_proyecto('aprobado', titulo='Ya aprobado', codigo='RSU-001')
        proyecto = self.crear_proyecto('en_revision')
        self.client.force_authenticate(user=self.depto)
        response = self.client.post(
            reverse('proyecto-aprobar', args=[proyecto.pk]), {'codigo': 'RSU-001'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crear_proyecto_ya_no_genera_codigo_y_deriva_el_semestre(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'titulo': 'Sin código todavía', 'facultad': self.facultad.pk,
            'periodo': self.periodo.pk, 'semestre_academico': 'texto libre ignorado',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['codigo'])
        self.assertEqual(response.data['semestre_academico'], self.periodo.nombre)

    def test_observar_exige_15_caracteres_y_guarda_secciones(self):
        proyecto = self.crear_proyecto('en_revision')
        self.client.force_authenticate(user=self.depto)
        url = reverse('proyecto-observar', args=[proyecto.pk])

        response = self.client.post(url, {'comentario_tecnico': 'Corto'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(url, {
            'comentario_tecnico': 'Revisar presupuesto y cronograma.',
            'observaciones_secciones': {'financiamiento': 'La partida 2 no cuadra.', 'objetivos': ''},
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        revision = proyecto.revisiones.get()
        self.assertEqual(revision.etapa, 'planificacion')
        self.assertEqual(revision.observaciones_secciones, {'financiamiento': 'La partida 2 no cuadra.'})

    def test_observar_rechaza_secciones_que_no_existen(self):
        proyecto = self.crear_proyecto('en_revision')
        self.client.force_authenticate(user=self.depto)
        response = self.client.post(reverse('proyecto-observar', args=[proyecto.pk]), {
            'comentario_tecnico': 'Comentario suficientemente largo.',
            'observaciones_secciones': {'seccion_inventada': 'x'},
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────────────────────────────────────
# Formulación: valores no negativos, docentes por nombre, sin edición en ejecución
# ──────────────────────────────────────────────────────────────────────────────

class FormulacionAjustesAPITests(_BaseFlujoTestCase):

    def test_no_permite_valores_negativos(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'titulo': 'Negativos', 'facultad': self.facultad.pk, 'nro_estudiantes': -3,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        proyecto = self.crear_proyecto('borrador')
        response = self.client.post(reverse('meta-indicador-list', args=[proyecto.pk]), {
            'meta_descripcion': 'Meta', 'indicador_nombre': 'Ind', 'linea_base': -1, 'valor_meta': 5,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_guarda_docentes_por_nombre_y_observacion_de_estudiantes(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'titulo': 'Con docentes', 'facultad': self.facultad.pk, 'nro_docentes': 2,
            'docentes_participantes': [' Ana Pérez ', 'Luis Quispe'],
            'observacion_estudiantes': 'Participan estudiantes de 3er año.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['docentes_participantes'], ['Ana Pérez', 'Luis Quispe'])
        self.assertEqual(response.data['observacion_estudiantes'], 'Participan estudiantes de 3er año.')

    def test_actividad_con_su_bloque_de_acciones(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'titulo': 'Cronograma por actividad', 'facultad': self.facultad.pk,
            'actividades': [{
                'nombre': 'Taller', 'descripcion': 'Taller de reciclaje', 'orden': 1,
                'acciones': [{
                    'descripcion': 'Convocatoria', 'fecha_inicio': '2026-04-01',
                    'fecha_fin': '2026-04-05', 'responsable': 'Docente',
                    'evidencia_esperada': 'Lista de inscritos',
                }],
            }],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        proyecto = ProyectoRSU.objects.get(pk=response.data['id'])
        self.assertEqual(proyecto.cronograma.get().actividad.nombre, 'Taller')
        self.assertEqual(response.data['actividades'][0]['acciones'][0]['evidencia_esperada'],
                         'Lista de inscritos')

    def test_accion_con_fecha_fin_anterior_al_inicio(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'titulo': 'Fechas al revés', 'facultad': self.facultad.pk,
            'actividades': [{'nombre': 'T', 'descripcion': 'd', 'acciones': [{
                'descripcion': 'A', 'fecha_inicio': '2026-05-10', 'fecha_fin': '2026-05-01'}]}],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_editar_reemplaza_actividades_y_conserva_acciones_ligadas(self):
        proyecto = self.crear_proyecto('borrador')
        self.client.force_authenticate(user=self.docente)
        url = reverse('proyecto-detail', args=[proyecto.pk])
        cuerpo = {'actividades': [{'nombre': 'Nueva', 'descripcion': 'd', 'acciones': [
            {'descripcion': 'Acc 1'}, {'descripcion': 'Acc 2'}]}], 'cronograma': []}
        response = self.client.patch(url, cuerpo, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(proyecto.cronograma.filter(actividad__nombre='Nueva').count(), 2)

    def test_editar_con_acciones_anidadas_borra_acciones_viejas_sin_actividad(self):
        proyecto = self.crear_proyecto('borrador')
        CronogramaAccion.objects.create(proyecto=proyecto, actividad=None, descripcion='Vieja', orden=1)
        self.client.force_authenticate(user=self.docente)
        response = self.client.patch(reverse('proyecto-detail', args=[proyecto.pk]), {
            'actividades': [{'nombre': 'Nueva', 'descripcion': 'd', 'acciones': [
                {'descripcion': 'Acc 1'}]}]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(proyecto.cronograma.filter(actividad__isnull=True).exists())
        self.assertEqual(proyecto.cronograma.count(), 1)

    def test_proyecto_en_ejecucion_no_edita_presupuesto_ni_metas(self):
        proyecto = self.crear_proyecto('en_ejecucion')
        partida = PartidaPresupuestaria.objects.create(
            proyecto=proyecto, categoria='refrigerio', cantidad=1, costo_unitario=10)
        self.client.force_authenticate(user=self.docente)

        response = self.client.patch(
            reverse('presupuesto-detail', args=[proyecto.pk, partida.pk]), {'cantidad': 5}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(reverse('meta-indicador-list', args=[proyecto.pk]), {
            'meta_descripcion': 'Meta', 'indicador_nombre': 'Ind', 'valor_meta': 5,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ──────────────────────────────────────────────────────────────────────────────
# Mis actividades: evidencia en un solo paso
# ──────────────────────────────────────────────────────────────────────────────

@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class EvidenciaActividadAPITests(_BaseFlujoTestCase):

    def setUp(self):
        super().setUp()
        self.proyecto = self.crear_proyecto('aprobado')
        self.act1 = ActividadProyecto.objects.create(proyecto=self.proyecto, nombre='A1', orden=1)
        self.act2 = ActividadProyecto.objects.create(proyecto=self.proyecto, nombre='A2', orden=2)

    def _url(self, actividad):
        return reverse('actividad-evidencia', args=[self.proyecto.pk, actividad.pk])

    def test_subir_archivo_completa_la_actividad_y_recalcula(self):
        self.client.force_authenticate(user=self.docente)
        archivo = SimpleUploadedFile('foto.jpg', b'\xff\xd8\xff contenido', content_type='image/jpeg')
        response = self.client.post(self._url(self.act1), {
            'archivo': archivo, 'observacion': 'Se realizó con 30 asistentes.'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.act1.refresh_from_db()
        self.proyecto.refresh_from_db()
        self.assertEqual(self.act1.estado, 'completada')
        self.assertEqual(self.proyecto.estado, 'en_ejecucion')
        self.assertEqual(self.proyecto.porcentaje_ejecucion, Decimal('50.00'))
        self.assertEqual(EvidenciaAvance.objects.filter(avance__actividad=self.act1).count(), 1)

    def test_enlace_de_drive_tambien_sirve(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(self._url(self.act2), {
            'enlace_drive': 'https://drive.google.com/file/d/abc/view'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_exige_archivo_o_enlace_pero_no_ambos(self):
        self.client.force_authenticate(user=self.docente)
        self.assertEqual(self.client.post(self._url(self.act1), {}, format='json').status_code,
                         status.HTTP_400_BAD_REQUEST)
        archivo = SimpleUploadedFile('foto.png', b'png', content_type='image/png')
        response = self.client.post(self._url(self.act1), {
            'archivo': archivo, 'enlace_drive': 'https://drive.google.com/x'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rechaza_formato_no_permitido(self):
        self.client.force_authenticate(user=self.docente)
        archivo = SimpleUploadedFile('virus.exe', b'MZ', content_type='application/octet-stream')
        response = self.client.post(self._url(self.act1), {'archivo': archivo}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.act1.refresh_from_db()
        self.assertEqual(self.act1.estado, 'pendiente')

    def test_solo_el_docente_responsable(self):
        self.client.force_authenticate(user=self.otro_docente)
        response = self.client.post(self._url(self.act1), {
            'enlace_drive': 'https://drive.google.com/x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_estado_de_actividad_no_se_cambia_a_mano(self):
        proyecto = self.crear_proyecto('borrador', titulo='Borrador')
        act = ActividadProyecto.objects.create(proyecto=proyecto, nombre='X', orden=1)
        self.client.force_authenticate(user=self.docente)
        self.client.patch(reverse('actividad-detail', args=[proyecto.pk, act.pk]),
                          {'estado': 'completada'}, format='json')
        act.refresh_from_db()
        self.assertEqual(act.estado, 'pendiente')


# ──────────────────────────────────────────────────────────────────────────────
# Seguimiento en solo lectura (HU-16)
# ──────────────────────────────────────────────────────────────────────────────

class SeguimientoAPITests(_BaseFlujoTestCase):

    def test_departamento_jefatura_y_docente_ven_el_avance_por_actividad(self):
        proyecto = self.crear_proyecto('en_ejecucion', porcentaje_ejecucion=Decimal('50.00'))
        act = ActividadProyecto.objects.create(proyecto=proyecto, nombre='A1', orden=1, estado='completada')
        CronogramaAccion.objects.create(proyecto=proyecto, actividad=act, descripcion='Acc', orden=1)
        avance = AvanceActividad.objects.create(
            proyecto=proyecto, actividad=act, descripcion='Hecho',
            estado_actividad='completada', autor=self.docente)
        EvidenciaAvance.objects.create(avance=avance, tipo='enlace',
                                       enlace_drive='https://drive.google.com/x')

        for usuario in (self.depto, self.jefatura, self.docente):
            self.client.force_authenticate(user=usuario)
            response = self.client.get(reverse('proyecto-seguimiento', args=[proyecto.pk]))
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['porcentaje_ejecucion'], 50.0)
            fila = response.data['actividades'][0]
            self.assertTrue(fila['completada'])
            self.assertEqual(len(fila['acciones']), 1)
            self.assertEqual(fila['evidencias'][0]['url'], 'https://drive.google.com/x')

    def test_departamento_ajeno_no_lo_ve(self):
        proyecto = self.crear_proyecto('en_ejecucion')
        self.client.force_authenticate(user=self.depto_ajeno)
        response = self.client.get(reverse('proyecto-seguimiento', args=[proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ──────────────────────────────────────────────────────────────────────────────
# Informe de Finalización, aprobación de la finalización y constancia
# (HU-09 y Sprint 8, T-137 a T-141)
# ──────────────────────────────────────────────────────────────────────────────

class FinalizacionAPITests(_BaseFlujoTestCase):

    def setUp(self):
        super().setUp()
        self.proyecto = self.crear_proyecto(
            'en_ejecucion', porcentaje_ejecucion=Decimal('100.00'), codigo='RSU-FIN-01')
        self.meta = MetaIndicadorProyecto.objects.create(
            proyecto=self.proyecto, meta_descripcion='Capacitar', indicador_nombre='Personas',
            linea_base=0, valor_meta=50)
        self.partida = PartidaPresupuestaria.objects.create(
            proyecto=self.proyecto, categoria='refrigerio', cantidad=10, costo_unitario=5)
        ActividadProyecto.objects.create(
            proyecto=self.proyecto, nombre='A1', orden=1, estado='completada')

    def _informe_completo(self):
        return {
            'conclusiones': 'Se cumplió el objetivo.', 'recomendaciones': 'Repetir el taller.',
            'lecciones_aprendidas': 'Coordinar antes con la comunidad.', 'medio_difusion': 'n/a',
            'metas': [{'id': self.meta.pk, 'valor_alcanzado': 45}],
            'partidas': [{'id': self.partida.pk, 'monto_ejecutado': 48.5}],
        }

    def _enviar(self):
        self.client.force_authenticate(user=self.docente)
        self.client.patch(reverse('informe-finalizacion', args=[self.proyecto.pk]),
                          self._informe_completo(), format='json')
        return self.client.post(reverse('informe-finalizacion-enviar', args=[self.proyecto.pk]))

    def test_informe_no_se_habilita_antes_del_100(self):
        ActividadProyecto.objects.create(
            proyecto=self.proyecto, nombre='A2', orden=2, estado='pendiente')
        self.client.force_authenticate(user=self.docente)
        response = self.client.patch(reverse('informe-finalizacion', args=[self.proyecto.pk]),
                                     {'conclusiones': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_trae_los_datos_de_planificacion_y_lo_pendiente(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('informe-finalizacion', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fin = response.data['finalizacion']
        self.assertTrue(fin['habilitado'])
        self.assertTrue(fin['editable'])
        self.assertIn('conclusiones', fin['campos_pendientes'])
        self.assertIn('metas_valor_alcanzado', fin['campos_pendientes'])
        self.assertEqual(response.data['presupuesto_detalle'][0]['id'], self.partida.pk)

    def test_docente_completa_y_envia(self):
        response = self._enviar()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['finalizacion']['estado'], 'enviado')
        self.meta.refresh_from_db()
        self.partida.refresh_from_db()
        self.assertEqual(self.meta.valor_alcanzado, Decimal('45'))
        self.assertEqual(self.partida.monto_ejecutado, Decimal('48.50'))
        self.assertTrue(Notificacion.objects.filter(
            destinatario=self.depto, tipo='informe_finalizacion_enviado').exists())
        self.assertFalse(Notificacion.objects.filter(destinatario=self.depto_ajeno).exists())

    def test_no_se_envia_con_campos_pendientes(self):
        self.client.force_authenticate(user=self.docente)
        self.client.patch(reverse('informe-finalizacion', args=[self.proyecto.pk]),
                          {'conclusiones': 'Solo esto.'}, format='json')
        response = self.client.post(reverse('informe-finalizacion-enviar', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('campos_pendientes', response.data['errors'])

    def test_enviar_guarda_y_envia_en_un_solo_paso(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(
            reverse('informe-finalizacion-enviar', args=[self.proyecto.pk]),
            self._informe_completo(), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['finalizacion']['estado'], 'enviado')
        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.conclusiones, 'Se cumplió el objetivo.')

    def test_enviar_en_un_paso_no_deja_nada_si_hay_error(self):
        self.client.force_authenticate(user=self.docente)
        datos = self._informe_completo()
        datos['partidas'] = [{'id': self.partida.pk, 'monto_ejecutado': -5}]
        response = self.client.post(
            reverse('informe-finalizacion-enviar', args=[self.proyecto.pk]), datos, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.proyecto.refresh_from_db()
        self.assertFalse(self.proyecto.conclusiones)
        self.assertFalse(InformeFinalizacion.objects.filter(
            proyecto=self.proyecto, estado='enviado').exists())

    def test_informe_se_habilita_aunque_el_avance_guardado_este_desactualizado(self):
        self.proyecto.estado = 'aprobado'
        self.proyecto.porcentaje_ejecucion = Decimal('0.00')
        self.proyecto.save(update_fields=['estado', 'porcentaje_ejecucion'])
        self.client.force_authenticate(user=self.docente)
        url = reverse('informe-finalizacion', args=[self.proyecto.pk])
        self.assertTrue(self.client.get(url).data['finalizacion']['habilitado'])
        response = self.client.patch(url, {'conclusiones': 'ok'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.estado, 'en_ejecucion')
        self.assertEqual(self.proyecto.porcentaje_ejecucion, Decimal('100.00'))

    def test_otro_docente_no_edita_el_informe(self):
        self.client.force_authenticate(user=self.otro_docente)
        response = self.client.patch(reverse('informe-finalizacion', args=[self.proyecto.pk]),
                                     {'conclusiones': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_valores_negativos_en_el_informe(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.patch(reverse('informe-finalizacion', args=[self.proyecto.pk]), {
            'metas': [{'id': self.meta.pk, 'valor_alcanzado': -1}]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_departamento_observa_y_el_docente_corrige(self):
        self._enviar()
        self.client.force_authenticate(user=self.depto)
        url = reverse('informe-finalizacion-observar', args=[self.proyecto.pk])
        self.assertEqual(self.client.post(url, {'comentario': 'Corto'}, format='json').status_code,
                         status.HTTP_400_BAD_REQUEST)
        response = self.client.post(url, {'comentario': 'Faltan las evidencias del taller final.'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['finalizacion']['estado'], 'observado')
        self.assertEqual(response.data['observaciones'][0]['decision'], 'observado')
        self.assertTrue(Notificacion.objects.filter(
            destinatario=self.docente, tipo='informe_finalizacion_observado').exists())

        self.assertEqual(self._enviar().status_code, status.HTTP_200_OK)

    def test_jefatura_no_finaliza_proyectos(self):
        self._enviar()
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.post(reverse('proyecto-finalizar', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_finaliza_sin_informe_enviado(self):
        self.client.force_authenticate(user=self.depto)
        response = self.client.post(reverse('proyecto-finalizar', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_departamento_aprueba_y_el_proyecto_se_finaliza(self):
        self._enviar()
        self.client.force_authenticate(user=self.depto)
        response = self.client.post(reverse('proyecto-finalizar', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.proyecto.refresh_from_db()
        self.assertEqual(self.proyecto.estado, 'finalizado')
        self.assertIsNotNone(self.proyecto.fecha_cierre)
        self.assertEqual(self.proyecto.informe_finalizacion.estado, 'aprobado')
        self.assertTrue(self.proyecto.revisiones.filter(etapa='finalizacion', decision='aprobado').exists())
        self.assertTrue(HistorialEstadoProyecto.objects.filter(
            proyecto=self.proyecto, estado_nuevo='finalizado').exists())

        response = self.client.get(reverse('repositorio-informe-final', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['informe_final']['conclusiones'], 'Se cumplió el objetivo.')

    def test_bandeja_lista_solo_informes_enviados_del_departamento(self):
        url = reverse('proyecto-para-finalizar')
        self.client.force_authenticate(user=self.depto)
        self.assertEqual(self.client.get(url).data['count'], 0)
        self._enviar()

        self.client.force_authenticate(user=self.depto)
        ids = [p['id'] for p in self.client.get(url).data['results']]
        self.assertEqual(ids, [self.proyecto.pk])
        self.client.force_authenticate(user=self.depto_ajeno)
        self.assertEqual(self.client.get(url).data['count'], 0)
        for usuario in (self.docente, self.jefatura):
            self.client.force_authenticate(user=usuario)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

    def test_pdf_del_informe(self):
        self.client.force_authenticate(user=self.depto)
        response = self.client.get(reverse('informe-finalizacion-pdf', args=[self.proyecto.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')

    def test_constancia_la_aprueba_el_departamento_y_luego_la_descarga_el_docente(self):
        self._enviar()
        self.client.force_authenticate(user=self.depto)
        self.client.post(reverse('proyecto-finalizar', args=[self.proyecto.pk]))
        pdf_url = reverse('constancia-pdf', args=[self.proyecto.pk])
        aprobar_url = reverse('constancia-aprobar', args=[self.proyecto.pk])

        self.assertEqual(self.client.get(pdf_url).status_code, status.HTTP_200_OK)
        listado = self.client.get(reverse('constancia-list')).data
        self.assertFalse(listado[0]['constancia_aprobada'])

        self.client.force_authenticate(user=self.docente)
        self.assertEqual(self.client.get(pdf_url).status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.jefatura)
        self.assertEqual(self.client.post(aprobar_url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.depto)
        self.assertEqual(self.client.post(aprobar_url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(aprobar_url).status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.docente)
        response = self.client.get(pdf_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(Notificacion.objects.filter(
            destinatario=self.docente, tipo='constancia_disponible').exists())


class NotificarListoParaCerrarAPITests(_BaseFlujoTestCase):
    """Al llegar al 100% se avisa al docente que ya puede completar su informe."""

    def setUp(self):
        super().setUp()
        self.proyecto = self.crear_proyecto('en_ejecucion', porcentaje_ejecucion=Decimal('50.00'))
        ActividadProyecto.objects.create(proyecto=self.proyecto, nombre='A1', orden=1, estado='completada')
        self.act2 = ActividadProyecto.objects.create(proyecto=self.proyecto, nombre='A2', orden=2)

    def test_avisa_al_docente_una_sola_vez(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('actividad-evidencia', args=[self.proyecto.pk, self.act2.pk])
        for _ in range(2):
            self.client.post(url, {'enlace_drive': 'https://drive.google.com/x'}, format='json')
        avisos = Notificacion.objects.filter(proyecto=self.proyecto, tipo='listo_para_cerrar')
        self.assertEqual(avisos.count(), 1)
        self.assertEqual(avisos.get().destinatario, self.docente)


# ──────────────────────────────────────────────────────────────────────────────
# HU-06: informes consolidados y acceso de autoridades
# ──────────────────────────────────────────────────────────────────────────────

class InformesConsolidadosAPITests(APITestCase):
    """Pruebas del modulo de informes consolidados (Sprint 6, T-104 a T-108).

    El fixture arma un escenario minimo pero representativo: dos facultades,
    proyectos en los cuatro estados que importan para el caso (borrador, en
    revision, aprobado y finalizado) y, sobre el proyecto finalizado, el
    presupuesto, las metas y los avances que el informe debe consolidar.
    """

    _cred = None

    def setUp(self):
        self.rol_admin = Rol.objects.get(nombre='Administrador')
        self.rol_docente = Rol.objects.get(nombre='Docente')
        self.rol_jefatura = Rol.objects.get(nombre='Jefatura RSU')
        self.rol_departamento = Rol.objects.get(nombre='Departamento')

        self.eje = EjeRSU.objects.get(nombre='Gestión')
        self.eje_docencia = EjeRSU.objects.filter(nombre='Docencia').first() or self.eje
        self.ods1 = ODS.objects.get(numero=1)
        self.ods4 = ODS.objects.get(numero=4)

        self.facultad = Facultad.objects.get(codigo='FIPS')
        self.escuela = EscuelaProfesional.objects.get(codigo='EPIS')
        self.departamento = DepartamentoAcademico.objects.get(codigo='DAISI')

        # Segunda facultad, ya sembrada por la migracion 0004, para comprobar
        # que la Jefatura de FIPS no ve mas alla de la suya.
        self.otra_facultad = Facultad.objects.get(codigo='FCNF')
        self.otra_escuela = EscuelaProfesional.objects.get(codigo='EPMAT')
        self.otro_departamento = DepartamentoAcademico.objects.get(codigo='DAMAT')

        self.periodo = PeriodoAcademico.objects.create(
            nombre='2026-I', anio=2026, semestre='I',
            fecha_inicio='2026-03-01', fecha_fin='2026-07-31', activo=True)

        self.admin = Usuario.objects.create_user(
            correo_institucional='admin.hu06@unsa.edu.pe', password=self._cred,
            nombres='Admin', rol=self.rol_admin)
        self.jefatura = Usuario.objects.create_user(
            correo_institucional='jefatura.hu06@unsa.edu.pe', password=self._cred,
            nombres='Jefatura', rol=self.rol_jefatura, facultad=self.facultad)
        self.departamento_user = Usuario.objects.create_user(
            correo_institucional='depto.hu06@unsa.edu.pe', password=self._cred,
            nombres='Departamento', rol=self.rol_departamento,
            facultad=self.facultad, departamento=self.departamento)
        self.docente = Usuario.objects.create_user(
            correo_institucional='docente.hu06@unsa.edu.pe', password=self._cred,
            nombres='Docente', apellidos='Responsable', rol=self.rol_docente,
            facultad=self.facultad)

        self.aprobado = self._crear_proyecto('Proyecto aprobado', 'aprobado')
        self.finalizado = self._crear_proyecto('Proyecto finalizado', 'finalizado')
        self.borrador = self._crear_proyecto('Proyecto borrador', 'borrador')
        self.en_revision = self._crear_proyecto('Proyecto en revision', 'en_revision')

        self.aprobado.ods.add(self.ods1)
        self.finalizado.ods.add(self.ods4)

        # Proyecto finalizado en la otra facultad, fuera del alcance de la
        # Jefatura de FIPS.
        self.ajeno = ProyectoRSU.objects.create(
            titulo='Proyecto de otra facultad', estado='finalizado',
            periodo=self.periodo,
            facultad=self.otra_facultad, escuela=self.otra_escuela,
            departamento=self.otro_departamento,
            semestre_academico='2026-I', docente_responsable=self.docente,
            porcentaje_ejecucion=Decimal('100.00'))
        self.ajeno.ejes_rsu.set([self.eje])

        self._cargar_datos_de_ejecucion(self.finalizado)

    def _crear_proyecto(self, titulo, estado):
        proyecto = ProyectoRSU.objects.create(
            titulo=titulo, estado=estado,
            periodo=self.periodo,
            facultad=self.facultad, escuela=self.escuela,
            departamento=self.departamento,
            semestre_academico='2026-I', docente_responsable=self.docente,
            nro_docentes=2, nro_estudiantes=30,
            monto_financiamiento=Decimal('1000.00'),
            porcentaje_ejecucion=Decimal('50.00'))
        proyecto.ejes_rsu.set([self.eje])
        return proyecto

    def _cargar_datos_de_ejecucion(self, proyecto):
        """Presupuesto, metas y avances sobre los que se calculan los totales."""
        FuenteFinanciamiento.objects.create(
            proyecto=proyecto, fuente='autofinanciado', monto=Decimal('800.00'))

        # 2 x 100 = 200 programado, 150 ejecutado.
        PartidaPresupuestaria.objects.create(
            proyecto=proyecto, descripcion='Refrigerios', categoria='refrigerio',
            cantidad=2, costo_unitario=Decimal('100.00'),
            monto_ejecutado=Decimal('150.00'))
        # 3 x 50 = 150 programado, 50 ejecutado.
        PartidaPresupuestaria.objects.create(
            proyecto=proyecto, descripcion='Transporte', categoria='transporte',
            cantidad=3, costo_unitario=Decimal('50.00'),
            monto_ejecutado=Decimal('50.00'))

        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto, meta_descripcion='Capacitar docentes',
            indicador_nombre='Docentes capacitados',
            valor_meta=Decimal('10.00'), valor_alcanzado=Decimal('12.00'))
        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto, meta_descripcion='Talleres dictados',
            indicador_nombre='Talleres', valor_meta=Decimal('5.00'),
            valor_alcanzado=Decimal('3.00'))

        actividad = ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Taller inicial', estado='completada')
        ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Taller de cierre', estado='pendiente')

        avance = AvanceActividad.objects.create(
            proyecto=proyecto, actividad=actividad,
            descripcion='Taller dictado con 30 asistentes.',
            estado_actividad='completada', autor=self.docente)
        EvidenciaAvance.objects.create(
            avance=avance, tipo='enlace',
            enlace_drive='https://drive.google.com/file/d/abc/view',
            nombre='Lista de asistencia')

    # ── CA-01: alcance del informe ────────────────────────────────────────────

    def test_solo_incluye_proyectos_aprobados_y_finalizados(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        titulos = {p['titulo'] for p in response.data['proyectos']}
        self.assertIn('Proyecto aprobado', titulos)
        self.assertIn('Proyecto finalizado', titulos)
        self.assertNotIn('Proyecto borrador', titulos)
        self.assertNotIn('Proyecto en revision', titulos)

        self.assertEqual(response.data['resumen']['total_proyectos'], 3)
        self.assertEqual(response.data['resumen']['aprobados'], 1)
        self.assertEqual(response.data['resumen']['finalizados'], 2)

    def test_el_filtro_de_estado_no_puede_ampliar_el_alcance(self):
        """Pedir estado=borrador no debe sacar al informe de CA-01."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'), {'estado': 'borrador'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['filtros_aplicados'], {})
        self.assertEqual(response.data['resumen']['total_proyectos'], 3)

    def test_el_filtro_de_estado_si_puede_estrechar(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'), {'estado': 'aprobado'})
        self.assertEqual(response.data['resumen']['total_proyectos'], 1)
        self.assertEqual(response.data['filtros_aplicados']['estado'], 'aprobado')

    # ── Alcance por rol ───────────────────────────────────────────────────────

    def test_jefatura_solo_ve_los_proyectos_de_su_facultad(self):
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(reverse('informe-consolidado'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titulos = {p['titulo'] for p in response.data['proyectos']}
        self.assertNotIn('Proyecto de otra facultad', titulos)
        self.assertEqual(response.data['resumen']['total_proyectos'], 2)

    def test_departamento_solo_ve_los_de_su_departamento(self):
        self.client.force_authenticate(user=self.departamento_user)
        response = self.client.get(reverse('informe-consolidado'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumen']['total_proyectos'], 2)

    def test_docente_no_accede_al_informe_consolidado(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('informe-consolidado'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_usuario_anonimo_no_accede(self):
        response = self.client.get(reverse('informe-consolidado'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── CA-02: solo lectura ───────────────────────────────────────────────────

    def test_todas_las_respuestas_marcan_solo_lectura(self):
        self.client.force_authenticate(user=self.jefatura)
        for nombre in ('informe-consolidado', 'informe-consolidado-filtros',
                       'informe-consolidado-proyectos'):
            with self.subTest(ruta=nombre):
                response = self.client.get(reverse(nombre))
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertTrue(response.data['solo_lectura'])

    def test_los_metodos_de_escritura_estan_bloqueados(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('informe-consolidado')
        for metodo in ('post', 'put', 'patch', 'delete'):
            with self.subTest(metodo=metodo):
                response = getattr(self.client, metodo)(url, {}, format='json')
                self.assertEqual(
                    response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_la_ficha_de_detalle_tambien_es_de_solo_lectura(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('informe-consolidado-proyecto-detail',
                      kwargs={'pk': self.finalizado.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['solo_lectura'])

        response = self.client.patch(url, {'titulo': 'Hackeado'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.finalizado.refresh_from_db()
        self.assertEqual(self.finalizado.titulo, 'Proyecto finalizado')

    # ── CA-03: filtros ────────────────────────────────────────────────────────

    def test_filtro_por_facultad(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'),
                                   {'facultad': self.otra_facultad.pk})
        self.assertEqual(response.data['resumen']['total_proyectos'], 1)
        self.assertEqual(response.data['proyectos'][0]['titulo'],
                         'Proyecto de otra facultad')

    def test_filtro_por_ods(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'),
                                   {'ods': self.ods4.pk})
        self.assertEqual(response.data['resumen']['total_proyectos'], 1)
        self.assertEqual(response.data['proyectos'][0]['titulo'], 'Proyecto finalizado')

    def test_filtro_por_periodo_y_eje_rsu(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'), {
            'periodo': self.periodo.pk,
            'eje_rsu': self.eje.pk,
        })
        self.assertEqual(response.data['filtros_aplicados'],
                         {'periodo': self.periodo.pk, 'eje_rsu': self.eje.pk})
        self.assertEqual(response.data['resumen']['total_proyectos'], 3)

    def test_un_filtro_invalido_se_ignora_en_lugar_de_fallar(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'),
                                   {'facultad': '', 'periodo': 'abc'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['filtros_aplicados'], {})

    def test_los_catalogos_de_filtros_solo_traen_valores_con_proyectos(self):
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(reverse('informe-consolidado-filtros'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nombres = [f['nombre'] for f in response.data['facultades']]
        self.assertIn(self.facultad.nombre, nombres)
        self.assertNotIn(self.otra_facultad.nombre, nombres)

    # ── T-106: consolidacion de los datos ─────────────────────────────────────

    def test_consolida_presupuesto_metas_y_avances_del_proyecto(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('informe-consolidado-proyecto-detail',
                      kwargs={'pk': self.finalizado.pk})
        ficha = self.client.get(url).data

        presupuesto = ficha['presupuesto']
        self.assertEqual(presupuesto['monto_presupuestado'], 350.0)
        self.assertEqual(presupuesto['monto_ejecutado'], 200.0)
        self.assertEqual(presupuesto['saldo_por_ejecutar'], 150.0)
        self.assertEqual(presupuesto['monto_financiado'], 800.0)
        self.assertAlmostEqual(
            presupuesto['porcentaje_ejecucion_presupuestal'], 57.14, places=2)

        metas = ficha['metas']
        self.assertEqual(metas['total'], 2)
        self.assertEqual(metas['cumplidas'], 1)
        self.assertEqual(metas['porcentaje_cumplimiento'], 50.0)

        avance = ficha['avance']
        self.assertEqual(avance['actividades_total'], 2)
        self.assertEqual(avance['actividades_completadas'], 1)
        self.assertEqual(avance['avances_registrados'], 1)
        self.assertEqual(avance['evidencias_vigentes'], 1)

        self.assertEqual(len(ficha['detalle_presupuesto']), 2)
        self.assertEqual(len(ficha['detalle_metas']), 2)
        self.assertEqual(len(ficha['detalle_avances']), 1)

    def test_la_evidencia_borrada_no_se_cuenta(self):
        EvidenciaAvance.objects.filter(avance__proyecto=self.finalizado).update(
            eliminada=True)
        self.client.force_authenticate(user=self.admin)
        url = reverse('informe-consolidado-proyecto-detail',
                      kwargs={'pk': self.finalizado.pk})
        ficha = self.client.get(url).data
        self.assertEqual(ficha['avance']['evidencias_vigentes'], 0)

    def test_totales_institucionales_y_distribuciones(self):
        self.client.force_authenticate(user=self.admin)
        informe = self.client.get(reverse('informe-consolidado')).data

        self.assertEqual(informe['presupuesto']['monto_presupuestado'], 350.0)
        self.assertEqual(informe['presupuesto']['monto_ejecutado'], 200.0)
        self.assertEqual(informe['metas']['total'], 2)
        self.assertEqual(informe['resumen']['docentes_responsables'], 1)
        self.assertEqual(informe['resumen']['actividades_completadas'], 1)

        facultades = {d['etiqueta']: d['total']
                      for d in informe['distribuciones']['por_facultad']}
        self.assertEqual(facultades[self.facultad.nombre], 2)
        self.assertEqual(facultades[self.otra_facultad.nombre], 1)

        estados = {d['etiqueta']: d['total']
                   for d in informe['distribuciones']['por_estado']}
        self.assertEqual(estados['aprobado'], 1)
        self.assertEqual(estados['finalizado'], 2)

    def test_incluir_proyectos_false_devuelve_solo_agregados(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado'),
                                   {'incluir_proyectos': 'false'})
        self.assertNotIn('proyectos', response.data)
        self.assertEqual(response.data['resumen']['total_proyectos'], 3)

    def test_detalle_de_un_proyecto_fuera_de_alcance_responde_404(self):
        self.client.force_authenticate(user=self.jefatura)
        url = reverse('informe-consolidado-proyecto-detail',
                      kwargs={'pk': self.ajeno.pk})
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    def test_detalle_de_un_proyecto_en_borrador_responde_404(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('informe-consolidado-proyecto-detail',
                      kwargs={'pk': self.borrador.pk})
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

    # ── T-105: listado paginado ───────────────────────────────────────────────

    def test_listado_paginado_de_proyectos(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado-proyectos'),
                                   {'page_size': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 2)
        self.assertTrue(response.data['solo_lectura'])
        self.assertEqual(response.data['resumen']['total_proyectos'], 3)

    # ── T-107 y T-108: exportacion ────────────────────────────────────────────

    def test_exportacion_pdf(self):
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(reverse('informe-consolidado-export-pdf'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment;', response['Content-Disposition'])
        contenido = b''.join(response.streaming_content)
        self.assertTrue(contenido.startswith(b'%PDF'))
        self.assertGreater(len(contenido), 1000)

    def test_exportacion_excel(self):
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(reverse('informe-consolidado-export-excel'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('spreadsheetml', response['Content-Type'])
        self.assertIn('attachment;', response['Content-Disposition'])
        contenido = b''.join(response.streaming_content)
        # Un .xlsx es un ZIP: debe empezar con la firma PK.
        self.assertTrue(contenido.startswith(b'PK'))

        libro = openpyxl.load_workbook(BytesIO(contenido))
        self.assertEqual(libro.sheetnames, ['Resumen', 'Proyectos', 'Distribuciones'])
        # Cabecera mas una fila por proyecto dentro del alcance de la Jefatura.
        self.assertEqual(libro['Proyectos'].max_row, 3)

    def test_la_exportacion_respeta_los_filtros(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('informe-consolidado-export-excel'),
                                   {'facultad': self.otra_facultad.pk})
        contenido = b''.join(response.streaming_content)
        libro = openpyxl.load_workbook(BytesIO(contenido))
        self.assertEqual(libro['Proyectos'].max_row, 2)
        self.assertEqual(libro['Proyectos'].cell(row=2, column=2).value,
                         'Proyecto de otra facultad')

    def test_docente_no_puede_exportar(self):
        self.client.force_authenticate(user=self.docente)
        for nombre in ('informe-consolidado-export-pdf',
                       'informe-consolidado-export-excel'):
            with self.subTest(ruta=nombre):
                response = self.client.get(reverse(nombre))
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RepositorioHistoricoAPITests(APITestCase):
    """Pruebas del Repositorio Historico (Sprint 7, HU-07, T-120 a T-124).

    Escenario: tres proyectos finalizados que se reparten entre dos
    facultades, dos semestres, dos ejes RSU y dos ODS, para poder comprobar
    cada filtro por separado y combinado; mas un proyecto aprobado y otro en
    ejecucion que nunca deben aparecer en el repositorio.
    """

    _cred = None

    def setUp(self):
        self.docente = Usuario.objects.create_user(
            correo_institucional='docente.hu07@unsa.edu.pe', password=self._cred,
            nombres='Ana', apellidos='Quispe',
            rol=Rol.objects.get(nombre='Docente'))
        self.jefatura = Usuario.objects.create_user(
            correo_institucional='jefatura.hu07@unsa.edu.pe', password=self._cred,
            nombres='Jefatura', rol=Rol.objects.get(nombre='Jefatura RSU'),
            facultad=Facultad.objects.get(codigo='FCNF'))
        self.sin_rol = Usuario.objects.create_user(
            correo_institucional='sinrol.hu07@unsa.edu.pe', password=self._cred,
            nombres='Sin rol')

        self.fips = Facultad.objects.get(codigo='FIPS')
        self.epis = EscuelaProfesional.objects.get(codigo='EPIS')
        self.daisi = DepartamentoAcademico.objects.get(codigo='DAISI')
        self.fcnf = Facultad.objects.get(codigo='FCNF')
        self.epmat = EscuelaProfesional.objects.get(codigo='EPMAT')
        self.damat = DepartamentoAcademico.objects.get(codigo='DAMAT')

        self.gestion = EjeRSU.objects.get(nombre='Gestión')
        self.extension = EjeRSU.objects.get(nombre='Extensión')
        self.ods4 = ODS.objects.get(numero=4)
        self.ods11 = ODS.objects.get(numero=11)

        self.periodo_a = PeriodoAcademico.objects.create(
            nombre='2025-A', anio=2025, semestre='I',
            fecha_inicio='2025-03-01', fecha_fin='2025-07-31')
        self.periodo_b = PeriodoAcademico.objects.create(
            nombre='2025-B', anio=2025, semestre='II',
            fecha_inicio='2025-08-01', fecha_fin='2025-12-20')

        self.reciclaje = self._crear(
            'Reciclaje en colegios', self.fips, self.epis, self.daisi,
            self.periodo_a, [self.gestion], [self.ods4, self.ods11],
            lecciones_aprendidas='Coordinar con los directores antes de empezar.',
            conclusiones='Se capacito a 120 escolares.',
            recomendaciones='Ampliar a secundaria.',
            medio_difusion='Facebook de la escuela')
        self.alfabetizacion = self._crear(
            'Alfabetizacion digital', self.fips, self.epis, self.daisi,
            self.periodo_b, [self.extension], [self.ods4])
        self.matematica = self._crear(
            'Matematica para todos', self.fcnf, self.epmat, self.damat,
            self.periodo_b, [self.extension], [self.ods11],
            lecciones_aprendidas='Los talleres cortos funcionan mejor.')

        self.aprobado = self._crear(
            'Proyecto aprobado', self.fips, self.epis, self.daisi,
            self.periodo_a, [self.gestion], [self.ods4], estado='aprobado')
        self.en_ejecucion = self._crear(
            'Proyecto en ejecucion', self.fips, self.epis, self.daisi,
            self.periodo_a, [self.gestion], [self.ods4], estado='en_ejecucion')

        self._cargar_detalle(self.reciclaje)

    def _crear(self, titulo, facultad, escuela, departamento, periodo, ejes, ods,
               estado='finalizado', **extra):
        proyecto = ProyectoRSU.objects.create(
            titulo=titulo, estado=estado, facultad=facultad, escuela=escuela,
            departamento=departamento, periodo=periodo,
            semestre_academico=periodo.nombre, docente_responsable=self.docente,
            porcentaje_ejecucion=Decimal('100.00'),
            fecha_cierre=timezone.now() if estado == 'finalizado' else None,
            **extra)
        proyecto.ejes_rsu.set(ejes)
        proyecto.ods.set(ods)
        return proyecto

    def _cargar_detalle(self, proyecto):
        proyecto.fund_por_que_grupo = 'Colegios sin programa de reciclaje.'
        proyecto.resultado_en_beneficiarios = 'Escolares separan residuos.'
        proyecto.save()
        actividad = ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Taller de segregacion', estado='completada')
        CronogramaAccion.objects.create(
            proyecto=proyecto, descripcion='Talleres en aula', estado_avance='finalizado')
        PartidaPresupuestaria.objects.create(
            proyecto=proyecto, descripcion='Bolsas', categoria='otros',
            cantidad=10, costo_unitario=Decimal('5.00'),
            monto_ejecutado=Decimal('40.00'))
        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto, meta_descripcion='Capacitar escolares',
            indicador_nombre='Escolares capacitados',
            valor_meta=Decimal('100.00'), valor_alcanzado=Decimal('120.00'))
        AvanceActividad.objects.create(
            proyecto=proyecto, actividad=actividad, descripcion='Taller dictado.',
            estado_actividad='completada', autor=self.docente)

    def _titulos(self, response):
        return {p['titulo'] for p in response.data['results']}

    # ── Alcance y acceso ──────────────────────────────────────────────────────

    def test_solo_lista_proyectos_finalizados(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-proyectos'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._titulos(response), {
            'Reciclaje en colegios', 'Alfabetizacion digital', 'Matematica para todos'})
        self.assertTrue(response.data['solo_lectura'])

    def test_el_repositorio_no_se_recorta_por_facultad(self):
        """La Jefatura de FCNF tambien ve los proyectos finalizados de FIPS."""
        self.client.force_authenticate(user=self.jefatura)
        response = self.client.get(reverse('repositorio-proyectos'))
        self.assertEqual(response.data['count'], 3)

    def test_requiere_autenticacion_y_rol(self):
        response = self.client.get(reverse('repositorio-proyectos'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(user=self.sin_rol)
        response = self.client.get(reverse('repositorio-proyectos'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_los_metodos_de_escritura_estan_bloqueados(self):
        self.client.force_authenticate(user=self.docente)
        url = reverse('repositorio-ficha-tecnica', args=[self.reciclaje.pk])
        for metodo in ('post', 'put', 'patch', 'delete'):
            with self.subTest(metodo=metodo):
                response = getattr(self.client, metodo)(url, {}, format='json')
                self.assertEqual(
                    response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # ── T-120 / T-122: filtros ────────────────────────────────────────────────

    def test_filtros_individuales(self):
        self.client.force_authenticate(user=self.docente)
        casos = [
            ({'semestre': '2025-a'}, {'Reciclaje en colegios'}),
            ({'facultad': self.fcnf.pk}, {'Matematica para todos'}),
            ({'escuela': self.epis.pk}, {'Reciclaje en colegios', 'Alfabetizacion digital'}),
            ({'eje_rsu': self.gestion.pk}, {'Reciclaje en colegios'}),
            ({'ods': self.ods11.pk}, {'Reciclaje en colegios', 'Matematica para todos'}),
            ({'periodo': self.periodo_b.pk},
             {'Alfabetizacion digital', 'Matematica para todos'}),
        ]
        for params, esperados in casos:
            with self.subTest(params=params):
                response = self.client.get(reverse('repositorio-proyectos'), params)
                self.assertEqual(self._titulos(response), esperados)

    def test_filtros_combinados_se_intersectan(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-proyectos'), {
            'facultad': self.fips.pk, 'semestre': '2025-B', 'ods': self.ods4.pk})
        self.assertEqual(self._titulos(response), {'Alfabetizacion digital'})
        self.assertEqual(response.data['filtros_aplicados'], {
            'facultad': [self.fips.pk], 'ods': [self.ods4.pk], 'semestre': ['2025-B']})

    def test_varios_valores_en_un_filtro_se_suman_sin_duplicar(self):
        """Reciclaje tiene ODS 4 y 11: debe salir una sola vez."""
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(
            reverse('repositorio-proyectos'), {'ods': f'{self.ods4.pk},{self.ods11.pk}'})
        self.assertEqual(response.data['count'], 3)
        ids = [p['id'] for p in response.data['results']]
        self.assertEqual(len(ids), len(set(ids)))

    def test_busqueda_libre_y_valores_invalidos(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-proyectos'),
                                   {'q': 'talleres cortos', 'facultad': 'abc'})
        self.assertEqual(self._titulos(response), {'Matematica para todos'})
        self.assertEqual(response.data['filtros_aplicados'], {'q': 'talleres cortos'})

    def test_ordenamiento(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-proyectos'), {'ordering': 'titulo'})
        self.assertEqual(
            [p['titulo'] for p in response.data['results']],
            ['Alfabetizacion digital', 'Matematica para todos', 'Reciclaje en colegios'])

    def test_catalogo_de_filtros_solo_trae_valores_con_proyectos_finalizados(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-filtros'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['semestres'], ['2025-B', '2025-A'])
        self.assertEqual({f['id'] for f in response.data['facultades']},
                         {self.fips.pk, self.fcnf.pk})
        self.assertEqual({e['id'] for e in response.data['ejes_rsu']},
                         {self.gestion.pk, self.extension.pk})
        self.assertEqual([o['numero'] for o in response.data['ods']], [4, 11])

    # ── T-123: ficha tecnica ──────────────────────────────────────────────────

    def test_ficha_tecnica_trae_las_secciones_del_anexo_4(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(
            reverse('repositorio-ficha-tecnica', args=[self.reciclaje.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['titulo'], 'Reciclaje en colegios')
        self.assertEqual(data['facultad']['id'], self.fips.pk)
        self.assertEqual(data['fundamentacion']['por_que_grupo'],
                         'Colegios sin programa de reciclaje.')
        self.assertEqual(data['actividades'][0]['nombre'], 'Taller de segregacion')
        self.assertEqual(len(data['cronograma']), 1)
        self.assertEqual(data['financiamiento']['partidas'][0]['monto_presupuestado'], 50.0)
        self.assertEqual(data['metas_indicadores'][0]['valor_alcanzado'], 120.0)
        self.assertNotIn('historial_estados', data)
        self.assertTrue(data['solo_lectura'])

    def test_ficha_de_proyecto_no_finalizado_responde_404(self):
        self.client.force_authenticate(user=self.docente)
        for proyecto in (self.aprobado, self.en_ejecucion):
            with self.subTest(estado=proyecto.estado):
                for nombre in ('repositorio-ficha-tecnica', 'repositorio-informe-final'):
                    response = self.client.get(reverse(nombre, args=[proyecto.pk]))
                    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── T-124: informe final y lecciones aprendidas ───────────────────────────

    def test_informe_final_con_resultados_alcanzados(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(
            reverse('repositorio-informe-final', args=[self.reciclaje.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        informe = response.data['informe_final']
        self.assertEqual(informe['conclusiones'], 'Se capacito a 120 escolares.')
        self.assertTrue(informe['completo'])
        self.assertEqual(informe['campos_pendientes'], [])

        alcanzados = response.data['resultados_alcanzados']
        self.assertEqual(alcanzados['metas']['cumplidas'], 1)
        self.assertEqual(alcanzados['presupuesto']['monto_ejecutado'], 40.0)
        self.assertEqual(alcanzados['avance']['actividades_completadas'], 1)
        self.assertEqual(response.data['resultados_esperados']['en_beneficiarios'],
                         'Escolares separan residuos.')

    def test_informe_final_incompleto_indica_campos_pendientes(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(
            reverse('repositorio-informe-final', args=[self.alfabetizacion.pk]))
        informe = response.data['informe_final']
        self.assertFalse(informe['completo'])
        self.assertEqual(informe['campos_pendientes'],
                         ['conclusiones', 'recomendaciones', 'lecciones_aprendidas'])

    def test_lecciones_aprendidas_solo_de_proyectos_que_las_registraron(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.get(reverse('repositorio-lecciones-aprendidas'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._titulos(response),
                         {'Reciclaje en colegios', 'Matematica para todos'})

        response = self.client.get(reverse('repositorio-lecciones-aprendidas'),
                                   {'eje_rsu': self.extension.pk})
        self.assertEqual(self._titulos(response), {'Matematica para todos'})
        self.assertEqual(response.data['results'][0]['lecciones_aprendidas'],
                         'Los talleres cortos funcionan mejor.')


class BorradorMinimoAPITests(BaseProyectoTestCase):
    """El borrador se guarda incompleto; la obligatoriedad recae en el envio.

    Pedido del cliente (reunion 2026-09-16): el docente debe poder guardar un
    borrador apenas llena datos generales y titulo, sin recorrer las 9
    secciones del ANEXO 4.
    """

    def test_crear_borrador_solo_con_facultad_y_titulo(self):
        self.client.force_authenticate(user=self.docente)
        response = self.client.post(reverse('proyecto-list'), {
            'facultad': self.facultad.pk,
            'titulo': 'Borrador recien empezado',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estado'], 'borrador')
        self.assertEqual(response.data['semestre_academico'], '')
        self.assertIsNone(response.data['escuela'])

    def test_enviar_a_revision_sigue_exigiendo_todo(self):
        self.client.force_authenticate(user=self.docente)
        proyecto = ProyectoRSU.objects.create(
            facultad=self.facultad,
            titulo='Borrador incompleto',
            docente_responsable=self.docente,
            estado='borrador',
        )

        response = self.client.post(
            reverse('proyecto-revisar', args=[proyecto.pk]), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errores = response.data['errors']
        for campo in ('periodo', 'escuela', 'departamento',
                      'ejes_rsu', 'ods', 'actividades'):
            self.assertIn(campo, errores)
        proyecto.refresh_from_db()
        self.assertEqual(proyecto.estado, 'borrador')
