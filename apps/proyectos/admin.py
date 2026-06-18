import json
from django import forms
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import (
    ProyectoRSU, ProyectoAsignatura, ProyectoDocente,
    ObjetivoEspecifico, ActividadProyecto, CronogramaAccion,
    DocumentoSustentoProyecto,
)


# ══════════════════════════════════════════════════════════════════════════════
# WIDGET PERSONALIZADO — Eje RSU con sub-ítems como checkboxes agrupados
# Resuelve el problema del JSONField que mostraba solo un textarea
# ══════════════════════════════════════════════════════════════════════════════

EJE_RSU_SUBITEMS_CONFIG = {
    'gestion': {
        'label': 'GESTIÓN — Impacto Interno Institucional',
        'items': [
            ('acc_amb_administrativo',  'Programa de acciones ambientales a nivel administrativo'),
            ('acc_amb_academico',       'Programa de acciones ambientales a nivel académico'),
            ('activacion_ambiental',    'Programa de iniciativas de activación ambiental'),
            ('clima_laboral',           'Acciones sobre clima laboral y cultura organizacional'),
            ('inclusion_equidad',       'Inclusión y equidad social en el ámbito laboral'),
            ('otro',                    'Otro (especificar)'),
        ],
        'tiene_otro': True,
        'tiene_detalle': False,
    },
    'formacion': {
        'label': 'FORMACIÓN — Impacto Interno Estudiantes',
        'items': [
            ('etica_profesional',       'Ética en el desempeño profesional'),
            ('anticorrupcion',          'Prácticas anticorrupción'),
            ('inclusion_social',        'Inclusión social'),
            ('equidad',                 'Equidad en el desarrollo profesional'),
            ('educacion_ambiental',     'Educación ambiental'),
            ('derechos_humanos',        'Derechos Humanos'),
            ('ods',                     'Objetivos de Desarrollo Sostenible (ODS)'),
            ('otro',                    'Otro (especificar)'),
        ],
        'tiene_otro': True,
        'tiene_detalle': False,
    },
    'investigacion': {
        'label': 'INVESTIGACIÓN — Impacto Interno Estudiantes',
        'items': [
            ('metas_ods',               'Contribuye a metas de los ODS'),
            ('politicas_salud',         'Contribuye a políticas de salud'),
            ('educacion',               'Contribuye a educación'),
            ('igualdad_genero',         'Contribuye a igualdad de género'),
            ('inclusion_social',        'Contribuye a inclusión social'),
            ('justicia',                'Contribuye a justicia'),
            ('formacion_ciudadana',     'Contribuye a formación ciudadana'),
            ('calidad_vida',            'Contribuye a calidad de vida'),
            ('condiciones_economicas',  'Contribuye a condiciones económicas'),
            ('politica_ambiental',      'Contribuye a Política Ambiental Nacional'),
        ],
        'tiene_otro': False,
        'tiene_detalle': False,
    },
    'extension': {
        'label': 'EXTENSIÓN — Impacto Externo',
        'items': [
            ('metas_ods',               'Contribuye a metas de los ODS (indicar número de ODS)'),
            ('salud',                   'Contribuye a salud'),
            ('educacion',               'Contribuye a educación'),
            ('igualdad_genero',         'Contribuye a igualdad de género'),
            ('inclusion_social',        'Contribuye a inclusión social'),
            ('justicia',                'Contribuye a justicia'),
            ('formacion_ciudadana',     'Contribuye a formación ciudadana'),
            ('calidad_vida',            'Contribuye a calidad de vida'),
            ('condiciones_economicas',  'Contribuye a condiciones económicas'),
            ('politica_ambiental',      'Contribuye a Política Ambiental Nacional'),
        ],
        'tiene_otro': False,
        'tiene_detalle': True,   # campo "Detalle del ámbito de intervención"
    },
    'voluntariado': {
        'label': 'VOLUNTARIADO',
        'items': [
            ('iniciativas_voluntariado', 'Contribuye a iniciativas de voluntariado (evitando asistencialismo)'),
        ],
        'tiene_otro': False,
        'tiene_detalle': True,   # campo "Detalle del ámbito de intervención"
    },
}

