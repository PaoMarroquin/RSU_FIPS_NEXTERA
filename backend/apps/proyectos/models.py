from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, EjeRSU, EjeRSUSubitem, LineaEstrategica, ObjetivoInstitucional, ODS

DOCUMENTO_SUSTENTO_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx']
DOCUMENTO_SUSTENTO_MAX_SIZE_MB = 10


def validate_documento_sustento_size(archivo):
    if archivo.size > DOCUMENTO_SUSTENTO_MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f'El archivo no puede superar los {DOCUMENTO_SUSTENTO_MAX_SIZE_MB}MB.')


# Evidencias de avances (PDF, imágenes y listas de asistencia)
EVIDENCIA_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
EVIDENCIA_MAX_SIZE_MB = 10


def validate_evidencia_size(archivo):
    if archivo.size > EVIDENCIA_MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f'La evidencia no puede superar los {EVIDENCIA_MAX_SIZE_MB}MB.')


class TipoBeneficiario(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=200)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'tipo_beneficiario'
        verbose_name = 'Tipo de Beneficiario'
        verbose_name_plural = 'Tipos de Beneficiario'
        ordering = ['orden']

    def __str__(self):
        return self.label


class ProyectoRSU(models.Model):
    """
    Modelo principal del Proyecto de Responsabilidad Social Universitaria.
    Implementa completamente el ANEXO 4 - Formato OURS (Oficina de RSU UNSA).

    Secciones:
      I.   Datos Generales  (campos 1.1 - 1.18)
      II.  Fundamentación
      III. Diagnóstico Situacional
      IV.  Objetivos
      V.   Resultados Esperados
      VI.  Desarrollo de Actividades  → modelo ActividadProyecto
      VII. Cronograma                 → modelo CronogramaAccion
      VIII.Recursos
      IX.  Financiamiento
    """

    # ──────────────────────────────────────────────────────────────────────────
    # CHOICES
    # ──────────────────────────────────────────────────────────────────────────
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
    # Valores válidos para tipo_actividad (multi-select almacenado como JSONField / lista)
    TIPOS_ACTIVIDAD_VALIDOS = [
        'programas_formativos',
        'acompanamiento',
        'asesoria',
        'acercamiento_comunidad',
        'otro',
    ]
    FUENTES_FINANCIAMIENTO = [
        ('recursos_propios_unsa', 'Recursos Propios UNSA'),
        ('cooperacion_externa',   'Cooperación externa'),
        ('aporte_facultad',       'Aporte a la Facultad'),
        ('autofinanciado',        'Autofinanciado'),
    ]

    # ──────────────────────────────────────────────────────────────────────────
    # IDENTIFICACIÓN
    # ──────────────────────────────────────────────────────────────────────────
    codigo = models.CharField(
        max_length=50, unique=True, null=True, blank=True,
        help_text="Código asignado por la comisión OURS una vez consolidados todos los proyectos.")
    estado = models.CharField(max_length=30, default='borrador', choices=ESTADOS, db_index=True)
    # HU-05 (T-89): calculado automáticamente según el estado de las actividades.
    porcentaje_ejecucion = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="% de ejecución (0-100) calculado automáticamente según el estado de las actividades.")
    presentado_con_anticipacion = models.BooleanField(default=False)

    # Continuación de proyectos entre semestres
    es_continuacion = models.BooleanField(default=False)
    proyecto_origen = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='continuaciones')

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN I - DATOS GENERALES
    # ──────────────────────────────────────────────────────────────────────────

    # 1.1 - 1.4  Información institucional
    facultad = models.ForeignKey(
        Facultad, on_delete=models.PROTECT, related_name='proyectos',
        help_text="1.1 Facultad")
    escuela = models.ForeignKey(
        EscuelaProfesional, on_delete=models.PROTECT, related_name='proyectos',
        help_text="1.2 Escuela Profesional")
    departamento = models.ForeignKey(
        DepartamentoAcademico, on_delete=models.PROTECT, related_name='proyectos',
        help_text="1.3 Departamento Académico")
    semestre_academico = models.CharField(
        max_length=20, help_text="1.4 Semestre académico (ej: 2023-A)")

    # 1.5 Asignaturas → modelo ProyectoAsignatura (FK inverso)

    # 1.6 Título
    titulo = models.CharField(max_length=400, help_text="1.6 Título del proyecto")

    # 1.7 - 1.8 Participantes
    nro_docentes = models.PositiveIntegerField(
        null=True, blank=True, default=1,
        help_text="1.7 Nro. de docentes que participaron")
    nro_estudiantes = models.PositiveIntegerField(
        null=True, blank=True, default=0,
        help_text="1.8 Nro. de estudiantes universitarios que participaron")

    # 1.9 Beneficiarios / Destinatarios
    beneficiarios = models.ManyToManyField(
        TipoBeneficiario, blank=True,
        related_name='proyectos', db_table='proyecto_beneficiarios',
        help_text="1.9 Beneficiarios / Destinatarios del proyecto")
    benef_otro_detalle = models.CharField(
        max_length=500, blank=True,
        help_text="1.9j Detalle cuando se selecciona 'Otro'")

    # 1.10 Tipo de eje RSU (FK principal) + sub-ítems como JSON estructurado
    # Estructura del JSON eje_rsu_subitems:
    # {
    #   "gestion": ["acciones_ambientales_administrativo", "otro"],
    #   "gestion_otro_descripcion": "...",
    #   "formacion": ["etica", "derechos_humanos"],
    #   "formacion_otro_descripcion": "...",
    #   "investigacion": ["metas_ods", "formacion_ciudadana"],
    #   "extension": ["metas_ods", "calidad_vida"],
    #   "extension_ods_numeros": "3, 4, 11",
    #   "extension_ambito_detalle": "..."
    # }
    eje_rsu = models.ForeignKey(
        EjeRSU, on_delete=models.PROTECT, related_name='proyectos',
        help_text="1.10 Eje RSU principal del proyecto (selección excluyente)")
    eje_detalle = models.TextField(
        blank=True, null=True,
        help_text="1.10 Descripción obligatoria cuando el eje RSU seleccionado es 'Otros'")

    linea_estrategica = models.ForeignKey(
        LineaEstrategica, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='proyectos')
    objetivo_institucional = models.ForeignKey(
        ObjetivoInstitucional, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='proyectos')

    # 1.11 Tipo de actividad (multi-select: lista de strings)
    # Valores válidos: programas_formativos | acompanamiento | asesoria |
    #                  acercamiento_comunidad | otro
    tipo_actividad = models.JSONField(
        default=list, blank=True,
        help_text="1.11 Tipos de actividad seleccionados (lista, p.ej. ['asesoria','otro'])")
    tipo_actividad_otro = models.CharField(
        max_length=300, blank=True, null=True,
        help_text="1.11 Descripción si se seleccionó 'Otro' como tipo de actividad")

    # 1.14 - 1.16 Fechas del ciclo del proyecto
    fecha_inicio = models.DateField(
        null=True, blank=True, help_text="1.14 Fecha de inicio")
    fecha_evaluacion_avance = models.DateField(
        null=True, blank=True, help_text="1.15 Fecha de evaluación de avance")
    fecha_termino = models.DateField(
        null=True, blank=True, help_text="1.16 Fecha de término")

    # 1.17 Fechas de aplicación de encuesta de evaluación de intervención
    fecha_encuesta_docentes = models.DateField(
        null=True, blank=True, help_text="1.17 Encuesta a Docentes")
    fecha_encuesta_alumnos = models.DateField(
        null=True, blank=True, help_text="1.17 Encuesta a Estudiantes")
    fecha_encuesta_grupo_destinatario = models.DateField(
        null=True, blank=True, help_text="1.17 Encuesta a Grupo Destinatario")

    # 1.18 Lugar de ejecución
    lugar_ejecucion = models.TextField(
        blank=True, null=True,
        help_text="1.18 Lugar de ejecución (ej: Distrito de Cayma, Arequipa)")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN II - FUNDAMENTACIÓN
    # ──────────────────────────────────────────────────────────────────────────
    fund_por_que_grupo = models.TextField(
        blank=True, null=True,
        help_text="II ¿Por qué se eligió el grupo beneficiario?")
    fund_para_que_proyecto = models.TextField(
        blank=True, null=True,
        help_text="II ¿Para qué servirá el proyecto?")
    fund_mecanismo_ensenanza = models.TextField(
        blank=True, null=True,
        help_text="II ¿Cuál será el mecanismo de enseñanza-aprendizaje?")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN III - DIAGNÓSTICO SITUACIONAL
    # ──────────────────────────────────────────────────────────────────────────
    diag_estado_grupo = models.TextField(
        blank=True, null=True,
        help_text="III Estado actual del grupo beneficiario")
    diag_problemas_detectados = models.TextField(
        blank=True, null=True,
        help_text="III Problemas detectados")
    diag_aportes_formacion = models.TextField(
        blank=True, null=True,
        help_text="III Aportes desde la formación profesional")
    diag_justificacion_intervencion = models.TextField(
        blank=True, null=True,
        help_text="III Justificación de la intervención")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN IV - OBJETIVOS
    # ──────────────────────────────────────────────────────────────────────────
    obj_logro_intervencion = models.TextField(
        blank=True, null=True,
        help_text="IV ¿Qué queremos lograr con nuestra intervención en el grupo beneficiario?")
    obj_mejora_curricular = models.TextField(
        blank=True, null=True,
        help_text="IV ¿Qué queremos mejorar en el proceso curricular?")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN V - RESULTADOS ESPERADOS
    # ──────────────────────────────────────────────────────────────────────────
    resultado_en_beneficiarios = models.TextField(
        blank=True, null=True,
        help_text="V Resultados esperados en los beneficiarios")
    resultado_en_curriculo = models.TextField(
        blank=True, null=True,
        help_text="V Resultados esperados en el proceso curricular")
    impacto_esperado = models.TextField(
        blank=True, null=True,
        help_text="V Impacto esperado general")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN VI - DESARROLLO DE ACTIVIDADES → modelo ActividadProyecto
    # SECCIÓN VII - CRONOGRAMA               → modelo CronogramaAccion
    # ──────────────────────────────────────────────────────────────────────────

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN VIII - RECURSOS
    # ──────────────────────────────────────────────────────────────────────────

    # 8.1 Recursos Humanos (cantidades)
    rec_hum_docentes = models.PositiveIntegerField(
        default=0, help_text="VIII Docentes")
    rec_hum_administrativos = models.PositiveIntegerField(
        default=0, help_text="VIII Administrativos")
    rec_hum_estudiantes = models.PositiveIntegerField(
        default=0, help_text="VIII Estudiantes")
    rec_hum_egresados = models.PositiveIntegerField(
        default=0, help_text="VIII Egresados")
    rec_hum_voluntarios = models.PositiveIntegerField(
        default=0, help_text="VIII Voluntarios")
    rec_hum_otros = models.PositiveIntegerField(
        default=0, help_text="VIII Otros recursos humanos")

    # 8.2 Recursos Materiales (descripción por tipo)
    rec_mat_material_didactico = models.TextField(
        blank=True, null=True, help_text="VIII Material didáctico")
    rec_mat_afiches = models.TextField(
        blank=True, null=True, help_text="VIII Afiches")
    rec_mat_equipos = models.TextField(
        blank=True, null=True, help_text="VIII Equipos")
    rec_mat_utiles = models.TextField(
        blank=True, null=True, help_text="VIII Útiles")
    rec_mat_otros = models.TextField(
        blank=True, null=True, help_text="VIII Otros materiales")

    # ──────────────────────────────────────────────────────────────────────────
    # SECCIÓN IX - FINANCIAMIENTO
    # ──────────────────────────────────────────────────────────────────────────
    monto_financiamiento = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, default=0,
        help_text="IX Presupuesto estimado total (S/)")
    fuente_financiamiento = models.CharField(
        max_length=50, choices=FUENTES_FINANCIAMIENTO, blank=True, null=True,
        help_text="IX Fuente de financiamiento")
    descripcion_gastos = models.TextField(
        blank=True, null=True,
        help_text="IX Detalle de los rubros de gasto y su distribución")
    observaciones_financiamiento = models.TextField(
        blank=True, null=True,
        help_text="IX Observaciones adicionales sobre el financiamiento")
    financiamiento_confirmado = models.BooleanField(default=False)
    financiamiento_fecha_confirmacion = models.DateTimeField(null=True, blank=True)

    # ──────────────────────────────────────────────────────────────────────────
    # CLASIFICACIÓN ACADÉMICA / RELACIONES
    # ──────────────────────────────────────────────────────────────────────────
    periodo = models.ForeignKey(
        PeriodoAcademico, on_delete=models.PROTECT, related_name='proyectos')
    docente_responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='proyectos_responsable')
    anio_carrera = models.IntegerField(choices=ANIOS, null=True, blank=True)
    es_tesis_quinto_anio = models.BooleanField(default=False)

    # ODS (many-to-many)
    ods = models.ManyToManyField(ODS, related_name='proyectos', db_table='proyecto_ods')

    # ──────────────────────────────────────────────────────────────────────────
    # INFORME FINAL (fases posteriores al sprint actual)
    # ──────────────────────────────────────────────────────────────────────────
    conclusiones = models.TextField(blank=True, null=True)
    recomendaciones = models.TextField(blank=True, null=True)
    lecciones_aprendidas = models.TextField(blank=True, null=True)
    medio_difusion = models.CharField(max_length=200, blank=True, null=True)

    # ──────────────────────────────────────────────────────────────────────────
    # TRAZABILIDAD
    # ──────────────────────────────────────────────────────────────────────────
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
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.codigo or "SIN-CÓDIGO"} - {self.titulo}'


