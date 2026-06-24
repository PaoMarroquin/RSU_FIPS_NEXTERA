from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0006_update_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='firma_digital',
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to='firmas/',
                help_text='Firma digital del usuario (JPG/PNG)',
            ),
        ),
    ]
