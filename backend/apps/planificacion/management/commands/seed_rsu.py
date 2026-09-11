from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.planificacion.models import (
    PeriodoAcademico, EjeRSU, LineaEstrategica, MatrizOperativa,
    ObjetivoInstitucional, IndicadorInstitucional, ActividadSugerida
)
from apps.usuarios.models import Facultad, Rol

User = get_user_model()

class Command(BaseCommand):
    help = 'Crea datos de prueba reales (Matriz Operativa RSU - UNSA) para probar exportaciones'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando la carga de datos de prueba RSU...")

        # 1. Crear Usuario Coordinador (Adaptado a tus campos reales)
        rol_coord, _ = Rol.objects.get_or_create(nombre='Coordinador RSU')
        coordinador, _ = User.objects.get_or_create(
            correo_institucional='jperez@unsa.edu.pe',
            defaults={
                'nombre_completo': 'Juan Pérez Gómez',
                'celular': '987654321',
                'rol': rol_coord,
                'estado': 'activo'
            }
        )
        if not coordinador.password:
            coordinador.set_password('unsa1234')
            coordinador.save()

        # 2. Crear Facultad
        # 2. Crear Facultad (Simplificado solo con el nombre obligatorio)
        facultad, _ = Facultad.objects.get_or_create(
            nombre='Facultad de Ingeniería de Producción y Servicios'
        )

        # 3. Crear Periodo Académico
        periodo, _ = PeriodoAcademico.objects.get_or_create(
            anio=2026,
            semestre='Anual',
            defaults={
                'nombre': 'Año Académico 2026',
                'fecha_inicio': timezone.now().date(),
                'fecha_fin': (timezone.now() + timedelta(days=365)).date(),
                'activo': True
            }
        )

        # 4. Crear Ejes RSU (Basados en la estructura universitaria)
        eje_gestion, _ = EjeRSU.objects.get_or_create(nombre='Gestión Institucional')
        eje_formacion, _ = EjeRSU.objects.get_or_create(nombre='Formación Académica')
        eje_extension, _ = EjeRSU.objects.get_or_create(nombre='Extensión Universitaria')

        # 5. Crear Líneas Estratégicas
        linea_ambiental, _ = LineaEstrategica.objects.get_or_create(
            nombre='Gestión Ambiental Sostenible', eje_rsu=eje_gestion
        )
        linea_curricula, _ = LineaEstrategica.objects.get_or_create(
            nombre='Inclusión de RSU en la Currícula', eje_rsu=eje_formacion
        )

        # 6. Crear la Matriz Operativa
        matriz, created = MatrizOperativa.objects.get_or_create(
            periodo=periodo,
            facultad=facultad,
            defaults={
                'coordinador': coordinador,
                'presupuesto_global': 15000.00,
                'estado': 'publicada'
            }
        )

        if not created:
            self.stdout.write(self.style.WARNING("La matriz ya existía, se agregarán nuevos datos a la existente."))

        # 7. Crear Objetivos, Indicadores y Actividades para la Matriz
        # --- OBJETIVO 1: AMBIENTAL ---
        obj1 = ObjetivoInstitucional.objects.create(
            matriz=matriz,
            linea_estrategica=linea_ambiental,
            eje_rsu=eje_gestion,
            nombre='Reducir el consumo de papel y plástico en la facultad',
            resultado_esperado='Facultad con certificación interna de eco-eficiencia'
        )
        IndicadorInstitucional.objects.create(
            objetivo=obj1, nombre='Porcentaje de reducción de papel', 
            unidad_medida='%', valor_meta=30.00
        )
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj1, eje_rsu=eje_gestion,
            nombre='Campaña de sensibilización "Cero Papel"', anio_academico=1
        )
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj1, eje_rsu=eje_gestion,
            nombre='Implementación de tachos ecológicos', anio_academico=2
        )

        # --- OBJETIVO 2: FORMACIÓN ---
        obj2 = ObjetivoInstitucional.objects.create(
            matriz=matriz,
            linea_estrategica=linea_curricula,
            eje_rsu=eje_formacion,
            nombre='Integrar proyectos de impacto social en cursos de carrera',
            resultado_esperado='Syllabus actualizados con enfoque RSU'
        )
        IndicadorInstitucional.objects.create(
            objetivo=obj2, nombre='Número de cursos con enfoque RSU', 
            unidad_medida='cursos', valor_meta=15.00
        )
        ActividadSugerida.objects.create(
            matriz=matriz, objetivo=obj2, eje_rsu=eje_formacion,
            nombre='Taller de rediseño de syllabus para docentes', anio_academico=None
        )

        self.stdout.write(self.style.SUCCESS(f"¡Datos creados exitosamente! Revisa la Matriz ID: {matriz.id}"))