# ──────────────────────────────────────────────────────────────────────────────
# Modelos relacionados
# ──────────────────────────────────────────────────────────────────────────────

class ProyectoAsignatura(models.Model):
    """
    1.5 Asignaturas que participan en el proyecto RSU.
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='asignaturas')
    nombre_asignatura = models.CharField(max_length=200)
    codigo_asignatura = models.CharField(max_length=50, blank=True, null=True)
    anio_carrera = models.IntegerField(null=True, blank=True)
    semestre = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = 'proyecto_asignaturas'
        verbose_name = 'Asignatura de Proyecto'
        verbose_name_plural = 'Asignaturas de Proyecto'

    def __str__(self):
        return f'{self.nombre_asignatura} - proyecto#{self.proyecto_id}'


class ProyectoDocente(models.Model):
    """
    Docentes adicionales que participan en el proyecto (además del responsable).
    """
    ROLES = [
        ('Colaborador', 'Colaborador'),
        ('Asesor', 'Asesor'),
    ]
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='docentes_adicionales')
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='proyectos_participante')
    rol_en_proyecto = models.CharField(max_length=100, choices=ROLES)

    class Meta:
        db_table = 'proyecto_docentes'
        verbose_name = 'Docente de Proyecto'
        verbose_name_plural = 'Docentes de Proyecto'

    def __str__(self):
        return f'{self.docente.nombres} - proyecto#{self.proyecto_id}'


class ActividadProyecto(models.Model):
    """
    VI. Desarrollo de Actividades - cada actividad conducente al logro de objetivos.
    """
    ESTADOS_ACTIVIDAD = [
        ('pendiente',    'Pendiente'),
        ('en_ejecucion', 'En Ejecución'),
        ('completada',   'Completada'),
    ]
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='actividades')
    nombre = models.CharField(max_length=300, help_text="Nombre de la actividad")
    descripcion = models.TextField(blank=True, null=True, help_text="Descripción breve")
    curso_vinculado = models.CharField(
        max_length=300, blank=True, null=True, help_text="Asignatura vinculada")
    responsable = models.CharField(
        max_length=200, blank=True, null=True, help_text="Responsable de la actividad")
    fecha = models.DateField(null=True, blank=True)
    evidencia_esperada = models.CharField(
        max_length=400, blank=True, null=True,
        help_text="Evidencia esperada (ej: Fotos, listas, informes)")
    # HU-05 (T-89): base del cálculo del % de ejecución del proyecto.
    estado = models.CharField(
        max_length=20, choices=ESTADOS_ACTIVIDAD, default='pendiente', db_index=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'proyecto_actividades'
        verbose_name = 'Actividad de Proyecto'
        verbose_name_plural = 'Actividades de Proyecto'
        ordering = ['orden', 'fecha']

    def __str__(self):
        return f'{self.proyecto.codigo} - {self.nombre}'


class CronogramaAccion(models.Model):
    """
    VII. Cronograma - distribución de acciones a lo largo del periodo de ejecución.
    """
    ESTADOS_AVANCE = [
        ('pendiente',  'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('finalizado', 'Finalizado'),
    ]
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='cronograma')
    descripcion = models.CharField(
        max_length=400, help_text="Descripción de la acción")
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    responsable = models.CharField(
        max_length=200, blank=True, null=True)
    estado_avance = models.CharField(
        max_length=30, choices=ESTADOS_AVANCE, default='pendiente')
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'proyecto_cronograma'
        verbose_name = 'Acción de Cronograma'
        verbose_name_plural = 'Acciones de Cronograma'
        ordering = ['orden']

    def __str__(self):
        return f'{self.proyecto.codigo} - {self.descripcion[:50]}'


class DocumentoSustentoProyecto(models.Model):
    """
    IX. Financiamiento - Documentos Adjuntos de Sustento.
    Permite subir archivos en PDF, Word o Excel (máx. 10MB).
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='documentos_sustento')
    archivo = models.FileField(
        upload_to='proyectos/sustento/',
        validators=[
            FileExtensionValidator(allowed_extensions=DOCUMENTO_SUSTENTO_EXTENSIONS),
            validate_documento_sustento_size,
        ],
    )
    nombre = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'proyecto_documentos_sustento'
        verbose_name = 'Documento de Sustento de Proyecto'
        verbose_name_plural = 'Documentos de Sustento de Proyecto'

    def __str__(self):
        return self.nombre or f'Documento {self.id} - proyecto#{self.proyecto_id}'


