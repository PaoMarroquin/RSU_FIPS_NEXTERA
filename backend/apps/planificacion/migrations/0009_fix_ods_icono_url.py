"""
Corrige la URL rota de los iconos de ODS (reportado por Maria-UNSA).

La migracion 0002_seed_ejes_ods apunto los iconos a
https://raw.githubusercontent.com/UN-SDG/SDG-Icons/... , un repositorio de
GitHub que no existe (404 verificado, tanto el repo como cualquier archivo
dentro). Como la migracion original ya se aplico en todos los entornos, se
corrige hacia adelante con una migracion de datos nueva en vez de editar la
0002.

La URL de reemplazo es del sitio oficial de la ONU (sdgs.un.org), verificada
para los 17 objetivos. Es la version en ingles: el sitio oficial no expone
un icono en espanol como archivo de imagen directo, solo paginas HTML.
"""
from django.db import migrations

NUEVA_URL = 'https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-%02d.jpg'


def fijar_url_correcta(apps, schema_editor):
    ODS = apps.get_model('planificacion', 'ODS')
    for ods in ODS.objects.all():
        ods.icono_url = NUEVA_URL % ods.numero
        ods.save(update_fields=['icono_url'])


def revertir(apps, schema_editor):
    ODS = apps.get_model('planificacion', 'ODS')
    for ods in ODS.objects.all():
        ods.icono_url = (
            f'https://raw.githubusercontent.com/UN-SDG/SDG-Icons/master/'
            f'Icons/es/SDG-{ods.numero}.png'
        )
        ods.save(update_fields=['icono_url'])


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0008_objetivonacional_objetivoregional'),
    ]

    operations = [
        migrations.RunPython(fijar_url_correcta, revertir),
    ]
