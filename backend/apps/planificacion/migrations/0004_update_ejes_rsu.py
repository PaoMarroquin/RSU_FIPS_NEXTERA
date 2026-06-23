from django.db import migrations


def add_otros_eje(apps, schema_editor):
    EjeRSU = apps.get_model('planificacion', 'EjeRSU')
    EjeRSU.objects.get_or_create(
        nombre='Otros',
        defaults={'descripcion': 'Otro eje RSU — especificar en el campo detalle del proyecto'},
    )


def remove_otros_eje(apps, schema_editor):
    EjeRSU = apps.get_model('planificacion', 'EjeRSU')
    EjeRSU.objects.filter(nombre='Otros').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0003_alter_matrizoperativa_estado_and_more'),
    ]

    operations = [
        migrations.RunPython(add_otros_eje, remove_otros_eje),
    ]
