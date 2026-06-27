from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0013_financiamiento_confirmado'),
    ]

    operations = [
        migrations.RenameField(
            model_name='proyectorsu',
            old_name='eje_rsu_otro_detalle',
            new_name='eje_detalle',
        ),
    ]
