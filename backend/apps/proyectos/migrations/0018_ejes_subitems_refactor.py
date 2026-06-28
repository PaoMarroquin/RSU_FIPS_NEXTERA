from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0006_seed_sub_ejes'),
        ('proyectos', '0017_beneficiarios_m2m'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='proyectorsu',
            name='eje_rsu_subitems',
        ),
        migrations.CreateModel(
            name='ProyectoEjeSubitem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('detalle', models.TextField(blank=True, default='', help_text='Texto adicional requerido cuando sub_eje.requiere_detalle es True')),
                ('proyecto', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ejes_subitems',
                    to='proyectos.proyectorsu',
                )),
                ('sub_eje', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='selecciones',
                    to='planificacion.ejersusubitem',
                )),
            ],
            options={
                'verbose_name': 'Sub-ítem de Eje RSU del Proyecto',
                'verbose_name_plural': 'Sub-ítems de Eje RSU del Proyecto',
                'db_table': 'proyecto_ejes_subitems',
                'unique_together': {('proyecto', 'sub_eje')},
            },
        ),
    ]