class PartidaPresupuestaria(models.Model):
    """
    IX. Financiamiento - Desglose detallado del presupuesto por rubro.
    Corresponde a `presupuesto_proyecto` en el schema DBML.
    """
    CATEGORIAS = [
        ('material_escritorio', 'Material de escritorio'),
        ('refrigerio',          'Refrigerio'),
        ('transporte',          'Transporte'),
        ('otros',               'Otros'),
    ]
    TIPOS_RECURSO = [
        ('humano',     'Humano'),
        ('material',   'Material'),
        ('financiero', 'Financiero'),
    ]
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='partidas_presupuesto')
    categoria = models.CharField(
        max_length=150, choices=CATEGORIAS, blank=True,
        help_text="Categoría del gasto")
    tipo_recurso = models.CharField(
        max_length=50, choices=TIPOS_RECURSO, blank=True,
        help_text="Tipo de recurso")
    descripcion = models.CharField(
        max_length=500, blank=True,
        help_text="Descripción del rubro o concepto de gasto")
    unidad = models.CharField(
        max_length=50, blank=True,
        help_text="Unidad de medida (ej: unidad, hora, taller, kit)")
    cantidad = models.PositiveIntegerField(
        default=1, help_text="Número de unidades")
    costo_unitario = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Costo por unidad en Soles (S/)")
    monto_ejecutado = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Monto efectivamente gastado al cierre")
    fuente = models.ForeignKey(
        'FuenteFinanciamiento', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='partidas',
        help_text="Fuente de financiamiento de este rubro")
    orden = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'presupuesto_proyecto'
        verbose_name = 'Partida Presupuestaria'
        verbose_name_plural = 'Partidas Presupuestarias'
        ordering = ['orden']

    @property
    def monto_presupuestado(self):
        return self.cantidad * self.costo_unitario

    def __str__(self):
        return f'{self.descripcion} - proyecto#{self.proyecto_id}'


