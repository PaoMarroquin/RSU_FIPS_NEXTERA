"""
Registro de los modelos de usuarios en el panel de administracion.

Permite al Administrador gestionar cuentas, roles y estructura academica sin
pasar por el frontend. Es la via de emergencia para crear el primer usuario o
corregir datos institucionales.

UsuarioAdmin cifra la contrasena al guardar si se escribio en texto plano, de
modo que un usuario creado desde el admin pueda iniciar sesion igual que uno
creado por la API.

Conecta con:
- apps/usuarios/models.py: modelos que registra.
- config/urls.py: expone el panel en /admin/.
"""
from django.contrib import admin
from .models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico

# Registrar el modelo de Usuario Personalizado
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('correo_institucional', 'nombres', 'rol', 'estado')
    search_fields = ('correo_institucional', 'nombres')
    list_filter = ('estado', 'rol')

    def save_model(self, request, obj, form, change):
        # Si la contraseña se ha modificado y no está encriptada, encriptarla
        if obj.password and not obj.password.startswith('pbkdf2_'):
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

# Registrar los demás modelos para poder verlos y editarlos en el admin
admin.site.register(Rol)
admin.site.register(Facultad)
admin.site.register(EscuelaProfesional)
admin.site.register(DepartamentoAcademico)
