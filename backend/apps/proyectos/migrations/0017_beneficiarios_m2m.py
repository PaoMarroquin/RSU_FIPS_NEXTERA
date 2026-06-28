from django.db import migrations, models

TIPOS = [
    ('comunidad_universitaria',  'Comunidad universitaria - interna',          1),
    ('inst_educativas_basicas',  'Instituciones Educativas Básico Regulares',  2),
    ('inst_educativas_especiales', 'Instituciones Educativas Especiales',      3),
    ('gobierno_local',           'Gobierno Local',                             4),
    ('gobierno_regional',        'Gobierno Regional',                          5),
    ('gobierno_nacional',        'Gobierno Nacional',                          6),
    ('asociaciones',             'Asociaciones',                               7),
    ('organizaciones_comunales', 'Organizaciones comunales',                   8),
    ('sector_empresarial',       'Sector empresarial',                         9),
    ('sectores_laborales',       'Sectores laborales',                        10),
    ('centros_penitenciarios',   'Centros Penitenciarios',                    11),
    ('otro',                     'Otro',                                      12),
]

FIELD_TO_CODIGO = {
    'benef_comunidad_universitaria':  'comunidad_universitaria',
    'benef_inst_educativas_basicas':  'inst_educativas_basicas',
    'benef_inst_educativas_especiales': 'inst_educativas_especiales',
    'benef_gobierno_local':           'gobierno_local',
    'benef_gobierno_regional':        'gobierno_regional',
    'benef_gobierno_nacional':        'gobierno_nacional',
    'benef_asociaciones':             'asociaciones',
    'benef_organizaciones_comunales': 'organizaciones_comunales',
    'benef_sector_empresarial':       'sector_empresarial',
    'benef_sectores_laborales':       'sectores_laborales',
    'benef_centros_penitenciarios':   'centros_penitenciarios',
    'benef_otro':                     'otro',
}


def seed_tipos(apps, schema_editor):
    TipoBeneficiario = apps.get_model('proyectos', 'TipoBeneficiario')
    for codigo, label, orden in TIPOS:
        TipoBeneficiario.objects.create(codigo=codigo, label=label, orden=orden)


def migrate_booleans(apps, schema_editor):
    ProyectoRSU = apps.get_model('proyectos', 'ProyectoRSU')
    TipoBeneficiario = apps.get_model('proyectos', 'TipoBeneficiario')
    tipo_map = {t.codigo: t for t in TipoBeneficiario.objects.all()}
    for proyecto in ProyectoRSU.objects.all():
        for field, codigo in FIELD_TO_CODIGO.items():
            if getattr(proyecto, field, False):
                proyecto.beneficiarios.add(tipo_map[codigo])


def nulls_to_empty(apps, schema_editor):
    ProyectoRSU = apps.get_model('proyectos', 'ProyectoRSU')
    ProyectoRSU.objects.filter(benef_otro_detalle__isnull=True).update(benef_otro_detalle='')


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0016_partida_fuente_fk'),
    ]

    operations = [
        migrations.CreateModel(
            name='TipoBeneficiario',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(max_length=50, unique=True)),
                ('label', models.CharField(max_length=200)),
                ('orden', models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                'verbose_name': 'Tipo de Beneficiario',
                'verbose_name_plural': 'Tipos de Beneficiario',
                'db_table': 'tipo_beneficiario',
                'ordering': ['orden'],
            },
        ),
        migrations.AddField(
            model_name='proyectorsu',
            name='beneficiarios',
            field=models.ManyToManyField(
                blank=True,
                db_table='proyecto_beneficiarios',
                help_text='1.9 Beneficiarios / Destinatarios del proyecto',
                related_name='proyectos',
                to='proyectos.tipobeneficiario',
            ),
        ),
        migrations.RunPython(seed_tipos, migrations.RunPython.noop),
        migrations.RunPython(migrate_booleans, migrations.RunPython.noop),
        migrations.RemoveField(model_name='proyectorsu', name='benef_comunidad_universitaria'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_inst_educativas_basicas'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_inst_educativas_especiales'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_gobierno_local'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_gobierno_regional'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_gobierno_nacional'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_asociaciones'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_organizaciones_comunales'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_sector_empresarial'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_sectores_laborales'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_centros_penitenciarios'),
        migrations.RemoveField(model_name='proyectorsu', name='benef_otro'),
        migrations.RunPython(nulls_to_empty, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='proyectorsu',
            name='benef_otro_detalle',
            field=models.CharField(
                blank=True,
                help_text="1.9j Detalle cuando se selecciona 'Otro'",
                max_length=500,
            ),
        ),
    ]
