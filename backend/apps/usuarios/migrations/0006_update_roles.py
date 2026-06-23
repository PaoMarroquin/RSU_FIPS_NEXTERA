from django.db import migrations, models


def update_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')

    # Rename Coordinador → Jefatura RSU
    if not Rol.objects.filter(nombre='Jefatura RSU').exists():
        Rol.objects.filter(nombre='Coordinador').update(
            nombre='Jefatura RSU',
            descripcion='Jefatura de la Unidad de Responsabilidad Social',
        )

    # Ensure Jefatura RSU exists (in case Coordinador didn't exist)
    Rol.objects.get_or_create(
        nombre='Jefatura RSU',
        defaults={
            'descripcion': 'Jefatura de la Unidad de Responsabilidad Social',
            'activo': True,
        },
    )

    # Deactivate legacy roles (preserve rows for FK integrity)
    Rol.objects.filter(nombre__in=['Comite', 'Autoridad', 'Estudiante']).update(activo=False)


def revert_roles(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Rol.objects.filter(nombre='Jefatura RSU').update(
        nombre='Coordinador',
        descripcion='Coordinador RSU de la FIPS',
    )
    Rol.objects.filter(nombre__in=['Comite', 'Autoridad', 'Estudiante']).update(activo=True)


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0005_alter_usuario_departamento_alter_usuario_escuela_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rol',
            name='nombre',
            field=models.CharField(
                choices=[
                    ('Administrador', 'Administrador'),
                    ('Docente', 'Docente'),
                    ('Jefatura RSU', 'Jefatura RSU'),
                ],
                max_length=50,
                unique=True,
            ),
        ),
        migrations.RunPython(update_roles, revert_roles),
    ]
