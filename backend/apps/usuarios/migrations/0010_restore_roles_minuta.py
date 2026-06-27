from django.db import migrations, models


def restore_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')

    # Rename Jefatura RSU → Coordinador (revert commit 1216630, align with Minuta MR-S3-01)
    Rol.objects.filter(nombre='Jefatura RSU').update(
        nombre='Coordinador',
        descripcion='Coordinador de la Unidad de Responsabilidad Social',
    )

    # Reactivate roles that were deactivated in migration 0006
    Rol.objects.filter(nombre__in=['Comite', 'Autoridad', 'Estudiante']).update(activo=True)

    # Ensure all 6 roles exist
    defaults = [
        ('Administrador',  'Administrador del sistema'),
        ('Coordinador',    'Coordinador de la Unidad de Responsabilidad Social'),
        ('Comite',         'Miembro del Comité RSU'),
        ('Docente',        'Docente universitario'),
        ('Autoridad',      'Autoridad universitaria (solo consulta)'),
        ('Estudiante',     'Estudiante universitario'),
    ]
    for nombre, descripcion in defaults:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion, 'activo': True})


def revert_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Rol.objects.filter(nombre='Coordinador').update(
        nombre='Jefatura RSU',
        descripcion='Jefatura de la Unidad de Responsabilidad Social',
    )
    Rol.objects.filter(nombre__in=['Comite', 'Autoridad', 'Estudiante']).update(activo=False)


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0009_rename_nombre_completo_nombres'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rol',
            name='nombre',
            field=models.CharField(
                choices=[
                    ('Administrador', 'Administrador'),
                    ('Coordinador',   'Coordinador RSU'),
                    ('Comite',        'Comité RSU'),
                    ('Docente',       'Docente'),
                    ('Autoridad',     'Autoridad Universitaria'),
                    ('Estudiante',    'Estudiante'),
                ],
                max_length=50,
                unique=True,
            ),
        ),
        migrations.RunPython(restore_roles, revert_roles),
    ]
