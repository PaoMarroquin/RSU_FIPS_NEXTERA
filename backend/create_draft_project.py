import os
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
    
    ProyectoRSU.objects.filter(codigo='PRY-FULL-003').delete()
    
    print("Creando Proyecto Borrador...")
    proyecto = ProyectoRSU.objects.create(
        titulo='Proyecto Super Completo Borrador 2026',
        codigo='PRY-FULL-003',
        estado='borrador',
        docente_responsable=docente,
        periodo=periodo,
        escuela=escuela_obj,
        departamento=docente.departamento,
        facultad=docente.departamento.facultad,
        eje_rsu=eje,
        fecha_inicio=date(2026, 4, 1),
        fecha_termino=date(2026, 8, 31),
        diag_justificacion_intervencion='Justificacion para el proyecto borrador.',
        obj_logro_intervencion='Objetivo principal del borrador.',
        
        # 1. Datos Generales
        lugar_ejecucion="Distrito de Cerro Colorado, Arequipa",
        tipo_actividad=["programas_formativos"],
        
        # 2. Fundamentación Institucional
        fund_por_que_grupo="Porque necesitan apoyo en lectura.",
        fund_para_que_proyecto="Para mejorar su comprensión lectora.",
        fund_mecanismo_ensenanza="Talleres presenciales.",
        
        # 3. Diagnóstico
        diag_estado_grupo="Nivel bajo de comprensión.",
        diag_problemas_detectados="Falta de hábitos de lectura.",
        diag_aportes_formacion="Desarrollo de empatía y habilidades blandas.",
        
        # 4. Objetivos
        obj_mejora_curricular="Incluir horas de voluntariado en el curso.",
        
        # 5. Resultados e Impacto
        resultado_en_beneficiarios="Mejora en 20% del nivel de lectura.",
        resultado_en_curriculo="Nuevas estrategias de enseñanza.",
        impacto_esperado="Mayor integración social.",
        
        # 8. Recursos
        rec_hum_docentes=1,
        rec_hum_estudiantes=5,
        rec_hum_administrativos=0,
        rec_mat_material_didactico="Libros y cuadernos."
    )
    if ods:
        proyecto.ods.add(ods)
        
    ProyectoAsignatura.objects.create(
        proyecto=proyecto, nombre_asignatura='Taller de Proyectos', anio_carrera=5
    )
    
    fuente, _ = FuenteFinanciamiento.objects.get_or_create(fuente='recursos_propios', proyecto=proyecto)
    PartidaPresupuestaria.objects.create(
        proyecto=proyecto, categoria='bienes', descripcion='Libros',
        cantidad=20, costo_unitario=25.00
    )
    
    ActividadProyecto.objects.create(
        proyecto=proyecto, nombre='Actividad 1 Borrador', responsable='Docente 1',
        evidencia_esperada='Fotos', url_evidencia=''
    )
    
    print("¡Proyecto borrador PRY-FULL-003 creado!")

if __name__ == '__main__':
    run()
