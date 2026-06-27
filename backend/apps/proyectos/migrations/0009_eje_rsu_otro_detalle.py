from django.db import migrations, models


def migrate_voluntariado(apps, schema_editor):
    EjeRSU = apps.get_model('planificacion', 'EjeRSU')
    ProyectoRSU = apps.get_model('proyectos', 'ProyectoRSU')

    otros, _ = EjeRSU.objects.get_or_create(
        nombre='Otros',
        defaults={'descripcion': 'Otro eje RSU — especificar en el campo detalle del proyecto'},
    )
    # Reasignar proyectos que apuntaban a Voluntariado
    ProyectoRSU.objects.filter(eje_rsu__nombre='Voluntariado').update(eje_rsu=otros)
    # Eliminar Voluntariado (ya sin FK activas)
    EjeRSU.objects.filter(nombre='Voluntariado').delete()


def revert_voluntariado(apps, schema_editor):
    EjeRSU = apps.get_model('planificacion', 'EjeRSU')
    EjeRSU.objects.get_or_create(
        nombre='Voluntariado',
        defaults={'descripcion': 'Voluntariado Agustino'},
    )


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0008_actividadproyecto_cronogramaaccion_and_more'),
        ('planificacion', '0004_update_ejes_rsu'),
    ]

    operations = [
        migrations.AddField(
            model_name='proyectorsu',
            name='eje_rsu_otro_detalle',
            field=models.TextField(
                blank=True,
                null=True,
                help_text="Descripción obligatoria cuando el eje RSU seleccionado es 'Otros'",
            ),
        ),
        migrations.RunPython(migrate_voluntariado, revert_voluntariado),
    ]
