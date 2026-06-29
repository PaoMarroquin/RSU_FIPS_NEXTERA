from django import forms
from django.contrib import admin

from .models import (
    ProyectoRSU, ProyectoAsignatura, ProyectoDocente,
    ActividadProyecto, CronogramaAccion,
    DocumentoSustentoProyecto, PartidaPresupuestaria, TipoBeneficiario,
    ProyectoEjeSubitem,
)

TIPO_ACTIVIDAD_CHOICES = [
    ('programas_formativos', 'Programas formativos'),
    ('acompanamiento', 'Acompañamiento a sectores identificados'),
    ('asesoria', 'Asesoría'),
    ('acercamiento_comunidad', 'Iniciativas de acercamiento a la comunidad'),
    ('otro', 'Otros (especificar)'),
]


class TipoActividadForm(forms.ModelForm):
    tipo_actividad = forms.MultipleChoiceField(
        choices=TIPO_ACTIVIDAD_CHOICES,
        widget=forms.CheckboxSelectMultiple(attrs={'style': 'columns:2;'}),
        required=False,
        label='Tipo de Actividad',
    )

    class Meta:
        model = ProyectoRSU
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['tipo_actividad'].initial = self.instance.tipo_actividad or []

    def clean(self):
        cleaned_data = super().clean()
        cleaned_data['tipo_actividad'] = cleaned_data.get('tipo_actividad', []) or []
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.tipo_actividad = self.cleaned_data.get('tipo_actividad', []) or []
        if commit:
            instance.save()
            self.save_m2m()
        return instance


class ProyectoAsignaturaInline(admin.TabularInline):
    model = ProyectoAsignatura
    extra = 1
    fields = ('nombre_asignatura', 'codigo_asignatura', 'anio_carrera', 'semestre')
    verbose_name = "Asignatura"
    verbose_name_plural = "── I. (1.5) Asignaturas participantes en el proyecto"


class ProyectoDocenteInline(admin.TabularInline):
    model = ProyectoDocente
    extra = 1
    fields = ('docente', 'rol_en_proyecto')
    verbose_name = "Docente adicional"
    verbose_name_plural = "── I. Docentes adicionales al responsable"


class EjesSubitemsInline(admin.TabularInline):
    model = ProyectoEjeSubitem
    extra = 1
    fields = ('sub_eje', 'detalle')
    verbose_name = "Sub-ítem de Eje RSU"
    verbose_name_plural = "── I. (1.10) Sub-ítems del Eje RSU seleccionado"


class ActividadProyectoInline(admin.TabularInline):
    model = ActividadProyecto
    extra = 1
    fields = ('orden', 'nombre', 'descripcion', 'curso_vinculado', 'responsable', 'fecha', 'evidencia_esperada')
    ordering = ['orden']
    verbose_name = "Actividad"
    verbose_name_plural = "── VI. Actividades"


class CronogramaAccionInline(admin.TabularInline):
    model = CronogramaAccion
    extra = 1
    fields = ('orden', 'descripcion', 'fecha_inicio', 'fecha_fin', 'responsable', 'estado_avance')
    ordering = ['orden']
    verbose_name = "Acción"
    verbose_name_plural = "── VII. Cronograma de acciones"


class DocumentoSustentoProyectoInline(admin.TabularInline):
    model = DocumentoSustentoProyecto
    extra = 1
    fields = ('nombre', 'archivo')
    verbose_name = "Documento"
    verbose_name_plural = "IX. Documentos adjuntos (PDF, Word, Excel — máx. 10MB)"


