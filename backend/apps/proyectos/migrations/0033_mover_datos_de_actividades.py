"""
Lleva a su nuevo lugar los datos de las actividades antes de quitar esos campos.

1. Responsable, fecha y evidencia esperada dejan de ser de la actividad y
   pasan a las acciones de su bloque del cronograma. Por cada actividad que
   tenía alguno de esos datos se crea una acción con ellos, ligada a la
   actividad, solo si la actividad todavía no tiene acciones.
2. Las evidencias del flujo anterior (archivo_evidencia / url_evidencia en la
   actividad) pasan a AvanceActividad + EvidenciaAvance, que es el único
   modelo de evidencias desde HU-05. El archivo no se copia: la evidencia
   nueva apunta al mismo archivo ya guardado en media/.

La operación inversa no deshace los datos: solo permite volver a la
migración anterior.
"""
import os

from django.db import migrations

DESCRIPCION_EVIDENCIA = 'Evidencia registrada con el flujo anterior de actividades.'


def _texto(valor):
    return (valor or '').strip()


def mover_datos(apps, schema_editor):
    ActividadProyecto = apps.get_model('proyectos', 'ActividadProyecto')
    CronogramaAccion = apps.get_model('proyectos', 'CronogramaAccion')
    AvanceActividad = apps.get_model('proyectos', 'AvanceActividad')
    EvidenciaAvance = apps.get_model('proyectos', 'EvidenciaAvance')

    for act in ActividadProyecto.objects.select_related('proyecto').iterator():
        responsable = _texto(act.responsable)
        evidencia = _texto(act.evidencia_esperada)
        if (responsable or evidencia or act.fecha) and not CronogramaAccion.objects.filter(
                actividad=act).exists():
            CronogramaAccion.objects.create(
                proyecto_id=act.proyecto_id, actividad=act, descripcion=act.nombre[:400],
                fecha_inicio=act.fecha, fecha_fin=act.fecha, responsable=responsable,
                evidencia_esperada=evidencia, orden=1)

        archivo = act.archivo_evidencia.name if act.archivo_evidencia else ''
        enlace = _texto(act.url_evidencia)
        if not (archivo or enlace):
            continue
        avance = AvanceActividad.objects.create(
            proyecto_id=act.proyecto_id, actividad=act, descripcion=DESCRIPCION_EVIDENCIA,
            estado_actividad=act.estado, autor_id=act.proyecto.docente_responsable_id)
        if archivo:
            EvidenciaAvance.objects.create(
                avance=avance, tipo='archivo', archivo=archivo,
                nombre=os.path.basename(archivo)[:255])
        if enlace:
            EvidenciaAvance.objects.create(
                avance=avance, tipo='enlace', enlace_drive=enlace, nombre=enlace[:255])


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0032_cronograma_por_actividad_y_finalizacion'),
    ]

    operations = [
        migrations.RunPython(mover_datos, migrations.RunPython.noop),
    ]