BENEFICIARIOS_CHOICES = [
    ('benef_comunidad_universitaria', 'Comunidad universitaria interna'),
    ('benef_inst_educativas_basicas', 'Instituciones Educativas Básicas Regulares'),
    ('benef_inst_educativas_especiales', 'Instituciones Educativas Especiales'),
    ('benef_gobierno_local', 'Gobierno Local'),
    ('benef_gobierno_regional', 'Gobierno Regional'),
    ('benef_gobierno_nacional', 'Gobierno Nacional'),
    ('benef_asociaciones', 'Asociaciones'),
    ('benef_organizaciones_comunales', 'Organizaciones comunales'),
    ('benef_sector_empresarial', 'Sector empresarial'),
    ('benef_sectores_laborales', 'Sectores laborales'),
    ('benef_centros_penitenciarios', 'Centros penitenciarios'),
    ('benef_otro', 'Otro (especificar)'),
]

TIPO_ACTIVIDAD_CHOICES = [
    ('programas_formativos', 'Programas formativos'),
    ('acompanamiento', 'Acompañamiento a sectores identificados'),
    ('asesoria', 'Asesoría'),
    ('acercamiento_comunidad', 'Iniciativas de acercamiento a la comunidad'),
    ('otro', 'Otros (especificar)'),
]