class FuenteFinanciamiento(models.Model):
    """
    IX. Financiamiento - Fuentes de financiamiento del proyecto.
    Un proyecto puede tener múltiples fuentes con distintos montos.
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='fuentes_financiamiento')
    fuente = models.CharField(
        max_length=50, choices=ProyectoRSU.FUENTES_FINANCIAMIENTO,
        help_text="Fuente de financiamiento")
    monto = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Monto aportado por esta fuente (S/)")
    descripcion = models.CharField(
        max_length=500, blank=True,
        help_text="Detalle adicional sobre esta fuente")
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fuente_financiamiento_proyecto'
        verbose_name = 'Fuente de Financiamiento'
        verbose_name_plural = 'Fuentes de Financiamiento'

    def __str__(self):
        return f'{self.get_fuente_display()} - S/ {self.monto} - proyecto#{self.proyecto_id}'


class MetaIndicadorProyecto(models.Model):
    """
    IV/V. Metas e Indicadores - Seguimiento cuantitativo del proyecto.
    Cada registro vincula una meta específica con su indicador de medición,
    línea base, valor objetivo y valor alcanzado al cierre.
    Permite actualizarse también durante la ejecución del proyecto.
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='metas_indicadores')
    meta_descripcion = models.CharField(
        max_length=400,
        help_text="Descripción de la meta (ej: Capacitar a 50 docentes en reciclaje)")
    indicador_nombre = models.CharField(
        max_length=300,
        help_text="Nombre del indicador de medición (ej: Nro. de docentes capacitados)")
    unidad_medida = models.CharField(
        max_length=100, blank=True,
        help_text="Unidad de medida del indicador (ej: personas, %, talleres)")
    linea_base = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Valor inicial antes de la intervención (situación de partida)")
    valor_meta = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Valor objetivo a alcanzar al finalizar el proyecto")
    valor_alcanzado = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Valor efectivamente alcanzado — se registra durante/al cierre del proyecto")
    metodo_verificacion = models.TextField(
        blank=True,
        help_text="Cómo se verifica el cumplimiento (ej: Lista de asistencia, Encuesta)")
    fuente_verificacion = models.CharField(
        max_length=300, blank=True,
        help_text="Documento o fuente del dato de verificación")
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'proyecto_metas_indicadores'
        verbose_name = 'Meta e Indicador'
        verbose_name_plural = 'Metas e Indicadores'
        ordering = ['orden']

    def __str__(self):
        return f'{self.meta_descripcion[:60]} - proyecto#{self.proyecto_id}'


