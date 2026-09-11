"""
Comando de carga de proyectos RSU de ejemplo.

Genera proyectos en distintos estados con sus actividades, cronograma,
presupuesto y metas, para poder probar el frontend y los informes sin tener
que llenar formularios a mano. Es idempotente.

Prerrequisito: ejecutar seed_rsu primero (crea usuarios, periodo y lineas
estrategicas que este comando utiliza).

Uso:
    python manage.py seed_rsu
    python manage.py seed_proyectos

Conecta con:
- apps/proyectos/models.py: modelos que puebla.
- apps/planificacion/management/commands/seed_rsu.py: catalogos previos.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import (
    PeriodoAcademico, EjeRSU, ODS, LineaEstrategica,
    MatrizOperativa, ObjetivoInstitucional,
)
from apps.proyectos.models import ProyectoRSU, ProyectoAsignatura, ProyectoDocente

User = get_user_model()


class Command(BaseCommand):
    help = 'Crea 4 proyectos RSU de ejemplo en distintos estados'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando carga de proyectos RSU de ejemplo...')

        # Datos base creados por seed_rsu o las migraciones
        facultad = Facultad.objects.get(codigo='FIPS')
        escuela, _ = EscuelaProfesional.objects.get_or_create(
            codigo='EPIS',
            defaults={'nombre': 'Escuela Profesional de Ingenieria de Sistemas', 'facultad': facultad},
        )
        departamento, _ = DepartamentoAcademico.objects.get_or_create(
            codigo='DAISI',
            defaults={'nombre': 'Departamento Academico de Ingenieria de Sistemas e Informatica',
                      'facultad': facultad},
        )

        # Usuarios creados por seed_rsu
        docente_1 = User.objects.get(correo_institucional='docente1@unsa.edu.pe')
        docente_2 = User.objects.get(correo_institucional='docente2@unsa.edu.pe')

        # Periodo creado por seed_rsu - clave unica es (anio, semestre)
        periodo = PeriodoAcademico.objects.get(anio=2026, semestre='Anual')

        # Ejes RSU creados por la migracion 0002_seed_ejes_ods
        eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        eje_formacion = EjeRSU.objects.get(nombre='Formación')
        eje_investigacion = EjeRSU.objects.get(nombre='Investigación')
        eje_extension = EjeRSU.objects.get(nombre='Extensión')

        ods_3 = ODS.objects.get(numero=3)
        ods_4 = ODS.objects.get(numero=4)
        ods_9 = ODS.objects.get(numero=9)
        ods_11 = ODS.objects.get(numero=11)
        ods_12 = ODS.objects.get(numero=12)
        ods_13 = ODS.objects.get(numero=13)
        ods_16 = ODS.objects.get(numero=16)

        # Matriz y lineas creadas por seed_rsu
        matriz = MatrizOperativa.objects.get(periodo=periodo, facultad=facultad)
        linea_amb = LineaEstrategica.objects.get(
            nombre='Gestion Ambiental y Campus Sostenible', eje_rsu=eje_gestion)
        linea_edu = LineaEstrategica.objects.get(
            nombre='Innovacion Curricular con Enfoque RSU', eje_rsu=eje_formacion)
        linea_inv = LineaEstrategica.objects.get(
            nombre='Investigacion Aplicada al Desarrollo Sostenible', eje_rsu=eje_investigacion)
        linea_soc = LineaEstrategica.objects.get(
            nombre='Proyectos de Extension y Apoyo Comunitario', eje_rsu=eje_extension)

        obj_1 = ObjetivoInstitucional.objects.get(
            matriz=matriz, eje_rsu=eje_gestion)
        obj_2 = ObjetivoInstitucional.objects.get(
            matriz=matriz, eje_rsu=eje_formacion)
        obj_3 = ObjetivoInstitucional.objects.get(
            matriz=matriz, eje_rsu=eje_investigacion)
        obj_4 = ObjetivoInstitucional.objects.get(
            matriz=matriz, eje_rsu=eje_extension)

        self.stdout.write('  Catalogos cargados OK')

        # Proyectos de ejemplo
        p1, creado = ProyectoRSU.objects.get_or_create(
            codigo='PROY-FIPS-2026-0001',
            defaults=dict(
                titulo='Campana Eco-Eficiencia FIPS: Politicas Cero Plastico y Cero Papel',
                eje_rsu=eje_gestion, linea_estrategica=linea_amb,
                objetivo_institucional=obj_1, periodo=periodo,
                facultad=facultad, escuela=escuela, departamento=departamento,
                docente_responsable=docente_1, semestre_academico='2026-I',
                anio_carrera=1, estado='borrador',
            ),
        )
        if creado:
            p1.ods.set([ods_12, ods_13])
            ProyectoAsignatura.objects.create(
                proyecto=p1, nombre_asignatura='Introduccion a la Ingenieria de Sistemas',
                codigo_asignatura='IS101', anio_carrera=1, semestre='I')
            ProyectoDocente.objects.create(
                proyecto=p1, docente=docente_2, rol_en_proyecto='Colaborador')

        p2, creado = ProyectoRSU.objects.get_or_create(
            codigo='PROY-FIPS-2026-0002',
            defaults=dict(
                titulo='Foro Universitario de Etica y Transparencia en Organizaciones Sociales',
                eje_rsu=eje_formacion, linea_estrategica=linea_edu,
                objetivo_institucional=obj_2, periodo=periodo,
                facultad=facultad, escuela=escuela, departamento=departamento,
                docente_responsable=docente_1, semestre_academico='2026-I',
                anio_carrera=2, estado='borrador',
            ),
        )
        if creado:
            p2.ods.set([ods_16])
            ProyectoAsignatura.objects.create(
                proyecto=p2, nombre_asignatura='Etica y Ciudadania',
                codigo_asignatura='IS202', anio_carrera=2, semestre='II')

        p3, creado = ProyectoRSU.objects.get_or_create(
            codigo='PROY-FIPS-2026-0003',
            defaults=dict(
                titulo='Sistema de Telemetria de Calidad de Aire IoT para el Distrito de Miraflores',
                eje_rsu=eje_investigacion, linea_estrategica=linea_inv,
                objetivo_institucional=obj_3, periodo=periodo,
                facultad=facultad, escuela=escuela, departamento=departamento,
                docente_responsable=docente_2, semestre_academico='2026-I',
                anio_carrera=4, estado='en_revision',
                fecha_envio_revision=datetime.datetime.now(),
            ),
        )
        if creado:
            p3.ods.set([ods_3, ods_11, ods_9])
            ProyectoAsignatura.objects.create(
                proyecto=p3, nombre_asignatura='Redes y Transmision de Datos',
                codigo_asignatura='IS404', anio_carrera=4, semestre='I')
            ProyectoDocente.objects.create(
                proyecto=p3, docente=docente_1, rol_en_proyecto='Colaborador')

        p4, creado = ProyectoRSU.objects.get_or_create(
            codigo='PROY-FIPS-2026-0004',
            defaults=dict(
                titulo='Evaluacion de Impacto Tecnologico en Escuelas Rurales de la Provincia de Caylloma',
                eje_rsu=eje_extension, linea_estrategica=linea_soc,
                objetivo_institucional=obj_4, periodo=periodo,
                facultad=facultad, escuela=escuela, departamento=departamento,
                docente_responsable=docente_2, semestre_academico='2026-I',
                anio_carrera=5, es_tesis_quinto_anio=True, estado='aprobado',
                fecha_envio_revision=datetime.datetime.now() - datetime.timedelta(days=15),
                fecha_aprobacion=datetime.datetime.now() - datetime.timedelta(days=10),
            ),
        )
        if creado:
            p4.ods.set([ods_4, ods_9])
            ProyectoAsignatura.objects.create(
                proyecto=p4, nombre_asignatura='Proyecto de Tesis II',
                codigo_asignatura='IS505', anio_carrera=5, semestre='II')
            ProyectoDocente.objects.create(
                proyecto=p4, docente=docente_1, rol_en_proyecto='Asesor')

        self.stdout.write(self.style.SUCCESS(
            'Carga completada. 4 proyectos RSU de ejemplo disponibles.'))