class EjeRSUSubitemsWidget(forms.Widget):
    """
    Widget que renderiza el JSONField eje_rsu_subitems como checkboxes
    agrupados por eje (Gestión, Formación, Investigación, Extensión, Voluntariado).
    Cada grupo es un <details><summary> para que sea colapsable.
    """

    def render(self, name, value, attrs=None, renderer=None):
        # Parsear el valor actual
        if isinstance(value, str):
            try:
                data = json.loads(value) if value else {}
            except (json.JSONDecodeError, ValueError):
                data = {}
        elif isinstance(value, dict):
            data = value
        else:
            data = {}

        html_parts = ['<div style="border:1px solid #ddd; border-radius:4px; padding:8px;">']

        for eje_key, config in EJE_RSU_SUBITEMS_CONFIG.items():
            selected_items = data.get(eje_key, [])
            if isinstance(selected_items, bool):
                selected_items = [eje_key] if selected_items else []

            otro_desc   = data.get(f'{eje_key}_otro_descripcion', '')
            detalle_val = data.get(f'{eje_key}_ambito_detalle', '')
            ods_nums    = data.get('extension_ods_numeros', '') if eje_key == 'extension' else ''

            # Abrir bloque colapsable
            html_parts.append(
                f'<details style="margin-bottom:6px; border:1px solid #ccc; '
                f'border-radius:3px; padding:6px;">'
                f'<summary style="font-weight:bold; cursor:pointer; padding:4px;">'
                f'{config["label"]}</summary>'
                f'<div style="padding:8px;">'
            )

            for item_key, item_label in config['items']:
                checked = 'checked' if item_key in selected_items else ''
                cb_name = f'{name}__{eje_key}__{item_key}'
                html_parts.append(
                    f'<label style="display:block; margin:3px 0;">'
                    f'<input type="checkbox" name="{cb_name}" value="1" {checked} '
                    f'style="margin-right:6px;">{item_label}</label>'
                )

            # Campo "Otro — especificar" si aplica
            if config['tiene_otro']:
                html_parts.append(
                    f'<div style="margin-top:6px;">'
                    f'<label style="display:block; font-size:0.9em; color:#555;">'
                    f'Descripción del "Otro":</label>'
                    f'<input type="text" name="{name}__{eje_key}__otro_descripcion" '
                    f'value="{otro_desc}" style="width:100%; padding:4px; '
                    f'border:1px solid #ccc; border-radius:3px;">'
                    f'</div>'
                )

            # ODS números para extensión
            if eje_key == 'extension':
                html_parts.append(
                    f'<div style="margin-top:6px;">'
                    f'<label style="display:block; font-size:0.9em; color:#555;">'
                    f'Números de ODS (ej: 3, 4, 11):</label>'
                    f'<input type="text" name="{name}__extension_ods_numeros" '
                    f'value="{ods_nums}" style="width:100%; padding:4px; '
                    f'border:1px solid #ccc; border-radius:3px;">'
                    f'</div>'
                )

            # Campo "Detalle del ámbito" para extensión y voluntariado
            if config['tiene_detalle']:
                html_parts.append(
                    f'<div style="margin-top:6px;">'
                    f'<label style="display:block; font-size:0.9em; color:#555;">'
                    f'Detalle del ámbito de intervención:</label>'
                    f'<textarea name="{name}__{eje_key}__ambito_detalle" rows="2" '
                    f'style="width:100%; padding:4px; border:1px solid #ccc; '
                    f'border-radius:3px;">{detalle_val}</textarea>'
                    f'</div>'
                )

            html_parts.append('</div></details>')

        html_parts.append('</div>')
        return mark_safe(''.join(html_parts))

    def value_from_datadict(self, data, files, name):
        """
        Reconstruye el JSON a partir de los checkboxes enviados en el POST.
        """
        result = {}
        for eje_key, config in EJE_RSU_SUBITEMS_CONFIG.items():
            selected = []
            for item_key, _ in config['items']:
                cb_name = f'{name}__{eje_key}__{item_key}'
                if data.get(cb_name):
                    selected.append(item_key)
            if selected:
                result[eje_key] = selected

            if config['tiene_otro']:
                desc_key = f'{name}__{eje_key}__otro_descripcion'
                val = data.get(desc_key, '').strip()
                if val:
                    result[f'{eje_key}_otro_descripcion'] = val

            if config['tiene_detalle']:
                det_key = f'{name}__{eje_key}__ambito_detalle'
                val = data.get(det_key, '').strip()
                if val:
                    result[f'{eje_key}_ambito_detalle'] = val

        ods_nums = data.get(f'{name}__extension_ods_numeros', '').strip()
        if ods_nums:
            result['extension_ods_numeros'] = ods_nums

        return json.dumps(result, ensure_ascii=False)


