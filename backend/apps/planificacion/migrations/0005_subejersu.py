from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0004_update_ejes_rsu'),
    ]

    operations = [
        migrations.CreateModel(
            name='EjeRSUSubitem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clave', models.CharField(max_length=100)),
                ('nombre', models.CharField(max_length=500)),
                ('requiere_detalle', models.BooleanField(default=False)),
                ('label_detalle', models.CharField(blank=True, default='', max_length=200)),
                ('orden', models.PositiveIntegerField(default=0)),
                ('eje_rsu', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='subitems',
                    to='planificacion.ejersu',
                )),
            ],
            options={
                'verbose_name': 'Sub-ítem de Eje RSU',
                'verbose_name_plural': 'Sub-ítems de Ejes RSU',
                'db_table': 'ejes_rsu_subitems',
                'ordering': ['orden'],
                'unique_together': {('eje_rsu', 'clave')},
            },
        ),
    ]
