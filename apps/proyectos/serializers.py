from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum, F
from .models import (
    ProyectoRSU, ProyectoAsignatura, ProyectoDocente,
    ObjetivoEspecifico, FaseProyecto, TareaProyecto,
    DocumentoSustentoProyecto, PartidaPresupuestaria, MetaIndicadorProyecto,
)
from apps.planificacion.models import ODS, EjeRSU, LineaEstrategica, ObjetivoInstitucional, PeriodoAcademico
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico


# ──────────────────────────────────────────────────────────────────────────────
# Nested serializers
# ──────────────────────────────────────────────────────────────────────────────

class ProyectoAsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProyectoAsignatura
        fields = ['id', 'nombre_asignatura', 'codigo_asignatura', 'anio_carrera', 'semestre']


class ProyectoDocenteSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.CharField(source='docente.nombre_completo', read_only=True)
    docente_correo = serializers.CharField(source='docente.correo_institucional', read_only=True)

    class Meta:
        model = ProyectoDocente
        fields = ['id', 'docente', 'docente_nombre', 'docente_correo', 'rol_en_proyecto']


class ObjetivoEspecificoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjetivoEspecifico
        fields = ['id', 'descripcion', 'orden']


class TareaProyectoSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(
        source='responsable.nombre_completo', read_only=True)

    class Meta:
        model = TareaProyecto
        fields = [
            'id', 'nombre', 'descripcion', 'fecha_inicio', 'fecha_fin',
            'estado', 'porcentaje_avance',
            'responsable', 'responsable_nombre',
            'lugar_ejecucion', 'tipo_actividad', 'aplica_encuesta',
        ]

    def validate_porcentaje_avance(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError('El porcentaje debe estar entre 0 y 100.')
        return value


class FaseProyectoSerializer(serializers.ModelSerializer):
    tareas = TareaProyectoSerializer(many=True, required=False)

    class Meta:
        model = FaseProyecto
        fields = [
            'id', 'nombre', 'descripcion', 'orden',
            'fecha_inicio', 'fecha_fin', 'estado', 'tareas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        tareas_data = validated_data.pop('tareas', [])
        fase = FaseProyecto.objects.create(**validated_data)
        for tarea_data in tareas_data:
            TareaProyecto.objects.create(fase=fase, **tarea_data)
        return fase

    def update(self, instance, validated_data):
        tareas_data = validated_data.pop('tareas', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tareas_data is not None:
            instance.tareas.all().delete()
            for tarea_data in tareas_data:
                TareaProyecto.objects.create(fase=instance, **tarea_data)
        return instance


class DocumentoSustentoProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoSustentoProyecto
        fields = ['id', 'archivo', 'nombre', 'uploaded_at']


class PartidaPresupuestariaSerializer(serializers.ModelSerializer):
    monto_presupuestado = serializers.SerializerMethodField(read_only=True)
    fuente_display = serializers.CharField(source='get_fuente_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    tipo_recurso_display = serializers.CharField(source='get_tipo_recurso_display', read_only=True)

    class Meta:
        model = PartidaPresupuestaria
        fields = [
            'id', 'categoria', 'categoria_display',
            'tipo_recurso', 'tipo_recurso_display',
            'descripcion', 'unidad', 'cantidad',
            'costo_unitario', 'monto_presupuestado', 'monto_ejecutado',
            'fuente', 'fuente_display', 'orden',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_monto_presupuestado(self, obj):
        return obj.monto_presupuestado

    def validate_cantidad(self, value):
        if value < 1:
            raise serializers.ValidationError('La cantidad debe ser al menos 1.')
        return value

    def validate_costo_unitario(self, value):
        if value <= 0:
            raise serializers.ValidationError('El costo unitario debe ser mayor a 0.')
        return value


class MetaIndicadorProyectoSerializer(serializers.ModelSerializer):
    porcentaje_avance = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MetaIndicadorProyecto
        fields = [
            'id', 'meta_descripcion', 'indicador_nombre', 'unidad_medida',
            'linea_base', 'valor_meta', 'valor_alcanzado',
            'porcentaje_avance',
            'metodo_verificacion', 'fuente_verificacion', 'orden',
        ]

    def get_porcentaje_avance(self, obj):
        """Calcula el avance respecto a la meta. Retorna None si no hay datos suficientes."""
        if obj.valor_meta is None or obj.valor_meta == 0:
            return None
        base = obj.linea_base or 0
        alcanzado = obj.valor_alcanzado
        if alcanzado is None:
            return None
        avance = ((alcanzado - base) / (obj.valor_meta - base)) * 100 if obj.valor_meta != base else 0
        return round(float(avance), 1)

    def validate(self, attrs):
        valor_meta = attrs.get('valor_meta', getattr(self.instance, 'valor_meta', None))
        linea_base = attrs.get('linea_base', getattr(self.instance, 'linea_base', None))
        if valor_meta is not None and linea_base is not None and valor_meta <= linea_base:
            raise serializers.ValidationError({
                'valor_meta': 'El valor meta debe ser mayor a la línea base.'
            })
        return attrs


# ──────────────────────────────────────────────────────────────────────────────
# Main serializer
# ──────────────────────────────────────────────────────────────────────────────

class ProyectoRSUSerializer(serializers.ModelSerializer):
    # Nested writable
    asignaturas = ProyectoAsignaturaSerializer(many=True, required=False)
    docentes_adicionales = ProyectoDocenteSerializer(many=True, required=False)
    objetivos_especificos = ObjetivoEspecificoSerializer(many=True, required=False)
    fases = FaseProyectoSerializer(many=True, required=False)
    documentos_sustento = DocumentoSustentoProyectoSerializer(many=True, required=False)

    # Read-only display fields
    ods_info = serializers.SerializerMethodField(read_only=True)
    docente_responsable_nombre = serializers.CharField(
        source='docente_responsable.nombre_completo', read_only=True)
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)
    linea_estrategica_nombre = serializers.CharField(
        source='linea_estrategica.nombre', read_only=True)
    objetivo_institucional_nombre = serializers.CharField(
        source='objetivo_institucional.nombre', read_only=True)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    escuela_nombre = serializers.CharField(source='escuela.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    anio_carrera_display = serializers.CharField(source='get_anio_carrera_display', read_only=True)
    tipo_actividad_display = serializers.SerializerMethodField(read_only=True)
    fuente_financiamiento_display = serializers.CharField(
        source='get_fuente_financiamiento_display', read_only=True)

    class Meta:
        model = ProyectoRSU
        fields = [
            # ── Identificación ────────────────────────────────────────────
            'id', 'codigo', 'estado',

            # ── Sección I - Datos Generales ───────────────────────────────
            'facultad', 'facultad_nombre',
            'escuela', 'escuela_nombre',
            'departamento', 'departamento_nombre',
            'semestre_academico',
            'titulo',
            'nro_docentes',
            'nro_estudiantes',
            'lugar_ejecucion',

            # 1.9 Beneficiarios
            'benef_comunidad_universitaria',
            'benef_inst_educativas_basicas',
            'benef_inst_educativas_especiales',
            'benef_gobierno_local',
            'benef_gobierno_regional',
            'benef_gobierno_nacional',
            'benef_asociaciones',
            'benef_organizaciones_comunales',
            'benef_sector_empresarial',
            'benef_sectores_laborales',
            'benef_centros_penitenciarios',
            'benef_otro', 'benef_otro_detalle',

            # 1.10 Eje RSU
            'eje_rsu', 'eje_rsu_nombre',
            'eje_rsu_subitems',
            'linea_estrategica', 'linea_estrategica_nombre',
            'objetivo_institucional', 'objetivo_institucional_nombre',

            # 1.11 - 1.18
            'tipo_actividad', 'tipo_actividad_display', 'tipo_actividad_otro',
            'meta_cuantitativa',
            'indicador',
            'fecha_inicio',
            'fecha_evaluacion_avance',
            'fecha_termino',
            'fecha_encuesta_docentes',
            'fecha_encuesta_alumnos',
            'fecha_encuesta_grupo_destinatario',

            # ── Sección II - Fundamentación ───────────────────────────────
            'fund_por_que_grupo',
            'fund_para_que_proyecto',
            'fund_mecanismo_ensenanza',

            # ── Sección III - Diagnóstico ─────────────────────────────────
            'diag_estado_grupo',
            'diag_problemas_detectados',
            'diag_aportes_formacion',
            'diag_justificacion_intervencion',

            # ── Sección IV - Objetivos ────────────────────────────────────
            'objetivo_general',
            'objetivos_especificos',

            # ── Sección V - Resultados ────────────────────────────────────
            'resultado_en_beneficiarios',
            'resultado_en_curriculo',
            'impacto_esperado',

            # ── Sección VI/VII - Fases y Tareas ──────────────────────────
            'fases',

            # ── Sección VIII - Recursos ───────────────────────────────────
            'rec_hum_docentes', 'rec_hum_administrativos',
            'rec_hum_estudiantes', 'rec_hum_egresados',
            'rec_hum_voluntarios', 'rec_hum_otros',
            'rec_mat_material_didactico', 'rec_mat_afiches',
            'rec_mat_equipos', 'rec_mat_utiles', 'rec_mat_otros',

            # ── Sección IX - Financiamiento ───────────────────────────────
            'monto_financiamiento',
            'fuente_financiamiento', 'fuente_financiamiento_display',
            'descripcion_gastos',
            'observaciones_financiamiento',

            # ── Clasificación académica ───────────────────────────────────
            'periodo', 'periodo_nombre',
            'docente_responsable', 'docente_responsable_nombre',
            'anio_carrera', 'anio_carrera_display',
            'es_tesis_quinto_anio',

            # ── ODS ───────────────────────────────────────────────────────
            'ods', 'ods_info',

            # ── Asignaturas y docentes ────────────────────────────────────
            'asignaturas',
            'docentes_adicionales',

            # ── Estado y trazabilidad ─────────────────────────────────────
            'presentado_con_anticipacion',
            'conclusiones', 'recomendaciones',
            'lecciones_aprendidas', 'medio_difusion',
            'documentos_sustento',
            'created_at', 'updated_at',
            'fecha_envio_revision', 'fecha_aprobacion',
            'fecha_inicio_ejecucion', 'fecha_cierre',
        ]
        read_only_fields = [
            'codigo', 'estado', 'docente_responsable',
            'fecha_envio_revision', 'fecha_aprobacion',
            'fecha_inicio_ejecucion', 'fecha_cierre',
            'created_at', 'updated_at',
        ]

    def get_ods_info(self, obj):
        return [{'id': o.id, 'numero': o.numero, 'nombre': o.nombre} for o in obj.ods.all()]

    def get_tipo_actividad_display(self, obj):
        labels = {
            'programas_formativos': 'Programas formativos',
            'acompanamiento': 'Acompañamiento a sectores identificados',
            'asesoria': 'Asesoría',
            'acercamiento_comunidad': 'Iniciativas de acercamiento a la comunidad',
            'otro': 'Otros',
        }
        return [labels.get(t, t) for t in (obj.tipo_actividad or [])]

    def validate_tipo_actividad(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Debe ser una lista de tipos de actividad.')
        validos = ProyectoRSU.TIPOS_ACTIVIDAD_VALIDOS
        for v in value:
            if v not in validos:
                raise serializers.ValidationError(
                    f"'{v}' no es un tipo de actividad válido. Opciones: {validos}"
                )
        return value

    def validate(self, attrs):
        """Valida coherencia entre facultad, escuela y departamento."""
        # Para PATCH, usar el valor actual del campo si no viene en attrs
        facultad = attrs.get('facultad', getattr(self.instance, 'facultad', None))
        escuela = attrs.get('escuela', getattr(self.instance, 'escuela', None))
        departamento = attrs.get('departamento', getattr(self.instance, 'departamento', None))

        if facultad and escuela and escuela.facultad_id != facultad.pk:
            raise serializers.ValidationError({
                'escuela': 'La escuela profesional no pertenece a la facultad seleccionada.'
            })
        if facultad and departamento and departamento.facultad_id != facultad.pk:
            raise serializers.ValidationError({
                'departamento': 'El departamento académico no pertenece a la facultad seleccionada.'
            })
        return attrs

    def _save_nested_flat(self, proyecto, data_map, replace=False):
        """Crea o reemplaza objetos relacionados directamente al proyecto."""
        mapping = {
            'asignaturas':           ProyectoAsignatura,
            'docentes_adicionales':  ProyectoDocente,
            'objetivos_especificos': ObjetivoEspecifico,
            'documentos_sustento':   DocumentoSustentoProyecto,
        }
        for attr, items in data_map.items():
            if items is None:
                continue
            model = mapping[attr]
            if replace:
                getattr(proyecto, attr).all().delete()
            for item in items:
                model.objects.create(proyecto=proyecto, **item)

    def _save_fases(self, proyecto, fases_data, replace=False):
        """Crea o reemplaza fases con sus tareas anidadas."""
        if fases_data is None:
            return
        if replace:
            proyecto.fases.all().delete()
        for fase_data in fases_data:
            tareas_data = fase_data.pop('tareas', [])
            fase = FaseProyecto.objects.create(proyecto=proyecto, **fase_data)
            for tarea_data in tareas_data:
                TareaProyecto.objects.create(fase=fase, **tarea_data)

    def create(self, validated_data):
        asignaturas_data = validated_data.pop('asignaturas', [])
        docentes_data    = validated_data.pop('docentes_adicionales', [])
        objetivos_data   = validated_data.pop('objetivos_especificos', [])
        fases_data       = validated_data.pop('fases', [])
        documentos_data  = validated_data.pop('documentos_sustento', [])
        ods_data         = validated_data.pop('ods', [])

        validated_data['docente_responsable'] = self.context['request'].user
        validated_data['estado'] = 'borrador'

        with transaction.atomic():
            proyecto = ProyectoRSU.objects.create(**validated_data)
            proyecto.codigo = f"PROY-FIPS-{proyecto.id:04d}"
            proyecto.save(update_fields=['codigo'])

            proyecto.ods.set(ods_data)
            self._save_nested_flat(proyecto, {
                'asignaturas':           asignaturas_data,
                'docentes_adicionales':  docentes_data,
                'objetivos_especificos': objetivos_data,
                'documentos_sustento':   documentos_data,
            }, replace=False)
            self._save_fases(proyecto, fases_data, replace=False)

        return proyecto

    def update(self, instance, validated_data):
        if instance.estado not in ['borrador', 'observado']:
            raise serializers.ValidationError(
                "No se puede editar un proyecto que está en revisión o ya aprobado.")

        asignaturas_data = validated_data.pop('asignaturas', None)
        docentes_data    = validated_data.pop('docentes_adicionales', None)
        objetivos_data   = validated_data.pop('objetivos_especificos', None)
        fases_data       = validated_data.pop('fases', None)
        documentos_data  = validated_data.pop('documentos_sustento', None)
        ods_data         = validated_data.pop('ods', None)

        with transaction.atomic():
            changed_fields = list(validated_data.keys())
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save(update_fields=list(set(changed_fields + ['updated_at'])))

            if ods_data is not None:
                instance.ods.set(ods_data)

            self._save_nested_flat(instance, {
                'asignaturas':           asignaturas_data,
                'docentes_adicionales':  docentes_data,
                'objetivos_especificos': objetivos_data,
                'documentos_sustento':   documentos_data,
            }, replace=True)
            self._save_fases(instance, fases_data, replace=True)

        return instance
