from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_add_firma_digital'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='apellidos',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
