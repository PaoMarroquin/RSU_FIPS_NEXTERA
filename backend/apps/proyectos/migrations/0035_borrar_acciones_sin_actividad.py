from django.db import migrations


def borrar_acciones_sin_actividad(apps, schema_editor):
    """Toda acción del cronograma pertenece a una actividad (HU-05).

    Se eliminan las acciones sueltas de proyectos todavía editables; los
    proyectos en revisión o posteriores no se tocan.
    """
    CronogramaAccion = apps.get_model('proyectos', 'CronogramaAccion')
    CronogramaAccion.objects.filter(
        actividad__isnull=True, proyecto__estado__in=['borrador', 'observado'],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0034_quitar_campos_movidos_de_actividad'),
    ]

    operations = [
        migrations.RunPython(borrar_acciones_sin_actividad, migrations.RunPython.noop),
    ]
