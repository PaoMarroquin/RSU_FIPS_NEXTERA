"""
Migración de datos: completa la estructura académica real de la Facultad de
Ingeniería de Producción y Servicios (FIPS) de la UNSA.

Contexto (T-XX, reunión de mejoras backend-rsu): la 0004_seed_facultades_unsa
había dejado FIPS con 5 escuelas pero solo 2 departamentos académicos
(Ingeniería de Sistemas e Informática, Ingeniería Industrial). La estructura
real de FIPS son 4 áreas/departamentos académicos:

- Ingeniería de Sistemas e Informática (Ingeniería de Sistemas + Ciencia de
  la Computación)
- Ingeniería Electrónica y Eléctrica (Ingeniería Electrónica + Ingeniería
  Eléctrica)
- Industrial (Ingeniería Industrial)
- Ingeniería Mecánica-Eléctrica (Ingeniería Mecánica)

Faltaban dos escuelas profesionales (Ingeniería Eléctrica y Ciencia de la
Computación) y el departamento de Ingeniería Mecánica-Eléctrica. Esta
migración solo agrega lo que falta; no borra ni renombra nada existente para
no afectar proyectos/usuarios ya vinculados a las escuelas/departamentos
actuales.
"""
from django.db import migrations


def seed_fips_estructura(apps, schema_editor):
    Facultad = apps.get_model('usuarios', 'Facultad')
    EscuelaProfesional = apps.get_model('usuarios', 'EscuelaProfesional')
    DepartamentoAcademico = apps.get_model('usuarios', 'DepartamentoAcademico')

    try:
        facultad = Facultad.objects.get(codigo='FIPS')
    except Facultad.DoesNotExist:
        return

    for cod_esc, nom_esc in [
        ('EPIEL', 'Ingeniería Eléctrica'),
        ('EPCC', 'Ciencia de la Computación'),
    ]:
        EscuelaProfesional.objects.get_or_create(
            codigo=cod_esc,
            defaults={'nombre': nom_esc, 'facultad': facultad},
        )

    for cod_dep, nom_dep in [
        ('DAEE', 'Ingeniería Electrónica y Eléctrica'),
        ('DAME', 'Ingeniería Mecánica-Eléctrica'),
    ]:
        DepartamentoAcademico.objects.get_or_create(
            codigo=cod_dep,
            defaults={'nombre': nom_dep, 'facultad': facultad},
        )


def revert_seed(apps, schema_editor):
    # No se revierte para no borrar datos que podrían estar en uso.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('usuarios', '0013_solo_roles_actuales'),
    ]
    operations = [
        migrations.RunPython(seed_fips_estructura, revert_seed),
    ]
