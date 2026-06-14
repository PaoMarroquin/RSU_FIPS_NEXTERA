from django.contrib import admin
from .models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico

# Registrar el modelo de Usuario Personalizado
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('correo_institucional', 'nombre_completo', 'rol', 'estado')
    search_fields = ('correo_institucional', 'nombre_completo')
    list_filter = ('estado', 'rol')

# Registrar los demás modelos para poder verlos y editarlos en el admin
admin.site.register(Rol)
admin.site.register(Facultad)
admin.site.register(EscuelaProfesional)
admin.site.register(DepartamentoAcademico)
