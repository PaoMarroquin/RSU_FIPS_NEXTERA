"""
Comando de carga de proyectos historicos finalizados (HU-07).

El Repositorio Historico solo muestra proyectos en estado finalizado, y
ningun otro seed crea proyectos en ese estado: sin esto las pantallas del
repositorio salen vacias. Genera proyectos cerrados en dos facultades, dos
semestres, distintos ejes RSU y distintos ODS, con su informe final,
actividades, presupuesto, metas y avances, que es lo que necesitan los
filtros, la ficha tecnica y el informe final para mostrar algo real.

Es idempotente: se identifica cada proyecto por su codigo, asi que volver a
ejecutarlo no duplica nada.

Uso:
    python manage.py seed_rsu
    python manage.py seed_repositorio

Conecta con:
- apps/proyectos/services_repositorio.py: consulta estos datos.
- apps/planificacion/management/commands/seed_rsu.py: usuarios y catalogos.
"""
import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.planificacion.models import ODS, EjeRSU, PeriodoAcademico
from apps.proyectos.models import (
    ActividadProyecto, AvanceActividad, CronogramaAccion, EvidenciaAvance,
    FuenteFinanciamiento, MetaIndicadorProyecto, PartidaPresupuestaria,
    ProyectoAsignatura, ProyectoRSU,
)
from apps.usuarios.models import DepartamentoAcademico, EscuelaProfesional, Facultad

User = get_user_model()


