from django.db import migrations, models


MAPPING = {
    'movilidad':          'transporte',
    'material_educativo': 'material_escritorio',
    'equipos':            'otros',
    'alimentacion':       'refrigerio',
    'servicios':          'otros',
    'otros':              'otros',
}


def remap_categorias(apps, schema_editor):
    PartidaPresupuestaria = apps.get_model('proyectos', 'PartidaPresupuestaria')
    for old, new in MAPPING.items():
        PartidaPresupuestaria.objects.filter(categoria=old).update(categoria=new)


def revert_categorias(apps, schema_editor):
    # Reversión aproximada: todo lo que sea transporte → movilidad, etc.
    PartidaPresupuestaria = apps.get_model('proyectos', 'PartidaPresupuestaria')
    PartidaPresupuestaria.objects.filter(categoria='transporte').update(categoria='movilidad')
    PartidaPresupuestaria.objects.filter(categoria='material_escritorio').update(categoria='material_educativo')
    PartidaPresupuestaria.objects.filter(categoria='refrigerio').update(categoria='alimentacion')


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0011_unique_proyecto_escuela_periodo_anio'),
    ]

    operations = [
        migrations.RunPython(remap_categorias, revert_categorias),
        migrations.AlterField(
            model_name='partidapresupuestaria',
            name='categoria',
            field=models.CharField(
                blank=True,
                max_length=150,
                choices=[
                    ('material_escritorio', 'Material de escritorio'),
                    ('refrigerio',          'Refrigerio'),
                    ('transporte',          'Transporte'),
                    ('otros',               'Otros'),
                ],
                help_text='Categoría del gasto',
            ),
        ),
    ]