class ProyectoRSUForm(forms.ModelForm):
    beneficiarios = forms.MultipleChoiceField(
        choices=BENEFICIARIOS_CHOICES,
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'vCheckboxSelectMultiple', 'style': 'columns:2;'}),
        required=False,
        label='Beneficiarios / Destinatarios',
        help_text='Selecciona todos los beneficiarios y destinatarios aplicables.',
    )
    tipo_actividad = forms.MultipleChoiceField(
        choices=TIPO_ACTIVIDAD_CHOICES,
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'vCheckboxSelectMultiple', 'style': 'columns:2;'}),
        required=False,
        label='Tipo de Actividad',
        help_text='Selecciona todos los tipos de actividad aplicables.',
    )

    class Meta:
        model = ProyectoRSU
        exclude = [
            'benef_comunidad_universitaria', 'benef_inst_educativas_basicas',
            'benef_inst_educativas_especiales', 'benef_gobierno_local',
            'benef_gobierno_regional', 'benef_gobierno_nacional',
            'benef_asociaciones', 'benef_organizaciones_comunales',
            'benef_sector_empresarial', 'benef_sectores_laborales',
            'benef_centros_penitenciarios', 'benef_otro',
        ]
        widgets = {
            'eje_rsu_subitems': EjeRSUSubitemsWidget(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            self.fields['beneficiarios'].initial = [
                key for key, _label in BENEFICIARIOS_CHOICES
                if getattr(self.instance, key, False)
            ]
            self.fields['tipo_actividad'].initial = self.instance.tipo_actividad or []

    def clean(self):
        cleaned_data = super().clean()
        beneficiarios = cleaned_data.get('beneficiarios', []) or []
        tipo_actividad = cleaned_data.get('tipo_actividad', []) or []

        for key, _label in BENEFICIARIOS_CHOICES:
            cleaned_data[key] = key in beneficiarios

        cleaned_data['benef_otro'] = 'benef_otro' in beneficiarios
        cleaned_data['tipo_actividad'] = tipo_actividad

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)

        beneficiarios = self.cleaned_data.get('beneficiarios', []) or []
        for key, _label in BENEFICIARIOS_CHOICES:
            setattr(instance, key, key in beneficiarios)
        instance.tipo_actividad = self.cleaned_data.get('tipo_actividad', []) or []

        if commit:
            instance.save()
            self.save_m2m()

        return instance


# ══════════════════════════════════════════════════════════════════════════════
# INLINES — cada uno va en su sección correcta
# Limitación de Django admin: los inlines SIEMPRE aparecen después de los
# fieldsets. Para indicar a qué sección pertenecen, el verbose_name_plural
# lleva el número de sección como prefijo visual.
# ══════════════════════════════════════════════════════════════════════════════

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


class ObjetivoEspecificoInline(admin.TabularInline):
    model = ObjetivoEspecifico
    extra = 1
    fields = ('orden', 'descripcion')
    ordering = ['orden']
    verbose_name = "Objetivo específico"
    verbose_name_plural = "── IV. Objetivos específicos (orden = número del objetivo: 1, 2, 3…)"


class ActividadProyectoInline(admin.TabularInline):
    model = ActividadProyecto
    extra = 1
    fields = ('orden', 'nombre', 'descripcion', 'curso_vinculado',
              'responsable', 'fecha', 'evidencia_esperada')
    ordering = ['orden']
    verbose_name = "Actividad"
    verbose_name_plural = "VI. Actividades (orden = secuencia en el informe: 1, 2, 3…)"


class CronogramaAccionInline(admin.TabularInline):
    model = CronogramaAccion
    extra = 1
    fields = ('orden', 'descripcion', 'mes_semana', 'responsable', 'estado_avance')
    ordering = ['orden']
    verbose_name = "Acción"
    verbose_name_plural = "VII. Cronograma de acciones (orden = secuencia en la tabla: 1, 2, 3…)"


class DocumentoSustentoProyectoInline(admin.TabularInline):
    model = DocumentoSustentoProyecto
    extra = 1
    fields = ('nombre', 'archivo')
    verbose_name = "Documento"
    verbose_name_plural = "IX. Documentos adjuntos (PDF, Word, Excel — máx. 10MB)"


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

@admin.register(ProyectoRSU)
class ProyectoRSUAdmin(admin.ModelAdmin):
    form = ProyectoRSUForm

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
        'docente_responsable__nombre_completo',
    )
    filter_horizontal = ('ods',)
    readonly_fields = (
        'codigo', 'created_at', 'updated_at',
        'fecha_envio_revision', 'fecha_aprobacion',
        'fecha_inicio_ejecucion', 'fecha_cierre',
    )

    # Inlines: siempre aparecen al final en Django admin.
    # El verbose_name_plural indica visualmente a qué sección pertenece cada uno.
    inlines = [
        ProyectoAsignaturaInline,         # I (1.5)
        ProyectoDocenteInline,            # I (docentes adicionales)
        ObjetivoEspecificoInline,         # IV
        ActividadProyectoInline,          # VI
        CronogramaAccionInline,           # VII
        DocumentoSustentoProyectoInline,  # IX
    ]

    fieldsets = (

        # ── IDENTIFICACIÓN ────────────────────────────────────────────────────
        ('Identificación', {
            'description': 'Código asignado por la comisión OURS una vez consolidados todos los proyectos.',
            'fields': ('codigo', 'estado', 'presentado_con_anticipacion'),
        }),

        # ── I. DATOS GENERALES ────────────────────────────────────────────────
        # Todo el punto I junto: 1.1 → 1.18
        # Las asignaturas (1.5) y docentes adicionales están en los inlines de abajo
        # marcados con "── I."
        ('I. Datos Generales', {
            'description': (
                'Completa todos los campos del punto I del Formato OURS. '
                'Las asignaturas participantes (1.5) y docentes adicionales '
                'están en las tablas al final de la página, marcadas con "── I."'
            ),
            'fields': (
                # 1.1 – 1.4
                'facultad',
                'escuela',
                'departamento',
                'semestre_academico',
                # 1.6
                'titulo',
                # 1.7 – 1.8
                'nro_docentes',
                'nro_estudiantes',
                # 1.18
                'lugar_ejecucion',
                # 1.9  Beneficiarios / Destinatarios (checkboxes agrupados)
                'beneficiarios',
                'benef_otro_detalle',
                # 1.10  Eje RSU — widget con checkboxes agrupados por eje
                'eje_rsu',
                'eje_rsu_subitems',
                'linea_estrategica',
                'objetivo_institucional',
                'ods',
                # 1.11  Tipo de actividad (checkboxes agrupados)
                'tipo_actividad',
                'tipo_actividad_otro',
                # 1.12 – 1.13
                'meta_cuantitativa',
                'indicador',
                # 1.14 – 1.16  Fechas del proyecto
                'fecha_inicio',
                'fecha_evaluacion_avance',
                'fecha_termino',
                # 1.17  Encuestas
                'fecha_encuesta_docentes',
                'fecha_encuesta_alumnos',
                'fecha_encuesta_grupo_destinatario',
                # Clasificación académica
                'periodo',
                'docente_responsable',
                'anio_carrera',
                'es_tesis_quinto_anio',
            ),
        }),

        # ── II. FUNDAMENTACIÓN ────────────────────────────────────────────────
        ('II. Fundamentación', {
            'classes': ('collapse',),
            'description': (
                '¿Por qué se eligió el grupo beneficiario? '
                '¿Para qué servirá el proyecto? '
                '¿Cuál será el mecanismo de enseñanza-aprendizaje?'
            ),
            'fields': (
                'fund_por_que_grupo',
                'fund_para_que_proyecto',
                'fund_mecanismo_ensenanza',
            ),
        }),

        # ── III. DIAGNÓSTICO SITUACIONAL ──────────────────────────────────────
        ('III. Diagnóstico Situacional', {
            'classes': ('collapse',),
            'description': (
                '¿En qué estado encontramos al grupo beneficiario? '
                '¿Qué problemas detectamos? '
                '¿Qué aportes podemos realizar desde la formación profesional?'
            ),
            'fields': (
                'diag_estado_grupo',
                'diag_problemas_detectados',
                'diag_aportes_formacion',
                'diag_justificacion_intervencion',
            ),
        }),

        ('IV. Objetivos', {
            'classes': ('collapse',),
            'description': (
                'Escribe el objetivo general aquí. '
                'Los objetivos específicos (OE1, OE2…) se administran en la tabla '
                '"IV. Objetivos específicos" abajo.'
            ),
            'fields': ('objetivo_general',),
        }),

        # ── V. RESULTADOS ESPERADOS ───────────────────────────────────────────
        ('V. Resultados Esperados', {
            'classes': ('collapse',),
            'description': (
                '¿Qué logros se esperan en los beneficiarios? '
                '¿Qué mejoras en el proceso curricular?'
            ),
            'fields': (
                'resultado_en_beneficiarios',
                'resultado_en_curriculo',
                'impacto_esperado',
            ),
        }),

        ('VI. Actividades', {
            'classes': ('collapse',),
            'description': (
                'Sección 6 de 9: Defina las actividades a desarrollar en el proyecto. '
                'Las actividades se administran en la tabla "── VI. Actividades" abajo.'
            ),
            'fields': (),
        }),

        ('VII. Cronograma', {
            'classes': ('collapse',),
            'description': (
                'Sección 7 de 9: Distribuya las acciones a lo largo del periodo de ejecución. '
                'El cronograma se administra en la tabla "── VII. Cronograma de acciones" abajo.'
            ),
            'fields': (),
        }),

        # ── VIII. RECURSOS ────────────────────────────────────────────────────
        ('VIII. Recursos', {
            'classes': ('collapse',),
            'fields': (
                'rec_hum_docentes',
                'rec_hum_administrativos',
                'rec_hum_estudiantes',
                'rec_hum_egresados',
                'rec_hum_voluntarios',
                'rec_hum_otros',
                'rec_mat_material_didactico',
                'rec_mat_afiches',
                'rec_mat_equipos',
                'rec_mat_utiles',
                'rec_mat_otros',
            ),
        }),

        # ── IX. FINANCIAMIENTO ────────────────────────────────────────────────
        ('IX. Financiamiento', {
            'classes': ('collapse',),
            'description': (
                'Monto aproximado del costo del proyecto. '
                'Los documentos adjuntos están en la tabla '
                '"IX. Documentos adjuntos" abajo.'
            ),
            'fields': (
                'monto_financiamiento',
                'fuente_financiamiento',
                'descripcion_gastos',
                'observaciones_financiamiento',
            ),
        }),

        # ── INFORME FINAL (sprint posterior) ──────────────────────────────────
        ('Informe Final', {
            'classes': ('collapse',),
            'fields': (
                'conclusiones',
                'recomendaciones',
                'lecciones_aprendidas',
                'medio_difusion',
            ),
        }),

        # ── TRAZABILIDAD ──────────────────────────────────────────────────────
        ('Trazabilidad', {
            'classes': ('collapse',),
            'fields': (
                'created_at', 'updated_at',
                'fecha_envio_revision', 'fecha_aprobacion',
                'fecha_inicio_ejecucion', 'fecha_cierre',
            ),
        }),
    )


