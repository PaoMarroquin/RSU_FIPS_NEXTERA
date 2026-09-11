from rest_framework import serializers
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

class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'nombre', 'anio', 'semestre', 'fecha_inicio', 'fecha_fin', 'activo', 'created_at']


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
            'id', 'matriz', 'objetivo', 'objetivo_nombre', 'eje_rsu', 'eje_rsu_nombre',
            'nombre', 'descripcion', 'anio_academico', 'anio_academico_display',
            'tipo_actividad', 'destinatarios', 'presupuesto_ref', 'created_at'
        ]


class ObjetivoInstitucionalSerializer(serializers.ModelSerializer):
    indicadores = IndicadorInstitucionalSerializer(many=True, read_only=True)
    actividades_sugeridas = ActividadSugeridaSerializer(many=True, read_only=True)
    linea_estrategica_nombre = serializers.CharField(source='linea_estrategica.nombre', read_only=True)
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)

    class Meta:
        model = ObjetivoInstitucional
        fields = [
            'id', 'matriz', 'linea_estrategica', 'linea_estrategica_nombre',
            'eje_rsu', 'eje_rsu_nombre', 'nombre', 'descripcion',
            'resultado_esperado', 'meta_cuantitativa', 'indicadores', 
            'actividades_sugeridas', 'created_at'
        ]


class MatrizOperativaSerializer(serializers.ModelSerializer):
    periodo = serializers.PrimaryKeyRelatedField(queryset=PeriodoAcademico.objects.all(), required=False)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    coordinador_nombre = serializers.CharField(source='coordinador.nombres', read_only=True)
    objetivos = ObjetivoInstitucionalSerializer(many=True, read_only=True)
    actividades_sugeridas = ActividadSugeridaSerializer(many=True, read_only=True)

    class Meta:
        model = MatrizOperativa
        fields = [
            'id', 'periodo', 'periodo_nombre', 'facultad', 'facultad_nombre',
            'coordinador', 'coordinador_nombre', 'presupuesto_global',
            'estado', 'observaciones', 'objetivos', 'actividades_sugeridas',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['coordinador']
