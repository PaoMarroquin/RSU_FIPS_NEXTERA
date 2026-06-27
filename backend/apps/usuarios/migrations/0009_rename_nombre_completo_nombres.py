from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0008_add_apellidos'),
    ]

    operations = [
        migrations.RenameField(
            model_name='usuario',
            old_name='nombre_completo',
            new_name='nombres',
        ),
    ]