# ══════════════════════════════════════════════════════════════════════════════
# ADMINS SECUNDARIOS
# ══════════════════════════════════════════════════════════════════════════════

@admin.register(ProyectoAsignatura)
class ProyectoAsignaturaAdmin(admin.ModelAdmin):
    list_display = ('nombre_asignatura', 'proyecto', 'codigo_asignatura',
                    'anio_carrera', 'semestre')
    search_fields = ('nombre_asignatura', 'codigo_asignatura')


@admin.register(ProyectoDocente)
class ProyectoDocenteAdmin(admin.ModelAdmin):
    list_display = ('docente', 'proyecto', 'rol_en_proyecto')
    list_filter = ('rol_en_proyecto',)
    search_fields = ('docente__nombre_completo',)


@admin.register(ObjetivoEspecifico)
class ObjetivoEspecificoAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'orden', 'descripcion')
    list_filter = ('proyecto__estado',)
    ordering = ['proyecto', 'orden']


@admin.register(ActividadProyecto)
class ActividadProyectoAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'orden', 'nombre', 'responsable', 'fecha')
    list_filter = ('proyecto__estado',)
    ordering = ['proyecto', 'orden']


@admin.register(CronogramaAccion)
class CronogramaAccionAdmin(admin.ModelAdmin):
    list_display = ('proyecto', 'orden', 'descripcion',
                    'mes_semana', 'responsable', 'estado_avance')
    list_filter = ('estado_avance', 'proyecto__estado')
    ordering = ['proyecto', 'orden']


@admin.register(DocumentoSustentoProyecto)
class DocumentoSustentoProyectoAdmin(admin.ModelAdmin):
    list_display = ('id', 'proyecto', 'nombre', 'uploaded_at')
    search_fields = ('nombre', 'proyecto__codigo')