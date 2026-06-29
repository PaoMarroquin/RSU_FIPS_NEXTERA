from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0019_alter_tipobeneficiario_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cronogramaaccion',
            name='mes_semana',
        ),
        migrations.AddField(
            model_name='cronogramaaccion',
            name='fecha_inicio',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cronogramaaccion',
            name='fecha_fin',
            field=models.DateField(blank=True, null=True),
        ),
    ]
