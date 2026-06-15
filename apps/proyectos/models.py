from django.db import models
from django.conf import settings
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, EjeRSU, LineaEstrategica, ObjetivoInstitucional, ODS

class ProyectoRSU(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('en_revision', 'En Revisión'),
        ('observado', 'Observado'),
        ('corregido', 'Corregido'),
        ('aprobado', 'Aprobado'),
        ('en_ejecucion', 'En Ejecución'),
        ('finalizado', 'Finalizado'),
        ('rechazado', 'Rechazado'),
    ]
    ANIOS = [
        (1, '1.er año'),
        (2, '2.do año'),
        (3, '3.er año'),
        (4, '4.to año'),
        (5, '5.to año'),
    ]

    codigo = models.CharField(max_length=50, unique=True, null=True, blank=True)
    titulo = models.CharField(max_length=400)
    descripcion_general = models.TextField(blank=True, null=True)
    fundamentacion = models.TextField(blank=True, null=True)
    diagnostico_situacional = models.TextField(blank=True, null=True)
    
    # Classification
    eje_rsu = models.ForeignKey(EjeRSU, on_delete=models.PROTECT, related_name='proyectos')
    linea_estrategica = models.ForeignKey(LineaEstrategica, on_delete=models.SET_NULL, null=True, blank=True, related_name='proyectos')
    objetivo_institucional = models.ForeignKey(ObjetivoInstitucional, on_delete=models.SET_NULL, null=True, blank=True, related_name='proyectos')
    
    # Institutional Links
    periodo = models.ForeignKey(PeriodoAcademico, on_delete=models.PROTECT, related_name='proyectos')
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name='proyectos')
    escuela = models.ForeignKey(EscuelaProfesional, on_delete=models.PROTECT, related_name='proyectos')
    departamento = models.ForeignKey(DepartamentoAcademico, on_delete=models.PROTECT, related_name='proyectos')
    docente_responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='proyectos_responsable')
    semestre_academico = models.CharField(max_length=20)
    
    # Academic Data
    anio_carrera = models.IntegerField(choices=ANIOS, null=True, blank=True)
    es_tesis_quinto_anio = models.BooleanField(default=False)
    
    # State
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS)
    presentado_con_anticipacion = models.BooleanField(default=False)
    
    # Final report parts (for future phases)
    conclusiones = models.TextField(blank=True, null=True)
    recomendaciones = models.TextField(blank=True, null=True)
    lecciones_aprendidas = models.TextField(blank=True, null=True)
    medio_difusion = models.CharField(max_length=200, blank=True, null=True)
    
    # ODS many-to-many relationship
    ods = models.ManyToManyField(ODS, related_name='proyectos', db_table='proyecto_ods')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    fecha_envio_revision = models.DateTimeField(null=True, blank=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_inicio_ejecucion = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'proyectos_rsu'
        verbose_name = 'Proyecto RSU'
        verbose_name_plural = 'Proyectos RSU'

    def __str__(self):
        return self.titulo


class ProyectoAsignatura(models.Model):
    proyecto = models.ForeignKey(ProyectoRSU, on_delete=models.CASCADE, related_name='asignaturas')
    nombre_asignatura = models.CharField(max_length=200)
    codigo_asignatura = models.CharField(max_length=50, blank=True, null=True)
    anio_carrera = models.IntegerField(null=True, blank=True)
    semestre = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = 'proyecto_asignaturas'
        verbose_name = 'Asignatura de Proyecto'
        verbose_name_plural = 'Asignaturas de Proyecto'


class ProyectoDocente(models.Model):
    ROLES = [
        ('Colaborador', 'Colaborador'),
        ('Asesor', 'Asesor'),
    ]
    proyecto = models.ForeignKey(ProyectoRSU, on_delete=models.CASCADE, related_name='docentes_adicionales')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='proyectos_participante')
    rol_en_proyecto = models.CharField(max_length=100, choices=ROLES)

    class Meta:
        db_table = 'proyecto_docentes'
        verbose_name = 'Docente de Proyecto'
        verbose_name_plural = 'Docentes de Proyecto'
