from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0010_continuacion_proyecto'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='proyectorsu',
            constraint=models.UniqueConstraint(
                condition=models.Q(es_continuacion=False) & ~models.Q(estado='rechazado'),
                fields=['escuela', 'periodo', 'anio_carrera'],
                name='unique_proyecto_escuela_periodo_anio',
            ),
        ),
    ]
