from django.db import migrations

def seed_roles_and_facultades(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Facultad = apps.get_model('usuarios', 'Facultad')
    EscuelaProfesional = apps.get_model('usuarios', 'EscuelaProfesional')
    DepartamentoAcademico = apps.get_model('usuarios', 'DepartamentoAcademico')

    # Seed roles
    roles = [
        ('Administrador', 'Administrador del sistema'),
        ('Coordinador', 'Coordinador RSU de la FIPS'),
        ('Comite', 'Miembro del Comité RSU'),
        ('Docente', 'Docente Universitario'),
        ('Autoridad', 'Autoridad Universitaria'),
        ('Estudiante', 'Estudiante Universitario'),
    ]
    for nombre, desc in roles:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': desc, 'activo': True})

    # Seed initial Facultad, Escuela, Departamento using unique code as query key
    fips, _ = Facultad.objects.get_or_create(
        codigo='FIPS',
        defaults={'nombre': 'Facultad de Ingeniería de Producción y Servicios'}
    )
    
    EscuelaProfesional.objects.get_or_create(
        codigo='EPIS',
        defaults={
            'nombre': 'Escuela Profesional de Ingeniería de Sistemas',
            'facultad': fips
        }
    )
    
    DepartamentoAcademico.objects.get_or_create(
        codigo='DAISI',
        defaults={
            'nombre': 'Departamento Académico de Ingeniería de Sistemas e Informática',
            'facultad': fips
        }
    )

def revert_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('usuarios', '0002_sesion'),
    ]
    operations = [
        migrations.RunPython(seed_roles_and_facultades, revert_seed),
    ]
