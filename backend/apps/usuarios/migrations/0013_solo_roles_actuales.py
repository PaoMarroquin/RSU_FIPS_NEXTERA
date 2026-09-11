from django.db import migrations

ROLES_OBSOLETOS = ['Comite', 'Autoridad', 'Estudiante']


def aplicar_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Usuario = apps.get_model('usuarios', 'Usuario')

    # Rename Coordinador → Jefatura RSU, preserving user assignments
    Rol.objects.filter(nombre='Coordinador').update(
        nombre='Jefatura RSU',
        descripcion='Jefatura de la Unidad de Responsabilidad Social',
        activo=True,
    )

    # Ensure the 4 current roles exist
    defaults = [
        ('Administrador', 'Administrador del sistema'),
        ('Docente',       'Docente universitario'),
        ('Departamento',  'Departamento académico'),
        ('Jefatura RSU',  'Jefatura de la Unidad de Responsabilidad Social'),
    ]
    for nombre, descripcion in defaults:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion, 'activo': True})

    # Remove obsolete roles; Usuario.rol is PROTECT, so a role still in use
    # cannot be deleted — deactivate it instead
    for rol in Rol.objects.filter(nombre__in=ROLES_OBSOLETOS):
        if Usuario.objects.filter(rol=rol).exists():
            rol.activo = False
            rol.save(update_fields=['activo'])
        else:
            rol.delete()


def revertir_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Usuario = apps.get_model('usuarios', 'Usuario')

    Rol.objects.filter(nombre='Jefatura RSU').update(
        nombre='Coordinador',
        descripcion='Coordinador de la Unidad de Responsabilidad Social',
    )

    defaults = [
        ('Comite',     'Miembro del Comité RSU'),
        ('Autoridad',  'Autoridad universitaria (solo consulta)'),
        ('Estudiante', 'Estudiante universitario'),
    ]
    for nombre, descripcion in defaults:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion, 'activo': True})

    for rol in Rol.objects.filter(nombre='Departamento'):
        if not Usuario.objects.filter(rol=rol).exists():
            rol.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_alter_rol_nombre'),
    ]

    operations = [
        migrations.RunPython(aplicar_roles, revertir_roles),
    ]
