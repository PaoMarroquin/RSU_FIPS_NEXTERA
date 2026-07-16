import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.usuarios.models import Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, EjeRSU, ODS, LineaEstrategica, MatrizOperativa, ObjetivoInstitucional, ActividadSugerida
from apps.proyectos.models import ProyectoRSU, ProyectoAsignatura, ProyectoDocente

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds 4 realistic RSU projects with full relationships'

    def handle(self, *args, **options):
        self.stdout.write('Starting database seeding for RSU projects...')

        # 1. Fetch or create roles
        rol_docente, _ = Rol.objects.get_or_create(nombre='Docente', defaults={'descripcion': 'Docente', 'activo': True})
        rol_coord, _ = Rol.objects.get_or_create(nombre=Rol.JEFATURA, defaults={'descripcion': 'Jefatura RSU', 'activo': True})

        # 2. Fetch or create institutional units
        facultad, _ = Facultad.objects.get_or_create(codigo='FIPS', defaults={'nombre': 'Facultad de Ingeniería de Producción y Servicios'})
        escuela, _ = EscuelaProfesional.objects.get_or_create(codigo='EPIS', defaults={'nombre': 'Escuela Profesional de Ingeniería de Sistemas', 'facultad': facultad})
        departamento, _ = DepartamentoAcademico.objects.get_or_create(codigo='DAISI', defaults={'nombre': 'Departamento Académico de Ingeniería de Sistemas e Informática', 'facultad': facultad})

        # 3. Create mock users
        docente_1, _ = User.objects.get_or_create(
            correo_institucional='responsable.rsu@unsa.edu.pe',
            defaults={
                'nombres': 'Dr. Alberto Flores Valdivia',
                'celular': '958473621',
                'rol': rol_docente,
                'facultad': facultad,
                'escuela': escuela,
                'departamento': departamento,
                'estado': 'activo'
            }
        )
        if _:
            docente_1.set_password('rsu2026')
            docente_1.save()

        docente_2, _ = User.objects.get_or_create(
            correo_institucional='colaborador.rsu@unsa.edu.pe',
            defaults={
                'nombres': 'Mg. Patricia Bedregal Quiroz',
                'celular': '984512367',
                'rol': rol_docente,
                'facultad': facultad,
                'escuela': escuela,
                'departamento': departamento,
                'estado': 'activo'
            }
        )
        if _:
            docente_2.set_password('rsu2026')
            docente_2.save()

        coordinador, _ = User.objects.get_or_create(
            correo_institucional='coordinador.rsu@unsa.edu.pe',
            defaults={
                'nombres': 'Dr. Marcos Sanz Choque',
                'celular': '993481273',
                'rol': rol_coord,
                'facultad': facultad,
                'escuela': escuela,
                'departamento': departamento,
                'estado': 'activo'
            }
        )
        if _:
            coordinador.set_password('rsu2026')
            coordinador.save()

        # 4. Create Academic Period
        periodo, _ = PeriodoAcademico.objects.get_or_create(
            nombre='Anual-2026',
            defaults={
                'anio': 2026,
                'semestre': 'Anual',
                'fecha_inicio': datetime.date(2026, 4, 1),
                'fecha_fin': datetime.date(2026, 12, 15),
                'activo': True
            }
        )

        # 5. Get axes and ODS
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

        # 6. Create Matriz Operativa Anual
        matriz, _ = MatrizOperativa.objects.get_or_create(
            periodo=periodo,
            facultad=facultad,
            defaults={
                'coordinador': coordinador,
                'presupuesto_global': 85000.00,
                'estado': 'publicada',
                'observaciones': 'Matriz Operativa FIPS aprobada por resolución institucional.'
            }
        )

        # 7. Create Institutional Lines and Objectives
        linea_env = LineaEstrategica.objects.create(nombre='Gestión Ambiental y Campus Sostenible', eje_rsu=eje_gestion)
        linea_edu = LineaEstrategica.objects.create(nombre='Innovación Curricular con Enfoque RSU', eje_rsu=eje_formacion)
        linea_inv = LineaEstrategica.objects.create(nombre='Investigación Aplicada al Desarrollo Sostenible', eje_rsu=eje_investigacion)
        linea_soc = LineaEstrategica.objects.create(nombre='Proyectos de Extensión y Apoyo Comunitario', eje_rsu=eje_extension)

        obj_1 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_env, eje_rsu=eje_gestion,
            nombre='Promover una cultura de ecoeficiencia y campus sostenible en la FIPS',
            meta_cuantitativa='Reducir un 20% el consumo de papel y plásticos de un solo uso.'
        )
        obj_2 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_edu, eje_rsu=eje_formacion,
            nombre='Integrar competencias éticas y de responsabilidad social en asignaturas básicas',
            meta_cuantitativa='El 100% de los ingresantes participan en programas formativos de RSU.'
        )
        obj_3 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_inv, eje_rsu=eje_investigacion,
            nombre='Desarrollar soluciones tecnológicas aplicadas a problemas ambientales y sociales',
            meta_cuantitativa='Implementar 2 prototipos de software aplicados a la salud o medio ambiente.'
        )
        obj_4 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_soc, eje_rsu=eje_extension,
            nombre='Fomentar el voluntariado profesional en comunidades vulnerables de la región',
            meta_cuantitativa='Brindar asistencia técnica a 3 comunidades rurales.'
        )

        # 8. Create Suggested Activities
        ActividadSugerida.objects.create(matriz=matriz, objetivo=obj_1, eje_rsu=eje_gestion, nombre='Campaña Cero Papel y Concursos de Afiches', anio_academico=1, tipo_actividad='Sensibilización')
        ActividadSugerida.objects.create(matriz=matriz, objetivo=obj_2, eje_rsu=eje_formacion, nombre='Foros Universitarios sobre Ética y ODS', anio_academico=2, tipo_actividad='Foros')
        ActividadSugerida.objects.create(matriz=matriz, objetivo=obj_3, eje_rsu=eje_investigacion, nombre='Desarrollo de Aplicativos Móviles y de Telemetría', anio_academico=3, tipo_actividad='Proyectos técnicos')
        ActividadSugerida.objects.create(matriz=matriz, objetivo=obj_4, eje_rsu=eje_extension, nombre='Evaluación de impacto socioeconómico y conectividad', anio_academico=5, tipo_actividad='Evaluación de impacto')

        # 9. Create 4 realistic projects
        self.stdout.write('Creating 4 example projects...')

        # --- PROYECTO 1: 1.er Año (Sensibilización) ---
        p1 = ProyectoRSU.objects.create(
            codigo='PROY-FIPS-2026-0001',
            titulo='Campaña Eco-Eficiencia FIPS: Implementación de Políticas "Cero Plástico y Cero Papel"',
            descripcion_general='Campaña integral de sensibilización liderada por alumnos de primer año enfocada en la reducción del consumo de plásticos y papel dentro de las aulas y pasadizos de la FIPS.',
            fundamentacion='Se fundamenta en las políticas de sostenibilidad de la UNSA orientadas a mitigar la acumulación de residuos inorgánicos y fomentar la cultura de reciclaje desde el inicio de la vida universitaria.',
            diagnostico_situacional='Actualmente en las aulas se detecta un uso excesivo de papel impreso innecesario y desecho masivo de botellas plásticas de bebidas energéticas.',
            eje_rsu=eje_gestion,
            linea_estrategica=linea_env,
            objetivo_institucional=obj_1,
            periodo=periodo,
            facultad=facultad,
            escuela=escuela,
            departamento=departamento,
            docente_responsable=docente_1,
            semestre_academico='2026-I',
            anio_carrera=1,
            es_tesis_quinto_anio=False,
            estado='borrador',
            presentado_con_anticipacion=True
        )
        p1.ods.set([ods_12, ods_13])
        ProyectoAsignatura.objects.create(proyecto=p1, nombre_asignatura='Introducción a la Ingeniería de Sistemas', codigo_asignatura='IS101', anio_carrera=1, semestre='I')
        ProyectoDocente.objects.create(proyecto=p1, docente=docente_2, rol_en_proyecto='Colaborador')

        # --- PROYECTO 2: 2.do Año (Ética y Buen Gobierno) ---
        p2 = ProyectoRSU.objects.create(
            codigo='PROY-FIPS-2026-0002',
            titulo='Foro Universitario de Concientización Ética y Transparencia en Organizaciones Sociales',
            descripcion_general='Planificación y ejecución de un foro abierto liderado por estudiantes donde se exponen casos reales de ética, anticorrupción y la necesidad de transparencia en juntas vecinales.',
            fundamentacion='Basado en la Ley Universitaria, busca formar profesionales socialmente responsables fortaleciendo valores cívicos y éticos a través del debate académico.',
            diagnostico_situacional='Las organizaciones sociales locales reportan debilidad en el control de presupuestos y desconocimiento de procesos éticos administrativos.',
            eje_rsu=eje_formacion,
            linea_estrategica=linea_edu,
            objetivo_institucional=obj_2,
            periodo=periodo,
            facultad=facultad,
            escuela=escuela,
            departamento=departamento,
            docente_responsable=docente_1,
            semestre_academico='2026-I',
            anio_carrera=2,
            es_tesis_quinto_anio=False,
            estado='borrador',
            presentado_con_anticipacion=False
        )
        p2.ods.set([ods_16])
        ProyectoAsignatura.objects.create(proyecto=p2, nombre_asignatura='Ética y Ciudadanía', codigo_asignatura='IS202', anio_carrera=2, semestre='II')

        # --- PROYECTO 3: 4.to Año (Proyecto Técnico - Telemetría) ---
        p3 = ProyectoRSU.objects.create(
            codigo='PROY-FIPS-2026-0003',
            titulo='Sistema de Telemetría de Calidad de Aire Basado en IoT para el Distrito de Miraflores',
            descripcion_general='Desarrollo de un prototipo electrónico y plataforma web de visualización en tiempo real para alertar sobre niveles de contaminación en zonas críticas del distrito.',
            fundamentacion='Responde a la alta tasa de enfermedades respiratorias y la falta de información pública accesible sobre el índice de calidad del aire.',
            diagnostico_situacional='La municipalidad no cuenta con estaciones de monitoreo distribuidas, haciendo imposible tomar medidas preventivas en horas punta.',
            eje_rsu=eje_investigacion,
            linea_estrategica=linea_inv,
            objetivo_institucional=obj_3,
            periodo=periodo,
            facultad=facultad,
            escuela=escuela,
            departamento=departamento,
            docente_responsable=docente_2,
            semestre_academico='2026-I',
            anio_carrera=4,
            es_tesis_quinto_anio=False,
            estado='en_revision',
            presentado_con_anticipacion=True,
            fecha_envio_revision=datetime.datetime.now()
        )
        p3.ods.set([ods_3, ods_11, ods_9])
        ProyectoAsignatura.objects.create(proyecto=p3, nombre_asignatura='Redes y Transmisión de Datos', codigo_asignatura='IS404', anio_carrera=4, semestre='I')
        ProyectoDocente.objects.create(proyecto=p3, docente=docente_1, rol_en_proyecto='Colaborador')

        # --- PROYECTO 4: 5.to Año (Proyecto de Tesis e Impacto) ---
        p4 = ProyectoRSU.objects.create(
            codigo='PROY-FIPS-2026-0004',
            titulo='Evaluación de Impacto Tecnológico y Conectividad en Escuelas Rurales de la Provincia de Caylloma',
            descripcion_general='Proyecto integral de fin de carrera enfocado en evaluar la efectividad de las aulas virtuales implementadas, capacitando además a los docentes rurales en competencias digitales.',
            fundamentacion='El proyecto se alinea con la meta de acortar la brecha educativa rural mediante el uso óptimo de infraestructura de telecomunicaciones instalada.',
            diagnostico_situacional='A pesar de contar con computadoras, más del 70% de profesores rurales no integran recursos digitales por falta de competencias pedagógicas digitales.',
            eje_rsu=eje_extension,
            linea_estrategica=linea_soc,
            objetivo_institucional=obj_4,
            periodo=periodo,
            facultad=facultad,
            escuela=escuela,
            departamento=departamento,
            docente_responsable=docente_2,
            semestre_academico='2026-I',
            anio_carrera=5,
            es_tesis_quinto_anio=True,
            estado='aprobado',
            presentado_con_anticipacion=True,
            fecha_envio_revision=datetime.datetime.now() - datetime.timedelta(days=15),
            fecha_aprobacion=datetime.datetime.now() - datetime.timedelta(days=10),
            fecha_inicio_ejecucion=datetime.datetime.now() - datetime.timedelta(days=5)
        )
        p4.ods.set([ods_4, ods_9])
        ProyectoAsignatura.objects.create(proyecto=p4, nombre_asignatura='Proyecto de Tesis II', codigo_asignatura='IS505', anio_carrera=5, semestre='II')
        ProyectoDocente.objects.create(proyecto=p4, docente=docente_1, rol_en_proyecto='Asesor')

        self.stdout.write(self.style.SUCCESS('Seeding completed successfully! 4 realistic RSU projects, users, objectives, and sugerida-activities have been populated.'))
