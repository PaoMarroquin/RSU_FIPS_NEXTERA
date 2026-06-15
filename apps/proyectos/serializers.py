from rest_framework import serializers
from .models import ProyectoRSU, ProyectoAsignatura, ProyectoDocente
from apps.planificacion.models import ODS, EjeRSU, LineaEstrategica, ObjetivoInstitucional, PeriodoAcademico
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico
from django.db import transaction

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


class ProyectoRSUSerializer(serializers.ModelSerializer):
    asignaturas = ProyectoAsignaturaSerializer(many=True, required=False)
    docentes_adicionales = ProyectoDocenteSerializer(many=True, required=False)
    ods_info = serializers.SerializerMethodField(read_only=True)
    docente_responsable_nombre = serializers.CharField(source='docente_responsable.nombre_completo', read_only=True)
    eje_rsu_nombre = serializers.CharField(source='eje_rsu.nombre', read_only=True)
    linea_estrategica_nombre = serializers.CharField(source='linea_estrategica.nombre', read_only=True)
    objetivo_institucional_nombre = serializers.CharField(source='objetivo_institucional.nombre', read_only=True)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    escuela_nombre = serializers.CharField(source='escuela.nombre', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    anio_carrera_display = serializers.CharField(source='get_anio_carrera_display', read_only=True)

    class Meta:
        model = ProyectoRSU
        fields = [
            'id', 'codigo', 'titulo', 'descripcion_general', 'fundamentacion',
            'diagnostico_situacional', 'eje_rsu', 'eje_rsu_nombre', 'linea_estrategica',
            'linea_estrategica_nombre', 'objetivo_institucional', 'objetivo_institucional_nombre',
            'periodo', 'periodo_nombre', 'facultad', 'facultad_nombre', 'escuela',
            'escuela_nombre', 'departamento', 'departamento_nombre', 'docente_responsable',
            'docente_responsable_nombre', 'semestre_academico', 'anio_carrera', 'anio_carrera_display',
            'es_tesis_quinto_anio', 'estado', 'presentado_con_anticipacion',
            'conclusiones', 'recomendaciones', 'lecciones_aprendidas', 'medio_difusion',
            'ods', 'ods_info', 'asignaturas', 'docentes_adicionales', 'created_at',
            'fecha_envio_revision', 'fecha_aprobacion', 'fecha_inicio_ejecucion', 'fecha_cierre'
        ]
        read_only_fields = ['codigo', 'estado', 'docente_responsable', 'fecha_envio_revision', 'fecha_aprobacion', 'fecha_inicio_ejecucion', 'fecha_cierre']

    def get_ods_info(self, obj):
        return [{'id': o.id, 'numero': o.numero, 'nombre': o.nombre} for o in obj.ods.all()]

    def create(self, validated_data):
        asignaturas_data = validated_data.pop('asignaturas', [])
        docentes_data = validated_data.pop('docentes_adicionales', [])
        ods_data = validated_data.pop('ods', [])
        
        # Set responsible teacher to the authenticated user
        validated_data['docente_responsable'] = self.context['request'].user
        validated_data['estado'] = 'borrador'
        
        with transaction.atomic():
            proyecto = ProyectoRSU.objects.create(**validated_data)
            
            # Generate temporary or auto incremental code if needed
            proyecto.codigo = f"PROY-FIPS-{proyecto.id:04d}"
            proyecto.save(update_fields=['codigo'])
            
            proyecto.ods.set(ods_data)
            
            for asignatura in asignaturas_data:
                ProyectoAsignatura.objects.create(proyecto=proyecto, **asignatura)
                
            for docente in docentes_data:
                ProyectoDocente.objects.create(proyecto=proyecto, **docente)
                
        return proyecto

    def update(self, instance, validated_data):
        # Prevent modification if already submitted for review and not in draft/observed state
        if instance.estado not in ['borrador', 'observado']:
            raise serializers.ValidationError("No se puede editar un proyecto que está en revisión o ya aprobado.")
            
        asignaturas_data = validated_data.pop('asignaturas', None)
        docentes_data = validated_data.pop('docentes_adicionales', None)
        ods_data = validated_data.pop('ods', None)
        
        with transaction.atomic():
            # Update standard fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            if ods_data is not None:
                instance.ods.set(ods_data)
                
            if asignaturas_data is not None:
                instance.asignaturas.all().delete()
                for asignatura in asignaturas_data:
                    ProyectoAsignatura.objects.create(proyecto=instance, **asignatura)
                    
            if docentes_data is not None:
                instance.docentes_adicionales.all().delete()
                for docente in docentes_data:
                    ProyectoDocente.objects.create(proyecto=instance, **docente)
                    
        return instance
