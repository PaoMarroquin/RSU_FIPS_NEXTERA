"""
Registro de los modelos de planificacion en el panel de administracion.

Solo quedan los catalogos que el cliente gestiona desde aqui: documentos de
apoyo, ejes RSU con sus sub-items, ODS y periodos academicos. Lineas
estrategicas, objetivos, indicadores y actividades sugeridas ya no se
administran: eran parte de la matriz operativa anterior.

Conecta con:
- apps/planificacion/models.py: modelos que registra.
- config/urls.py: expone el panel en /admin/.
"""
from django.contrib import admin
from .models import (
    PeriodoAcademico,
    EjeRSU,
    EjeRSUSubitem,
    ODS,
    MatrizOperativa,
)

@admin.register(PeriodoAcademico)
class PeriodoAcademicoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'anio', 'semestre', 'fecha_inicio', 'fecha_fin', 'activo')
    list_filter = ('anio', 'semestre', 'activo')
    search_fields = ('nombre',)


class EjeRSUSubitemInline(admin.TabularInline):
    model = EjeRSUSubitem
    extra = 0
    fields = ('orden', 'clave', 'nombre', 'requiere_detalle', 'label_detalle')
    ordering = ('orden',)


@admin.register(EjeRSU)
class EjeRSUAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)
    inlines = [EjeRSUSubitemInline]


@admin.register(EjeRSUSubitem)
class EjeRSUSubitemAdmin(admin.ModelAdmin):
    list_display = ('eje_rsu', 'orden', 'clave', 'nombre', 'requiere_detalle')
    list_filter = ('eje_rsu', 'requiere_detalle')
    search_fields = ('clave', 'nombre')
    ordering = ('eje_rsu', 'orden')


@admin.register(ODS)
class ODSAdmin(admin.ModelAdmin):
    list_display = ('numero', 'nombre')
    list_filter = ('numero',)
    search_fields = ('nombre',)


@admin.register(MatrizOperativa)
class MatrizOperativaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'created_at')
    search_fields = ('nombre', 'descripcion')
