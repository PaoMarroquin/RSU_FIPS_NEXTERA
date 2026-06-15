from django.contrib import admin
from .models import ProyectoRSU, ProyectoAsignatura, ProyectoDocente

class ProyectoAsignaturaInline(admin.TabularInline):
    model = ProyectoAsignatura
    extra = 1


class ProyectoDocenteInline(admin.TabularInline):
    model = ProyectoDocente
    extra = 1


@admin.register(ProyectoRSU)
class ProyectoRSUAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'titulo', 'docente_responsable', 'periodo', 'facultad', 'escuela', 'estado', 'created_at')
    list_filter = ('estado', 'facultad', 'escuela', 'periodo', 'anio_carrera')
    search_fields = ('codigo', 'titulo', 'docente_responsable__nombre_completo', 'descripcion_general')
    filter_horizontal = ('ods',)
    inlines = [ProyectoAsignaturaInline, ProyectoDocenteInline]


@admin.register(ProyectoAsignatura)
class ProyectoAsignaturaAdmin(admin.ModelAdmin):
    list_display = ('nombre_asignatura', 'proyecto', 'codigo_asignatura', 'anio_carrera', 'semestre')
    search_fields = ('nombre_asignatura', 'codigo_asignatura')


@admin.register(ProyectoDocente)
class ProyectoDocenteAdmin(admin.ModelAdmin):
    list_display = ('docente', 'proyecto', 'rol_en_proyecto')
    list_filter = ('rol_en_proyecto',)
    search_fields = ('docente__nombre_completo',)
