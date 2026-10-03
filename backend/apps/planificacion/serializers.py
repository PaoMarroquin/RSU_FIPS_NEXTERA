"""
Serializers del modulo de planificacion.

Traducen catalogos y matriz operativa a JSON. Los serializers de matriz son
anidados: al pedir una matriz se devuelven sus objetivos con sus indicadores
y sus actividades sugeridas en una sola respuesta, para que el frontend pinte
la pantalla completa sin encadenar peticiones.

Conecta con:
- apps/planificacion/models.py: modelos que serializa.
- apps/planificacion/views.py: vistas que los usan.
"""
from rest_framework import serializers
from .models import (
    PeriodoAcademico,
    EjeRSU,
    EjeRSUSubitem,
    ODS,
    ObjetivoRegional,
    ObjetivoNacional,
    LineaEstrategica,
    MatrizOperativa,
    ObjetivoInstitucional,
    IndicadorInstitucional,
    ActividadSugerida,
)

class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'nombre', 'anio', 'semestre', 'fecha_inicio', 'fecha_fin', 'activo', 'created_at']

    def validate(self, attrs):
        inicio = attrs.get('fecha_inicio', getattr(self.instance, 'fecha_inicio', None))
        fin = attrs.get('fecha_fin', getattr(self.instance, 'fecha_fin', None))
        if inicio and fin and fin < inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'})
        return attrs


class EjeRSUSubitemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EjeRSUSubitem
        fields = ['id', 'clave', 'nombre', 'requiere_detalle', 'label_detalle', 'orden']


class EjeRSUSerializer(serializers.ModelSerializer):
    subitems = EjeRSUSubitemSerializer(many=True, read_only=True)

    class Meta:
        model = EjeRSU
        fields = ['id', 'nombre', 'descripcion', 'subitems', 'created_at']


class ODSSerializer(serializers.ModelSerializer):
    class Meta:
        model = ODS
        fields = ['id', 'numero', 'nombre', 'descripcion', 'icono_url', 'created_at']


class ObjetivoRegionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjetivoRegional
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'created_at']


class ObjetivoNacionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjetivoNacional
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'created_at']


class LineaEstrategicaSerializer(serializers.ModelSerializer):
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)

    class Meta:
        model = LineaEstrategica
        fields = ['id', 'nombre', 'descripcion', 'eje_rsu', 'eje_rsu_nombre', 'created_at']


class IndicadorInstitucionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndicadorInstitucional
        fields = ['id', 'objetivo', 'nombre', 'unidad_medida', 'valor_meta', 'valor_alcanzado', 'metodo_verificacion', 'created_at']


class ActividadSugeridaSerializer(serializers.ModelSerializer):
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)
    objetivo_nombre = serializers.CharField(source='objetivo.nombre', read_only=True)
    anio_academico_display = serializers.CharField(source='get_anio_academico_display', read_only=True)

    class Meta:
        model = ActividadSugerida
        fields = [
            'id', 'objetivo', 'objetivo_nombre', 'eje_rsu', 'eje_rsu_nombre',
            'nombre', 'descripcion', 'anio_academico', 'anio_academico_display',
            'tipo_actividad', 'destinatarios', 'presupuesto_ref', 'created_at'
        ]

    def validate(self, attrs):
        eje_rsu = attrs.get('eje_rsu', getattr(self.instance, 'eje_rsu', None))
        objetivo = attrs.get('objetivo', getattr(self.instance, 'objetivo', None))
        if eje_rsu and objetivo and objetivo.eje_rsu_id != eje_rsu.id:
            raise serializers.ValidationError(
                {'objetivo': 'El objetivo seleccionado no pertenece al eje RSU indicado.'})
        return attrs


class ObjetivoInstitucionalSerializer(serializers.ModelSerializer):
    indicadores = IndicadorInstitucionalSerializer(many=True, read_only=True)
    actividades_sugeridas = ActividadSugeridaSerializer(many=True, read_only=True)
    linea_estrategica_nombre = serializers.CharField(source='linea_estrategica.nombre', read_only=True)
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)

    class Meta:
        model = ObjetivoInstitucional
        fields = [
            'id', 'linea_estrategica', 'linea_estrategica_nombre',
            'eje_rsu', 'eje_rsu_nombre', 'nombre', 'descripcion',
            'resultado_esperado', 'meta_cuantitativa', 'indicadores', 
            'actividades_sugeridas', 'created_at'
        ]


class MatrizOperativaSerializer(serializers.ModelSerializer):
    """Documento de apoyo: nombre, descripción y archivo (PDF o Word), los tres obligatorios."""

    class Meta:
        model = MatrizOperativa
        fields = ['id', 'nombre', 'descripcion', 'archivo',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_descripcion(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError('La descripción del documento es obligatoria.')
        return value.strip()
