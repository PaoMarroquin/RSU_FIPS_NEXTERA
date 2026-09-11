"""
Comando de carga inicial de los catalogos RSU.

Crea usuarios de prueba, un periodo academico, lineas estrategicas y una
matriz operativa de ejemplo. Es idempotente: volver a ejecutarlo no duplica
registros. Los ejes RSU, ODS y facultades ya existen desde las migraciones.

Uso:
    python manage.py seed_rsu

Conecta con:
- apps/planificacion/models.py: modelos que puebla.
- apps/proyectos/management/commands/seed_proyectos.py: carga de proyectos
  de ejemplo que depende de los catalogos creados aqui.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.planificacion.models import (
    PeriodoAcademico, EjeRSU, LineaEstrategica, MatrizOperativa,
    ObjetivoInstitucional, IndicadorInstitucional, ActividadSugerida,
)
from apps.usuarios.models import Facultad, Rol

User = get_user_model()

PASSWORD = 'Admin1234!'


class Command(BaseCommand):
    help = 'Crea datos de prueba RSU: usuarios, periodo, lineas estrategicas y matriz operativa'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando la carga de datos de prueba RSU...')

        # Roles ya existen desde la migracion 0003_seed_roles
        rol_admin = Rol.objects.get(nombre=Rol.ADMINISTRADOR)
        rol_docente = Rol.objects.get(nombre=Rol.DOCENTE)
        rol_dpto = Rol.objects.get(nombre=Rol.DEPARTAMENTO)
        rol_jefe = Rol.objects.get(nombre=Rol.JEFATURA)

        # Facultad ya existe desde la migracion 0004_seed_facultades_unsa
        facultad = Facultad.objects.get(codigo='FIPS')

        # Usuarios de prueba
        admin, creado = User.objects.get_or_create(
            correo_institucional='admin@unsa.edu.pe',
            defaults={'nombres': 'Admin', 'apellidos': 'RSU', 'rol': rol_admin,
                      'estado': 'activo', 'is_staff': True},
        )
        if creado:
            admin.set_password(PASSWORD)
            admin.save()

        jefe, creado = User.objects.get_or_create(
            correo_institucional='jefe@unsa.edu.pe',
            defaults={'nombres': 'Coordinador', 'apellidos': 'RSU FIPS', 'rol': rol_jefe,
                      'facultad': facultad, 'estado': 'activo'},
        )
        if creado:
            jefe.set_password(PASSWORD)
            jefe.save()

        dpto, creado = User.objects.get_or_create(
            correo_institucional='departamento@unsa.edu.pe',
            defaults={'nombres': 'Revisor', 'apellidos': 'Departamento FIPS', 'rol': rol_dpto,
                      'facultad': facultad, 'estado': 'activo'},
        )
        if creado:
            dpto.set_password(PASSWORD)
            dpto.save()

        doc1, creado = User.objects.get_or_create(
            correo_institucional='docente1@unsa.edu.pe',
            defaults={'nombres': 'Alberto', 'apellidos': 'Flores Valdivia', 'rol': rol_docente,
                      'facultad': facultad, 'estado': 'activo'},
        )
        if creado:
            doc1.set_password(PASSWORD)
            doc1.save()

        doc2, creado = User.objects.get_or_create(
            correo_institucional='docente2@unsa.edu.pe',
            defaults={'nombres': 'Patricia', 'apellidos': 'Bedregal Quiroz', 'rol': rol_docente,
                      'facultad': facultad, 'estado': 'activo'},
        )
        if creado:
            doc2.set_password(PASSWORD)
            doc2.save()

        self.stdout.write('  Usuarios OK')

        # Periodo academico - clave unica (anio, semestre)
        periodo, _ = PeriodoAcademico.objects.get_or_create(
            anio=2026, semestre='Anual',
            defaults={
                'nombre': 'Anual 2026',
                'fecha_inicio': datetime.date(2026, 4, 1),
                'fecha_fin': datetime.date(2026, 12, 15),
                'activo': True,
            },
        )
        self.stdout.write('  Periodo academico OK')

        # Ejes RSU ya existen desde la migracion 0002_seed_ejes_ods
        eje_gestion = EjeRSU.objects.get(nombre='Gestión')
        eje_formacion = EjeRSU.objects.get(nombre='Formación')
        eje_investigacion = EjeRSU.objects.get(nombre='Investigación')
        eje_extension = EjeRSU.objects.get(nombre='Extensión')

        # Lineas estrategicas
        linea_amb, _ = LineaEstrategica.objects.get_or_create(
            nombre='Gestion Ambiental y Campus Sostenible', eje_rsu=eje_gestion)
        linea_edu, _ = LineaEstrategica.objects.get_or_create(
            nombre='Innovacion Curricular con Enfoque RSU', eje_rsu=eje_formacion)
        linea_inv, _ = LineaEstrategica.objects.get_or_create(
            nombre='Investigacion Aplicada al Desarrollo Sostenible', eje_rsu=eje_investigacion)
        linea_soc, _ = LineaEstrategica.objects.get_or_create(
            nombre='Proyectos de Extension y Apoyo Comunitario', eje_rsu=eje_extension)
        self.stdout.write('  Lineas estrategicas OK')

        # Matriz operativa
        matriz, creado = MatrizOperativa.objects.get_or_create(
            periodo=periodo, facultad=facultad,
            defaults={'coordinador': jefe, 'presupuesto_global': 85000.00, 'estado': 'publicada'},
        )
        if not creado:
            self.stdout.write(self.style.WARNING('  La matriz ya existia, no se duplica.'))
            self.stdout.write(self.style.SUCCESS('Datos RSU ya presentes. Listo.'))
            return

        # Objetivos institucionales
        obj1 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_amb, eje_rsu=eje_gestion,
            nombre='Promover ecoeficiencia y campus sostenible en la FIPS',
            meta_cuantitativa='Reducir 20% el consumo de papel y plasticos.',
        )
        IndicadorInstitucional.objects.create(
            objetivo=obj1, nombre='Porcentaje de reduccion de papel',
            unidad_medida='%', valor_meta=20.00)
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj1, eje_rsu=eje_gestion,
            nombre='Campana Cero Papel y concursos de afiches', anio_academico=1)

        obj2 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_edu, eje_rsu=eje_formacion,
            nombre='Integrar competencias de RSU en asignaturas basicas',
            meta_cuantitativa='El 100% de ingresantes participa en programas RSU.',
        )
        IndicadorInstitucional.objects.create(
            objetivo=obj2, nombre='Numero de cursos con enfoque RSU',
            unidad_medida='cursos', valor_meta=15.00)
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj2, eje_rsu=eje_formacion,
            nombre='Foros universitarios sobre etica y ODS', anio_academico=2)

        obj3 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_inv, eje_rsu=eje_investigacion,
            nombre='Desarrollar soluciones tecnologicas para problemas sociales',
            meta_cuantitativa='Implementar 2 prototipos aplicados a salud o medio ambiente.',
        )
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj3, eje_rsu=eje_investigacion,
            nombre='Desarrollo de aplicativos moviles y telemetria', anio_academico=3)

        obj4 = ObjetivoInstitucional.objects.create(
            matriz=matriz, linea_estrategica=linea_soc, eje_rsu=eje_extension,
            nombre='Fomentar el voluntariado profesional en comunidades vulnerables',
            meta_cuantitativa='Asistencia tecnica a 3 comunidades rurales.',
        )
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj4, eje_rsu=eje_extension,
            nombre='Evaluacion de impacto socioeconomico y conectividad', anio_academico=5)

        self.stdout.write(self.style.SUCCESS(
            f'Datos creados exitosamente. Matriz ID: {matriz.id}. '
            f'Usuarios con contrasena: {PASSWORD}'))