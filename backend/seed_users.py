from apps.usuarios.models import Usuario, Rol, DepartamentoAcademico, Facultad
from django.db import transaction

@transaction.atomic
def seed():
    print("--- 1. Limpiando usuarios antiguos (excepto Administrador) ---")
    admin_rol, _ = Rol.objects.get_or_create(nombre='Administrador', defaults={'descripcion': 'Administrador del sistema'})
    usuarios_a_eliminar = Usuario.objects.exclude(rol=admin_rol).exclude(is_superuser=True)
    count = usuarios_a_eliminar.count()
    if count > 0:
        try:
            usuarios_a_eliminar.delete()
            print(f"Se eliminaron {count} usuarios.")
        except Exception as e:
            print(f"Borrando a la fuerza o reasignando roles: {e}")
            # Si hay proyectos, reasignarlos temporalmente a admin
            admin_user = Usuario.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = Usuario.objects.filter(rol=admin_rol).first()
            
            if admin_user:
                # Update all their dependencies if needed, or just delete directly using cascade
                from apps.proyectos.models import ProyectoRSU
                from apps.planificacion.models import MatrizOperativa
                MatrizOperativa.objects.filter(coordinador__in=usuarios_a_eliminar).delete()
                ProyectoRSU.objects.filter(docente_responsable__in=usuarios_a_eliminar).delete()
                usuarios_a_eliminar.delete()
                print("Se eliminaron los usuarios y sus proyectos/matrices.")
    else:
        print("No hay usuarios que eliminar.")

    print("\n--- 2. Limpiando y creando Roles ---")
    roles_requeridos = [
        ('Administrador', 'Administrador del sistema'),
        ('Docente', 'Docente de la UNSA'),
        ('Departamento', 'Administrativo de Departamento'),
        ('Jefatura RSU', 'Jefatura de Responsabilidad Social')
    ]
    nombres_roles = [r[0] for r in roles_requeridos]
    for nombre, desc in roles_requeridos:
        rol, created = Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': desc, 'activo': True})
        if created:
            print(f"Creado rol: {nombre}")
    
    roles_extra = Rol.objects.exclude(nombre__in=nombres_roles)
    if roles_extra.exists():
        print(f"Eliminando roles extra: {list(roles_extra.values_list('nombre', flat=True))}")
        roles_extra.delete()

    print("\n--- 3. Verificando Facultades y Departamentos ---")
    # Necesitamos al menos una facultad y un departamento para las pruebas
    facultad, _ = Facultad.objects.get_or_create(nombre="Facultad de Ingeniería", codigo="FING")
    depto, _ = DepartamentoAcademico.objects.get_or_create(nombre="Departamento de Sistemas", codigo="DSIST", facultad=facultad)
    print(f"Usaremos: {facultad.nombre} -> {depto.nombre}")

    print("\n--- 4. Creando usuarios de prueba ---")
    pass_default = "123456"

    # Diccionario con data de prueba
    users_data = [
        {
            'nombres': 'Jefe RSU',
            'apellidos': 'Prueba',
            'email': 'jefe@unsa.edu.pe',
            'rol': 'Jefatura RSU',
            'depto': None
        },
        {
            'nombres': 'Admin Departamento',
            'apellidos': 'Sistemas',
            'email': 'departamento@unsa.edu.pe',
            'rol': 'Departamento',
            'depto': depto
        },
        {
            'nombres': 'Docente',
            'apellidos': 'Prueba 1',
            'email': 'docente1@unsa.edu.pe',
            'rol': 'Docente',
            'depto': depto
        },
        {
            'nombres': 'Docente',
            'apellidos': 'Prueba 2',
            'email': 'docente2@unsa.edu.pe',
            'rol': 'Docente',
            'depto': depto
        }
    ]

    for udata in users_data:
        rol_obj = Rol.objects.get(nombre=udata['rol'])
        user, created = Usuario.objects.get_or_create(
            correo_institucional=udata['email'],
            defaults={
                'nombres': udata['nombres'],
                'apellidos': udata['apellidos'],
                'rol': rol_obj,
                'departamento': udata['depto'],
                'facultad': facultad,
                'is_active': True
            }
        )
        # Always set password and save
        user.set_password(pass_default)
        # Asegurarse que tengan el rol y departamento correcto (por si ya existían)
        user.rol = rol_obj
        user.departamento = udata['depto']
        user.facultad = facultad
        user.is_active = True
        user.save()
        
        estado = "Creado" if created else "Actualizado"
        print(f"[{estado}] {udata['email']} -> Rol: {udata['rol']} | Pass: {pass_default}")

    # Verificar si hay admin
    admin_exists = Usuario.objects.filter(rol__nombre='Administrador').exists()
    if not admin_exists:
        print("\nNo se encontró un Administrador. Creando admin@unsa.edu.pe...")
        admin, _ = Usuario.objects.get_or_create(
            correo_institucional='admin@unsa.edu.pe',
            defaults={
                'nombres': 'Super',
                'apellidos': 'Admin',
                'rol': Rol.objects.get(nombre='Administrador'),
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin.set_password(pass_default)
        admin.save()
        print(f"Creado: admin@unsa.edu.pe | Pass: {pass_default}")

    print("\n--- SEED COMPLETADO EXITOSAMENTE ---")

if __name__ == '__main__':
    seed()
