from django.contrib import admin
from .models import (
    PeriodoAcademico,
    EjeRSU,
    EjeRSUSubitem,
    ODS,
    LineaEstrategica,
    MatrizOperativa,
    ObjetivoInstitucional,
    IndicadorInstitucional,
    ActividadSugerida,
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


@admin.register(LineaEstrategica)
class LineaEstrategicaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'eje_rsu')
    list_filter = ('eje_rsu',)
    search_fields = ('nombre',)


class ObjetivoInstitucionalInline(admin.TabularInline):
    model = ObjetivoInstitucional
    extra = 1


class ActividadSugeridaInline(admin.TabularInline):
    model = ActividadSugerida
    extra = 1


@admin.register(MatrizOperativa)
class MatrizOperativaAdmin(admin.ModelAdmin):
    list_display = ('id', 'facultad', 'periodo', 'coordinador', 'presupuesto_global', 'estado')
    list_filter = ('facultad', 'periodo', 'estado')
    search_fields = ('coordinador__nombres', 'observaciones')
    inlines = [ObjetivoInstitucionalInline, ActividadSugeridaInline]


@admin.register(ObjetivoInstitucional)
class ObjetivoInstitucionalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'matriz', 'eje_rsu', 'linea_estrategica', 'meta_cuantitativa')
    list_filter = ('matriz__facultad', 'eje_rsu')
    search_fields = ('nombre', 'descripcion')


@admin.register(IndicadorInstitucional)
class IndicadorInstitucionalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'objetivo', 'unidad_medida', 'valor_meta', 'valor_alcanzado')
    search_fields = ('nombre',)


@admin.register(ActividadSugerida)
class ActividadSugeridaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'matriz', 'eje_rsu', 'anio_academico', 'tipo_actividad', 'presupuesto_ref')
    list_filter = ('matriz__facultad', 'anio_academico', 'eje_rsu')
    search_fields = ('nombre', 'tipo_actividad')
