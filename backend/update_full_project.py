import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.proyectos.models import ProyectoRSU, ActividadProyecto

def run():
    try:
        proyecto = ProyectoRSU.objects.get(codigo='PRY-FULL-002')
        
        # 1. Datos Generales
        proyecto.lugar_ejecucion = "Distrito de Cayma, Provincia de Arequipa (Colegio Nacional San Benito)"
        proyecto.tipo_actividad = ["programas_formativos", "asesoria", "acercamiento_comunidad"]
        
        # 2. Fundamentación Institucional
        proyecto.fund_por_que_grupo = "Se eligió a los estudiantes de 4to y 5to de secundaria debido al alto índice de desinformación respecto a carreras de tecnología y la brecha digital existente en el distrito de Cayma, lo que los pone en desventaja para postular a universidades."
        proyecto.fund_para_que_proyecto = "El proyecto servirá para nivelar sus conocimientos en herramientas digitales básicas y programación introductoria, orientándolos vocacionalmente hacia carreras STEM, lo cual mejora sus oportunidades de empleabilidad y éxito académico."
        proyecto.fund_mecanismo_ensenanza = "Se utilizará una metodología de aprendizaje basado en proyectos (Project-Based Learning - PBL), donde los estudiantes aprenderán haciendo a través de talleres prácticos interactivos con herramientas como Scratch y Python básico."
        
        # 3. Diagnóstico
        proyecto.diag_estado_grupo = "Actualmente los alumnos tienen acceso limitado a computadoras y carecen de competencias digitales básicas. Muchos no saben utilizar herramientas de ofimática avanzadas ni entienden los fundamentos de la lógica computacional."
        proyecto.diag_problemas_detectados = "1. Brecha digital significativa. 2. Falta de orientación vocacional en tecnología. 3. Desconocimiento de oportunidades laborales en el sector TI."
        proyecto.diag_aportes_formacion = "Nuestros estudiantes de últimos años de Ingeniería de Sistemas consolidarán sus soft-skills (comunicación, liderazgo) al enseñar y transferir conocimientos técnicos, afianzando los conceptos de la carrera mediante el servicio social."
        
        # 4. Objetivos
        proyecto.obj_mejora_curricular = "Integrar casos de estudio reales identificados en la comunidad dentro de las asignaturas de 'Taller de Proyectos' y 'Gestión de Proyectos', para que la currícula esté más alineada con la realidad social peruana."
        
        # 5. Resultados e Impacto
        proyecto.resultado_en_beneficiarios = "Los 100 escolares adquirirán habilidades comprobables en ofimática y programación básica, y al menos un 40% mostrará interés genuino en carreras STEM según las encuestas de salida."
        proyecto.resultado_en_curriculo = "Se generará un banco de problemas sociales reales que los docentes podrán incorporar en sus clases regulares como casos de estudio para semestres posteriores."
        proyecto.impacto_esperado = "Reducción de la brecha digital en el colegio intervenido e incremento en la postulación de sus alumnos a carreras tecnológicas en la UNSA a largo plazo."
        
        # 8. Recursos
        proyecto.rec_hum_docentes = 2
        proyecto.rec_hum_estudiantes = 15
        proyecto.rec_hum_administrativos = 1
        proyecto.rec_mat_material_didactico = "Kits de robótica educativa básica, manuales impresos de Python y Scratch, proyectores portátiles y laptops."
        
        proyecto.save()
        
        # Update actividades to have responsable and url_evidencia
        acts = ActividadProyecto.objects.filter(proyecto=proyecto)
        for i, act in enumerate(acts):
            act.responsable = f"Docente {i+1} y Coordinador Estudiantil"
            act.evidencia_esperada = "Fotos de asistencia, registro de firmas y link del repositorio."
            act.url_evidencia = "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsT?usp=sharing"
            act.save()
            
        print("¡El proyecto PRY-FULL-001 ha sido actualizado con contexto 100% realista y completo!")
        
    except ProyectoRSU.DoesNotExist:
        print("No se encontró el proyecto. ¿Ejecutaste el script de creación antes?")

if __name__ == "__main__":
    run()
