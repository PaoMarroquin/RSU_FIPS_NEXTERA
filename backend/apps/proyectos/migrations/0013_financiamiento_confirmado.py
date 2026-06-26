from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0012_categorias_genericas_presupuesto'),
    ]

    operations = [
        migrations.AddField(
            model_name='proyectorsu',
            name='financiamiento_confirmado',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='proyectorsu',
            name='financiamiento_fecha_confirmacion',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
