from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0009_eje_rsu_otro_detalle'),
    ]

    operations = [
        migrations.AddField(
            model_name='proyectorsu',
            name='es_continuacion',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='proyectorsu',
            name='proyecto_origen',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='continuaciones',
                to='proyectos.proyectorsu',
            ),
        ),
    ]
