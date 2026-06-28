from django.db import migrations

_AMBITO = 'Detallar el ámbito de intervención'

# Sub-items per axis, derived from the official OURS (UNSA) ANEXO 4 form.
# Keys match EjeRSU.nombre values seeded in migration 0002.
SUB_EJES_DATA = {
    'Gestión': [
        ('acc_amb_administrativo', 'Programa de acciones ambientales a nivel administrativo', False, '', 0),
        ('acc_amb_academico',      'Programa de acciones ambientales a nivel académico',      False, '', 1),
        ('activacion_ambiental',   'Programa de iniciativas de activación ambiental',         False, '', 2),
        ('clima_laboral',          'Acciones sobre clima laboral y cultura organizacional',   False, '', 3),
        ('inclusion_equidad',      'Inclusión y equidad social en el ámbito laboral',         False, '', 4),
        ('otro',                   'Otro (especificar)',                                       True,  'Especificar otro de Gestión', 5),
    ],
    'Formación': [
        ('etica_profesional',   'Ética en el desempeño profesional',                             False, '', 0),
        ('anticorrupcion',      'Prácticas anticorrupción en la formación profesional',           False, '', 1),
        ('inclusion_social',    'Inclusión social en la formación profesional',                   False, '', 2),
        ('equidad',             'Equidad en el desarrollo profesional',                           False, '', 3),
        ('educacion_ambiental', 'Educación ambiental relacionada al ejercicio profesional',       False, '', 4),
        ('derechos_humanos',    'Derechos Humanos en la formación profesional',                   False, '', 5),
        ('ods',                 'Objetivos de Desarrollo Sostenible (ODS) en la formación',       False, '', 6),
        ('otro',                'Otro (especificar)',                                              True,  'Especificar otro de Formación', 7),
    ],
    'Investigación': [
        ('metas_ods',             'Contribuye a alguna de las metas de los ODS',                  False, '', 0),
        ('politicas_salud',       'Contribuye a políticas de salud',                              False, '', 1),
        ('educacion',             'Contribuye a educación',                                       False, '', 2),
        ('igualdad_genero',       'Contribuye a igualdad de género',                              False, '', 3),
        ('inclusion_social',      'Contribuye a inclusión social',                                False, '', 4),
        ('justicia',              'Contribuye a justicia',                                        False, '', 5),
        ('formacion_ciudadana',   'Contribuye a formación ciudadana',                             False, '', 6),
        ('calidad_vida',          'Contribuye a mejorar calidad de vida y condiciones económicas',False, '', 7),
        ('condiciones_economicas','Contribuye a condiciones económicas',                          False, '', 8),
        ('politica_ambiental',    'Contribuye al cumplimiento de la Política Ambiental Nacional', False, '', 9),
    ],
    'Extensión': [
        ('metas_ods',          'Contribuye a alguna de las metas de los ODS',                                                                     True, 'ODS Nro.', 0),
        ('salud_educacion',    'Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia',                       True, _AMBITO, 1),
        ('formacion_ciudadana','Contribuye a la formación ciudadana',                                                                              True, _AMBITO, 2),
        ('calidad_vida',       'Contribuye a mejorar calidad de vida y condiciones económicas',                                                    True, _AMBITO, 3),
        ('politica_ambiental', 'Contribuye al cumplimiento de la Política Ambiental Nacional (MINAM)',                                             True, _AMBITO, 4),
    ],
    'Voluntariado': [
        ('iniciativas_voluntariado', 'Contribuye a la realización de iniciativas de voluntariado (evitando asistencialismo)', True, _AMBITO, 0),
    ],
}


def seed_sub_ejes(apps, schema_editor):
    eje_rsu_model = apps.get_model('planificacion', 'EjeRSU')
    subitem_model = apps.get_model('planificacion', 'EjeRSUSubitem')

    for eje_nombre, items in SUB_EJES_DATA.items():
        try:
            eje = eje_rsu_model.objects.get(nombre=eje_nombre)
        except eje_rsu_model.DoesNotExist:
            continue
        for clave, nombre, requiere_detalle, label_detalle, orden in items:
            subitem_model.objects.get_or_create(
                eje_rsu=eje,
                clave=clave,
                defaults={
                    'nombre': nombre,
                    'requiere_detalle': requiere_detalle,
                    'label_detalle': label_detalle,
                    'orden': orden,
                },
            )


def revert_seed(apps, schema_editor):
    subitem_model = apps.get_model('planificacion', 'EjeRSUSubitem')
    subitem_model.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0005_subejersu'),
    ]

    operations = [
        migrations.RunPython(seed_sub_ejes, revert_seed),
    ]
