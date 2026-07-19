import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import date
from apps.usuarios.models import Usuario, EscuelaProfesional
from apps.planificacion.models import PeriodoAcademico, EjeRSU, LineaEstrategica, ODS
from apps.proyectos.models import (
    ProyectoRSU, ProyectoDocente, ProyectoAsignatura, MetaIndicadorProyecto,
    CronogramaAccion, ActividadProyecto, PartidaPresupuestaria, FuenteFinanciamiento,
    TipoBeneficiario
)

def run():
    docente = Usuario.objects.get(correo_institucional='docente1@unsa.edu.pe')
    escuela_obj = EscuelaProfesional.objects.filter(facultad=docente.departamento.facultad).first() or EscuelaProfesional.objects.first()
    periodo = PeriodoAcademico.objects.filter(activo=True).first()
    eje = EjeRSU.objects.first()
    ods = ODS.objects.first() if ODS.objects.exists() else None
    
    print("Creando Proyecto Aprobado...")
    proyecto = ProyectoRSU.objects.create(
        titulo='Proyecto Super Completo de Prueba 2026',
        codigo='PRY-FULL-001',
        estado='aprobado',
        docente_responsable=docente,
        periodo=periodo,
        escuela=escuela_obj,
        departamento=docente.departamento,
        facultad=docente.departamento.facultad,
        eje_rsu=eje,
        fecha_inicio=date(2026, 3, 1),
        fecha_termino=date(2026, 7, 31),
        diag_justificacion_intervencion='Esta es una justificacion super detallada del proyecto.',
        obj_logro_intervencion='Lograr todos los objetivos de prueba.',
    )
    if ods:
        proyecto.ods.add(ods)
    
    ProyectoAsignatura.objects.create(
        proyecto=proyecto,
        nombre_asignatura='Taller de Proyectos',
        codigo_asignatura='TP-101',
        anio_carrera=5,
        semestre='X'
    )
    
    MetaIndicadorProyecto.objects.create(
        proyecto=proyecto,
        meta_descripcion='Lograr impactar 100 estudiantes',
        indicador_nombre='Nro Estudiantes Impactados',
        unidad_medida='Estudiantes',
        linea_base=0,
        valor_meta=100,
        valor_alcanzado=0,
        metodo_verificacion='Encuestas',
        fuente_verificacion='Listas de asistencia',
        orden=1
    )
    
    CronogramaAccion.objects.create(
        proyecto=proyecto,
        descripcion='Fase de planeacion',
        fecha_inicio=date(2026, 3, 1),
        fecha_fin=date(2026, 3, 15),
        responsable='Carlos Mendoza',
        estado_avance='finalizado',
        orden=1
    )
    CronogramaAccion.objects.create(
        proyecto=proyecto,
        descripcion='Fase de ejecucion',
        fecha_inicio=date(2026, 3, 16),
        fecha_fin=date(2026, 6, 30),
        responsable='Carlos Mendoza',
        estado_avance='en_proceso',
        orden=2
    )
    
    ActividadProyecto.objects.create(
        proyecto=proyecto,
        nombre='Taller de inicio',
        descripcion='Taller para empezar el proyecto',
        fecha=date(2026, 3, 10),
        estado='completada',
        orden=1
    )
    ActividadProyecto.objects.create(
        proyecto=proyecto,
        nombre='Trabajo de campo',
        descripcion='Recoleccion de datos',
        fecha=date(2026, 4, 15),
        estado='en_ejecucion',
        orden=2
    )
    ActividadProyecto.objects.create(
        proyecto=proyecto,
        nombre='Redacción de informe',
        descripcion='Redacción del informe final',
        fecha=date(2026, 7, 10),
        estado='pendiente',
        orden=3
    )
    
    fuente = FuenteFinanciamiento.objects.create(
        proyecto=proyecto,
        fuente='recursos_propios',
        monto=5000,
        descripcion='Recursos del departamento'
    )
    
    PartidaPresupuestaria.objects.create(
        proyecto=proyecto,
        fuente=fuente,
        categoria='bienes',
        tipo_recurso='material_escritorio',
        descripcion='Papel y lapiceros',
        unidad='cajas',
        cantidad=10,
        costo_unitario=50,
        orden=1
    )
    
    tb, _ = TipoBeneficiario.objects.get_or_create(codigo='ESTUDIANTES', defaults={'label': 'Estudiantes'})
    proyecto.beneficiarios.add(tb)
    
    print("Creando Proyecto en Revisión...")
    proyecto2 = ProyectoRSU.objects.create(
        titulo='Proyecto Super Completo En Revisión',
        codigo='PRY-FULL-002',
        estado='en_revision',
        docente_responsable=docente,
        periodo=periodo,
        escuela=escuela_obj,
        departamento=docente.departamento,
        facultad=docente.departamento.facultad,
        eje_rsu=eje,
        fecha_inicio=date(2026, 3, 1),
        fecha_termino=date(2026, 7, 31),
        diag_justificacion_intervencion='Justificacion del segundo proyecto.',
        obj_logro_intervencion='Otro objetivo general.',
    )
    ProyectoAsignatura.objects.create(
        proyecto=proyecto2, nombre_asignatura='Curso Base', anio_carrera=3
    )
    MetaIndicadorProyecto.objects.create(
        proyecto=proyecto2,
        meta_descripcion='Meta 2',
        indicador_nombre='Ind',
        valor_meta=10,
        valor_alcanzado=0
    )
    
    print("¡Proyectos ultra completos creados exitosamente para docente1@unsa.edu.pe!")

if __name__ == "__main__":
    run()