@admin.register(ProyectoRSU)
class ProyectoRSUAdmin(admin.ModelAdmin):
    form = TipoActividadForm

    class Media:
        js = ('proyectos/js/admin_subitems.js',)

    list_display = (
        'codigo', 'titulo', 'docente_responsable',
        'periodo', 'facultad', 'estado', 'created_at',
    )
    list_filter = (
        'estado', 'facultad', 'escuela',
        'periodo', 'eje_rsu', 'anio_carrera',
    )
    search_fields = (
        'codigo', 'titulo',
        'docente_responsable__nombres',
    )
    filter_horizontal = ('ods', 'beneficiarios')
    readonly_fields = (
        'codigo', 'created_at', 'updated_at',
        'fecha_envio_revision', 'fecha_aprobacion',
        'fecha_inicio_ejecucion', 'fecha_cierre',
    )

    inlines = [
        ProyectoAsignaturaInline,
        ProyectoDocenteInline,
        EjesSubitemsInline,
        ActividadProyectoInline,
        CronogramaAccionInline,
        DocumentoSustentoProyectoInline,
    ]

    fieldsets = (
        ('Identificación', {
            'fields': ('codigo', 'estado', 'presentado_con_anticipacion'),
        }),
        ('I. Datos Generales', {
            'fields': (
                'facultad', 'escuela', 'departamento', 'semestre_academico',
                'titulo', 'nro_docentes', 'nro_estudiantes', 'lugar_ejecucion',
                'beneficiarios', 'benef_otro_detalle',
                'eje_rsu', 'eje_detalle',
                'linea_estrategica', 'objetivo_institucional', 'ods',
                'tipo_actividad', 'tipo_actividad_otro',
                'meta_cuantitativa', 'indicador',
                'fecha_inicio', 'fecha_evaluacion_avance', 'fecha_termino',
                'fecha_encuesta_docentes', 'fecha_encuesta_alumnos', 'fecha_encuesta_grupo_destinatario',
                'periodo', 'docente_responsable', 'anio_carrera', 'es_tesis_quinto_anio',
            ),
        }),
        ('II. Fundamentación', {
            'classes': ('collapse',),
            'fields': ('fund_por_que_grupo', 'fund_para_que_proyecto', 'fund_mecanismo_ensenanza'),
        }),
        ('III. Diagnóstico Situacional', {
            'classes': ('collapse',),
            'fields': (
                'diag_estado_grupo', 'diag_problemas_detectados',
                'diag_aportes_formacion', 'diag_justificacion_intervencion',
            ),
        }),
        ('IV. Objetivos', {
            'classes': ('collapse',),
            'fields': ('obj_logro_intervencion', 'obj_mejora_curricular'),
        }),
        ('V. Resultados Esperados', {
            'classes': ('collapse',),
            'fields': ('resultado_en_beneficiarios', 'resultado_en_curriculo', 'impacto_esperado'),
        }),
        ('VI. Actividades', {'classes': ('collapse',), 'fields': ()}),
        ('VII. Cronograma', {'classes': ('collapse',), 'fields': ()}),
        ('VIII. Recursos', {
            'classes': ('collapse',),
            'fields': (
                'rec_hum_docentes', 'rec_hum_administrativos', 'rec_hum_estudiantes',
                'rec_hum_egresados', 'rec_hum_voluntarios', 'rec_hum_otros',
                'rec_mat_material_didactico', 'rec_mat_afiches', 'rec_mat_equipos',
                'rec_mat_utiles', 'rec_mat_otros',
            ),
        }),
        ('IX. Financiamiento', {
            'classes': ('collapse',),
            'fields': (
                'monto_financiamiento', 'fuente_financiamiento',
                'descripcion_gastos', 'observaciones_financiamiento',
            ),
        }),
        ('Informe Final', {
            'classes': ('collapse',),
            'fields': ('conclusiones', 'recomendaciones', 'lecciones_aprendidas', 'medio_difusion'),
        }),
        ('Trazabilidad', {
            'classes': ('collapse',),
            'fields': (
                'created_at', 'updated_at',
                'fecha_envio_revision', 'fecha_aprobacion',
                'fecha_inicio_ejecucion', 'fecha_cierre',
            ),
        }),
    )


@admin.register(ProyectoAsignatura)
class ProyectoAsignaturaAdmin(admin.ModelAdmin):
    list_display = ('nombre_asignatura', 'proyecto', 'codigo_asignatura', 'anio_carrera', 'semestre')
    search_fields = ('nombre_asignatura', 'codigo_asignatura')


@admin.register(ProyectoDocente)
class ProyectoDocenteAdmin(admin.ModelAdmin):
    list_display = ('docente', 'proyecto', 'rol_en_proyecto')
    list_filter = ('rol_en_proyecto',)
    search_fields = ('docente__nombres',)


@admin.register(ActividadProyecto)
class ActividadProyectoAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'orden', 'nombre', 'fecha', 'responsable')
    ordering = ['proyecto', 'orden']


@admin.register(CronogramaAccion)
class CronogramaAccionAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'orden', 'descripcion', 'fecha_inicio', 'fecha_fin', 'estado_avance')
    list_filter = ('estado_avance',)
    ordering = ['proyecto', 'orden']


@admin.register(PartidaPresupuestaria)
class PartidaPresupuestariaAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'categoria', 'descripcion', 'cantidad', 'costo_unitario', 'monto_ejecutado', 'fuente')
    list_filter = ('categoria', 'tipo_recurso', 'fuente')
    ordering = ['proyecto', 'orden']


@admin.register(DocumentoSustentoProyecto)
class DocumentoSustentoProyectoAdmin(admin.ModelAdmin):
    list_display = ('id', 'proyecto', 'nombre', 'uploaded_at')
    search_fields = ('nombre', 'proyecto__codigo')


@admin.register(TipoBeneficiario)
class TipoBeneficiarioAdmin(admin.ModelAdmin):
    list_display = ('orden', 'codigo', 'label')
    ordering = ['orden']
