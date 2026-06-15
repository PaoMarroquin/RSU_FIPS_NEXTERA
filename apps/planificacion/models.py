from django.db import models
from django.conf import settings
from apps.usuarios.models import Facultad

class PeriodoAcademico(models.Model):
    SEMESTRES = [
        ('I', 'Semestre I'),
        ('II', 'Semestre II'),
        ('Anual', 'Anual'),
    ]
    nombre = models.CharField(max_length=100)
    anio = models.IntegerField()
    semestre = models.CharField(max_length=10, choices=SEMESTRES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'periodos_academicos'
        verbose_name = 'Periodo Académico'
        verbose_name_plural = 'Periodos Académicos'

    def __str__(self):
        return self.nombre


class EjeRSU(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ejes_rsu'
        verbose_name = 'Eje RSU'
        verbose_name_plural = 'Ejes RSU'

    def __str__(self):
        return self.nombre


class ODS(models.Model):
    numero = models.IntegerField(unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    icono_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ods'
        verbose_name = 'ODS'
        verbose_name_plural = 'ODS'

    def __str__(self):
        return f'ODS {self.numero}: {self.nombre}'


class LineaEstrategica(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    eje_rsu = models.ForeignKey(EjeRSU, on_delete=models.PROTECT, related_name='lineas_estrategicas')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lineas_estrategicas'
        verbose_name = 'Línea Estratégica'
        verbose_name_plural = 'Líneas Estratégicas'

    def __str__(self):
        return self.nombre


class MatrizOperativa(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('publicada', 'Publicada'),
        ('cerrada', 'Cerrada'),
    ]
    periodo = models.ForeignKey(PeriodoAcademico, on_delete=models.PROTECT, related_name='matrices')
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name='matrices')
    coordinador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='matrices_coordinadas')
    presupuesto_global = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS)
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'matrices_operativas'
        verbose_name = 'Matriz Operativa'
        verbose_name_plural = 'Matrices Operativas'

    def __str__(self):
        return f'Matriz {self.facultad.nombre} - {self.periodo.nombre}'


class ObjetivoInstitucional(models.Model):
    matriz = models.ForeignKey(MatrizOperativa, on_delete=models.CASCADE, related_name='objetivos')
    linea_estrategica = models.ForeignKey(LineaEstrategica, on_delete=models.SET_NULL, null=True, blank=True, related_name='objetivos')
    eje_rsu = models.ForeignKey(EjeRSU, on_delete=models.PROTECT, related_name='objetivos')
    nombre = models.CharField(max_length=300)
    descripcion = models.TextField(blank=True, null=True)
    resultado_esperado = models.TextField(blank=True, null=True)
    meta_cuantitativa = models.CharField(max_length=300, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'objetivos_institucionales'
        verbose_name = 'Objetivo Institucional'
        verbose_name_plural = 'Objetivos Institucionales'

    def __str__(self):
        return self.nombre


class IndicadorInstitucional(models.Model):
    objetivo = models.ForeignKey(ObjetivoInstitucional, on_delete=models.CASCADE, related_name='indicadores')
    nombre = models.CharField(max_length=300)
    unidad_medida = models.CharField(max_length=100, blank=True, null=True)
    valor_meta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_alcanzado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    metodo_verificacion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'indicadores_institucionales'
        verbose_name = 'Indicador Institucional'
        verbose_name_plural = 'Indicadores Institucionales'

    def __str__(self):
        return self.nombre


class ActividadSugerida(models.Model):
    ANIOS = [
        (1, '1.er año'),
        (2, '2.do año'),
        (3, '3.er año'),
        (4, '4.to año'),
        (5, '5.to año'),
    ]
    matriz = models.ForeignKey(MatrizOperativa, on_delete=models.CASCADE, related_name='actividades_sugeridas')
    objetivo = models.ForeignKey(ObjetivoInstitucional, on_delete=models.SET_NULL, null=True, blank=True, related_name='actividades_sugeridas')
    eje_rsu = models.ForeignKey(EjeRSU, on_delete=models.PROTECT, related_name='actividades_sugeridas')
    nombre = models.CharField(max_length=300)
    descripcion = models.TextField(blank=True, null=True)
    anio_academico = models.IntegerField(choices=ANIOS, null=True, blank=True)
    tipo_actividad = models.CharField(max_length=150, blank=True, null=True)
    destinatarios = models.CharField(max_length=300, blank=True, null=True)
    presupuesto_ref = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'actividades_sugeridas'
        verbose_name = 'Actividad Sugerida'
        verbose_name_plural = 'Actividades Sugeridas'

    def __str__(self):
        return f'{self.nombre} ({self.get_anio_academico_display()})'