class Command(BaseCommand):
    help = 'Crea proyectos RSU finalizados de ejemplo para el Repositorio Historico'

    def handle(self, *args, **options):
        self.stdout.write('Cargando proyectos historicos de ejemplo...')

        docente = (User.objects.filter(correo_institucional='docente1@unsa.edu.pe').first()
                   or User.objects.filter(rol__nombre='Docente').first())
        if docente is None:
            self.stderr.write('No hay ningun docente. Ejecute primero: python manage.py seed_rsu')
            return

        fips = Facultad.objects.get(codigo='FIPS')
        epis = EscuelaProfesional.objects.get(codigo='EPIS')
        daisi = DepartamentoAcademico.objects.get(codigo='DAISI')
        fcnf = Facultad.objects.get(codigo='FCNF')
        epmat = EscuelaProfesional.objects.filter(codigo='EPMAT').first()
        damat = DepartamentoAcademico.objects.filter(codigo='DAMAT').first()

        periodo_a = self._periodo(2025, 'I', '2025-A',
                                 datetime.date(2025, 3, 1), datetime.date(2025, 7, 31))
        periodo_b = self._periodo(2025, 'II', '2025-B',
                                  datetime.date(2025, 8, 1), datetime.date(2025, 12, 20))

        gestion = EjeRSU.objects.get(nombre='Gestión')
        formacion = EjeRSU.objects.get(nombre='Formación')
        extension = EjeRSU.objects.get(nombre='Extensión')
        ods = {o.numero: o for o in ODS.objects.filter(numero__in=[4, 11, 12, 13])}

        self._proyecto(
            codigo='HIST-FIPS-2025-0001',
            titulo='Reciclaje electronico en colegios de Cayma',
            facultad=fips, escuela=epis, departamento=daisi, periodo=periodo_a,
            docente=docente, ejes=[gestion], ods=[ods[12], ods[13]],
            lugar='I.E. 40055, distrito de Cayma, Arequipa',
            conclusiones='Se capacito a 120 escolares y se recolectaron 340 kg de residuos '
                         'electronicos, superando la meta planteada.',
            recomendaciones='Ampliar la campana a los colegios de Yanahuara y coordinar el '
                            'recojo con la municipalidad desde el inicio.',
            lecciones='Coordinar con los directores antes del inicio del semestre: los '
                      'permisos tomaron tres semanas y recortaron el tiempo de talleres.',
            difusion='Facebook institucional de la FIPS',
        )

        self._proyecto(
            codigo='HIST-FIPS-2025-0002',
            titulo='Alfabetizacion digital para adultos mayores',
            facultad=fips, escuela=epis, departamento=daisi, periodo=periodo_b,
            docente=docente, ejes=[formacion], ods=[ods[4]],
            lugar='Centro del Adulto Mayor, Cercado, Arequipa',
            conclusiones='30 adultos mayores completaron el taller de uso de smartphone '
                         'y banca digital.',
            recomendaciones='Reducir los grupos a 10 personas por tutor.',
            lecciones='Los talleres de dos horas rinden mas que los de cuatro: la atencion '
                      'cae mucho despues de la primera hora.',
            difusion='Boletin de la Escuela Profesional',
        )

        if epmat and damat:
            self._proyecto(
                codigo='HIST-FCNF-2025-0003',
                titulo='Matematica para todos: reforzamiento escolar',
                facultad=fcnf, escuela=epmat, departamento=damat, periodo=periodo_b,
                docente=docente, ejes=[extension], ods=[ods[4], ods[11]],
                lugar='I.E. Independencia Americana, Arequipa',
                conclusiones='Se atendio a 80 escolares de tercero de secundaria con '
                             'refuerzo en algebra.',
                recomendaciones='Mantener el mismo tutor por grupo durante todo el ciclo.',
                lecciones='El material impreso funciono mejor que el virtual: la mayoria '
                          'de escolares no tenia internet en casa.',
                difusion='Radio universitaria',
            )

        # Proyecto cerrado sin informe final, para mostrar como el repositorio
        # reporta los campos pendientes en vez de una pantalla vacia.
        self._proyecto(
            codigo='HIST-FIPS-2025-0004',
            titulo='Huertos urbanos en el campus',
            facultad=fips, escuela=epis, departamento=daisi, periodo=periodo_a,
            docente=docente, ejes=[gestion], ods=[ods[11]],
            lugar='Campus Ingenierias UNSA',
        )

        # Proyecto al 100% todavia sin cerrar: sirve para demostrar en vivo el
        # cierre con informe final (POST /proyectos/<id>/finalizar/) y ver como
        # entra al repositorio.
        self._proyecto(
            codigo='HIST-FIPS-2025-0005',
            titulo='Asesoria contable a emprendedores del Avelino',
            facultad=fips, escuela=epis, departamento=daisi, periodo=periodo_b,
            docente=docente, ejes=[extension], ods=[ods[4]],
            lugar='Mercado Avelino Caceres, Arequipa',
            estado='en_ejecucion',
        )

        total = ProyectoRSU.objects.filter(estado='finalizado').count()
        self.stdout.write(self.style.SUCCESS(
            f'Listo. Proyectos finalizados en la base: {total}'))

    def _periodo(self, anio, semestre, nombre, inicio, fin):
        periodo, _ = PeriodoAcademico.objects.get_or_create(
            anio=anio, semestre=semestre,
            defaults={'nombre': nombre, 'fecha_inicio': inicio, 'fecha_fin': fin},
        )
        return periodo

    def _proyecto(self, codigo, titulo, facultad, escuela, departamento, periodo,
                  docente, ejes, ods, lugar, conclusiones='', recomendaciones='',
                  lecciones='', difusion='', estado='finalizado'):
        cerrado = estado == 'finalizado'
        proyecto, creado = ProyectoRSU.objects.get_or_create(
            codigo=codigo,
            defaults=dict(
                titulo=titulo, estado=estado,
                facultad=facultad, escuela=escuela, departamento=departamento,
                periodo=periodo, semestre_academico=periodo.nombre,
                docente_responsable=docente,
                nro_docentes=2, nro_estudiantes=25,
                lugar_ejecucion=lugar,
                fecha_inicio=periodo.fecha_inicio, fecha_termino=periodo.fecha_fin,
                porcentaje_ejecucion=Decimal('100.00'),
                fecha_aprobacion=timezone.now(),
                fecha_inicio_ejecucion=timezone.now(),
                fecha_cierre=timezone.now() if cerrado else None,
                fund_por_que_grupo='Es un grupo con necesidades identificadas en el '
                                   'diagnostico participativo de la escuela.',
                fund_para_que_proyecto='Para transferir capacidades desde la formacion '
                                       'profesional hacia la comunidad.',
                diag_problemas_detectados='Falta de acceso a servicios y de capacitacion '
                                          'en el grupo beneficiario.',
                obj_logro_intervencion='Mejorar las capacidades del grupo beneficiario en '
                                       'el tema de intervencion.',
                resultado_en_beneficiarios='Beneficiarios capacitados y con material de '
                                           'consulta permanente.',
                resultado_en_curriculo='Casos reales incorporados a la asignatura.',
                monto_financiamiento=Decimal('1500.00'),
                fuente_financiamiento='autofinanciado',
                conclusiones=conclusiones or None,
                recomendaciones=recomendaciones or None,
                lecciones_aprendidas=lecciones or None,
                medio_difusion=difusion or None,
            ),
        )
        if not creado:
            self.stdout.write(f'  {codigo} ya existia, se deja como esta')
            return

        proyecto.ejes_rsu.set(ejes)
        proyecto.ods.set(ods)

        ProyectoAsignatura.objects.create(
            proyecto=proyecto, nombre_asignatura='Proyecto de Responsabilidad Social',
            codigo_asignatura='RSU101', anio_carrera=3, semestre='I')

        actividad = ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Taller de capacitacion', estado='completada',
            responsable=f'{docente.nombres} {docente.apellidos}'.strip(),
            fecha=periodo.fecha_inicio, evidencia_esperada='Lista de asistencia y fotos',
            orden=1)
        ActividadProyecto.objects.create(
            proyecto=proyecto, nombre='Jornada de cierre y evaluacion',
            estado='completada', fecha=periodo.fecha_fin,
            evidencia_esperada='Informe de cierre', orden=2)

        CronogramaAccion.objects.create(
            proyecto=proyecto, descripcion='Coordinacion con la institucion beneficiaria',
            fecha_inicio=periodo.fecha_inicio, fecha_fin=periodo.fecha_fin,
            estado_avance='finalizado', orden=1)

        FuenteFinanciamiento.objects.create(
            proyecto=proyecto, fuente='autofinanciado', monto=Decimal('1500.00'),
            descripcion='Aporte de los docentes participantes')

        PartidaPresupuestaria.objects.create(
            proyecto=proyecto, descripcion='Material didactico',
            categoria='material_escritorio', tipo_recurso='material', unidad='kit',
            cantidad=10, costo_unitario=Decimal('80.00'),
            monto_ejecutado=Decimal('750.00'), orden=1)
        PartidaPresupuestaria.objects.create(
            proyecto=proyecto, descripcion='Movilidad a la zona de intervencion',
            categoria='transporte', tipo_recurso='financiero', unidad='viaje',
            cantidad=7, costo_unitario=Decimal('100.00'),
            monto_ejecutado=Decimal('620.00'), orden=2)

        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto, meta_descripcion='Capacitar al grupo beneficiario',
            indicador_nombre='Personas capacitadas', unidad_medida='personas',
            linea_base=Decimal('0.00'), valor_meta=Decimal('100.00'),
            valor_alcanzado=Decimal('120.00'),
            metodo_verificacion='Lista de asistencia', orden=1)
        MetaIndicadorProyecto.objects.create(
            proyecto=proyecto, meta_descripcion='Dictar talleres en la institucion',
            indicador_nombre='Talleres dictados', unidad_medida='talleres',
            linea_base=Decimal('0.00'), valor_meta=Decimal('6.00'),
            valor_alcanzado=Decimal('5.00'),
            metodo_verificacion='Acta de taller', orden=2)

        avance = AvanceActividad.objects.create(
            proyecto=proyecto, actividad=actividad,
            descripcion='Taller dictado con participacion completa del grupo.',
            estado_actividad='completada', autor=docente)
        EvidenciaAvance.objects.create(
            avance=avance, tipo='enlace', nombre='Lista de asistencia',
            enlace_drive='https://drive.google.com/file/d/ejemplo/view')

        self.stdout.write(f'  {codigo} creado')