class ProyectoEjeSubitem(models.Model):
    """
    1.10 Sub-ítem del eje RSU seleccionado para el proyecto.
    Reemplaza el antiguo JSONField eje_rsu_subitems con integridad referencial.
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='ejes_subitems')
    sub_eje = models.ForeignKey(
        EjeRSUSubitem, on_delete=models.PROTECT, related_name='selecciones')
    detalle = models.TextField(
        blank=True, default='',
        help_text="Texto adicional requerido cuando sub_eje.requiere_detalle es True")

    class Meta:
        db_table = 'proyecto_ejes_subitems'
        verbose_name = 'Sub-ítem de Eje RSU del Proyecto'
        verbose_name_plural = 'Sub-ítems de Eje RSU del Proyecto'
        unique_together = [('proyecto', 'sub_eje')]

    def __str__(self):
        return f'{self.sub_eje} — proyecto#{self.proyecto_id}'


# ============================================================
# SPRINT 4: MÓDULO DE REVISIÓN Y APROBACIÓN (HU-04)
# T-65 / T-66: Modelos de dictamen, historial e notificaciones
# ============================================================

class RevisionProyecto(models.Model):
    """
    T-65/T-66/T-68/T-69: Registra cada dictamen emitido por el
    Administrativo de Departamento (rol Departamento) sobre un proyecto.
    Un proyecto puede tener múltiples revisiones (una por ciclo).
    """
    DECISIONES = [
        ('aprobado',  'Aprobado'),
        ('observado', 'Observado'),
    ]

    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='revisiones',
        help_text='Proyecto evaluado')
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='revisiones_emitidas',
        help_text='Usuario con rol Departamento que emite el dictamen')
    decision = models.CharField(
        max_length=20, choices=DECISIONES,
        help_text='Resultado del dictamen: aprobado | observado')
    comentario_tecnico = models.TextField(
        blank=True, default='',
        help_text='Obligatorio cuando la decisión es "observado". '
                  'Describe las correcciones requeridas.')
    estado_anterior = models.CharField(
        max_length=30,
        help_text='Snapshot del estado del proyecto antes del dictamen')
    estado_nuevo = models.CharField(
        max_length=30,
        help_text='Estado asignado al proyecto por este dictamen')
    created_at = models.DateTimeField(
        default=timezone.now, editable=False,
        help_text='Fecha y hora exacta del dictamen — inmutable')

    class Meta:
        db_table = 'revision_proyecto'
        verbose_name = 'Revisión de Proyecto'
        verbose_name_plural = 'Revisiones de Proyectos'
        ordering = ['-created_at']

    def __str__(self):
        return f'Revisión #{self.id} — {self.decision} — proyecto#{self.proyecto_id}'


class HistorialEstadoProyecto(models.Model):
    """
    T-65/T-66: Registro inmutable (append-only) de todos los cambios
    de estado de cualquier proyecto. Se escribe en cada transición:
    envío a revisión, aprobación, observación, corrección, etc.
    """
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='historial_estados',
        help_text='Proyecto cuyo estado cambió')
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='cambios_estado_proyecto',
        help_text='Usuario que realizó el cambio de estado')
    estado_anterior = models.CharField(
        max_length=30, blank=True, default='',
        help_text='Estado previo del proyecto')
    estado_nuevo = models.CharField(
        max_length=30,
        help_text='Nuevo estado asignado')
    comentario = models.TextField(
        blank=True, default='',
        help_text='Motivo del cambio, observación técnica, etc.')
    ip_address = models.GenericIPAddressField(
        null=True, blank=True,
        help_text='IP del cliente que realizó la acción')
    created_at = models.DateTimeField(
        default=timezone.now, editable=False,
        help_text='Timestamp inmutable del cambio de estado')

    class Meta:
        db_table = 'historial_estado_proyecto'
        verbose_name = 'Historial de Estado de Proyecto'
        verbose_name_plural = 'Historial de Estados de Proyectos'
        ordering = ['-created_at']

    def __str__(self):
        return (f'Proyecto#{self.proyecto_id}: '
                f'{self.estado_anterior} → {self.estado_nuevo} '
                f'por {self.usuario_id}')


class Notificacion(models.Model):
    """
    T-71: Notificaciones internas de la plataforma.
    Se crea automáticamente cuando el Departamento emite un dictamen,
    notificando al docente responsable del resultado.
    """
    TIPOS = [
        ('aprobacion', 'Aprobación'),
        ('observacion', 'Observación'),
        ('envio_revision', 'Enviado a Revisión'),
        ('correccion', 'Corrección Enviada'),
        # HU-05 (T-90): seguimiento de avances
        ('avance_observado', 'Avance Observado'),
        ('avance_corregido', 'Avance Corregido'),
    ]

    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notificaciones',
        help_text='Usuario que recibe la notificación (docente responsable)')
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE,
        null=True, blank=True, related_name='notificaciones',
        help_text='Proyecto al que hace referencia la notificación')
    tipo = models.CharField(
        max_length=50, choices=TIPOS,
        help_text='Tipo de evento que originó la notificación')
    titulo = models.CharField(
        max_length=300,
        help_text='Título breve de la notificación')
    mensaje = models.TextField(
        help_text='Detalle completo: resultado, evaluador, fecha, comentario técnico si aplica')
    leida = models.BooleanField(
        default=False,
        help_text='Si el destinatario ya leyó la notificación')
    leida_en = models.DateTimeField(
        null=True, blank=True,
        help_text='Timestamp cuando fue marcada como leída')
    created_at = models.DateTimeField(
        default=timezone.now, editable=False)

    class Meta:
        db_table = 'notificaciones'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.tipo}] → {self.destinatario_id}: {self.titulo}'


class AvanceActividad(models.Model):
    """
    HU-05 (T-86): Registro de avances de una actividad del proyecto.

    Historial append-only (no se edita ni elimina) que guarda, por cada avance:
    descripción, estado actualizado de la actividad, observaciones, autor
    (docente responsable) y fecha/hora (CA-05). La Jefatura RSU / Departamento /
    Administrador pueden observarlo, lo que notifica al docente (T-90).
    """
    ESTADOS_REVISION = [
        ('registrado', 'Registrado'),
        ('observado',  'Observado'),
        ('corregido',  'Corregido'),
    ]
    proyecto = models.ForeignKey(
        ProyectoRSU, on_delete=models.CASCADE, related_name='avances')
    actividad = models.ForeignKey(
        ActividadProyecto, on_delete=models.CASCADE, related_name='avances')
    descripcion = models.TextField(help_text="Descripción del avance realizado.")
    estado_actividad = models.CharField(
        max_length=20, choices=ActividadProyecto.ESTADOS_ACTIVIDAD,
        help_text="Estado que se fija a la actividad con este avance.")
    observaciones = models.TextField(
        blank=True, null=True, help_text="Observaciones del docente (opcional).")

    # Flujo de revisión del avance (T-90)
    estado_revision = models.CharField(
        max_length=20, choices=ESTADOS_REVISION, default='registrado', db_index=True)
    comentario_revision = models.TextField(
        blank=True, null=True, help_text="Comentario del revisor al observar el avance.")

    # Trazabilidad (CA-05)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='avances_registrados',
        help_text="Docente responsable que registró el avance.")
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='avances_revisados',
        help_text="Usuario que observó el avance (Jefatura RSU/Departamento/Admin).")
    created_at = models.DateTimeField(auto_now_add=True)
    revisado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'proyecto_avances'
        verbose_name = 'Avance de Actividad'
        verbose_name_plural = 'Avances de Actividad'
        ordering = ['-created_at']

    def __str__(self):
        return f'Avance #{self.id} - actividad#{self.actividad_id} [{self.estado_actividad}]'


class EvidenciaAvance(models.Model):
    """
    HU-05 (T-87): Evidencia digital asociada a un avance.

    Admite archivo local (PDF/JPG/JPEG/PNG - CA-03/CA-04) o enlace de Google
    Drive (recomendado por el cliente para no saturar el servidor). El borrado
    es lógico (soft-delete) para conservar la trazabilidad del proyecto.
    """
    TIPOS = [
        ('archivo', 'Archivo'),
        ('enlace',  'Enlace Drive'),
    ]
    avance = models.ForeignKey(
        AvanceActividad, on_delete=models.CASCADE, related_name='evidencias')
    tipo = models.CharField(max_length=10, choices=TIPOS)
    archivo = models.FileField(
        upload_to='proyectos/evidencias/', null=True, blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=EVIDENCIA_EXTENSIONS),
            validate_evidencia_size,
        ],
    )
    enlace_drive = models.URLField(blank=True, null=True)
    nombre = models.CharField(max_length=255, blank=True, null=True)
    # Soft-delete: se conserva el registro histórico (regla de trazabilidad).
    eliminada = models.BooleanField(default=False, db_index=True)
    eliminada_en = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'proyecto_evidencias'
        verbose_name = 'Evidencia de Avance'
        verbose_name_plural = 'Evidencias de Avance'
        ordering = ['-uploaded_at']

    def clean(self):
        if self.tipo == 'archivo':
            if not self.archivo:
                raise ValidationError({'archivo': 'Debe adjuntar un archivo cuando el tipo es "archivo".'})
            if self.enlace_drive:
                raise ValidationError({'enlace_drive': 'No use enlace cuando el tipo es "archivo".'})
        elif self.tipo == 'enlace':
            if not self.enlace_drive:
                raise ValidationError({'enlace_drive': 'Debe indicar un enlace de Drive cuando el tipo es "enlace".'})
            if self.archivo:
                raise ValidationError({'archivo': 'No adjunte archivo cuando el tipo es "enlace".'})

    def __str__(self):
        return self.nombre or f'Evidencia {self.id} - avance#{self.avance_id}'
