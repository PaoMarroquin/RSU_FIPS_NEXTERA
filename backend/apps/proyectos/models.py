from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.usuarios.models import Facultad, EscuelaProfesional, DepartamentoAcademico
from apps.planificacion.models import PeriodoAcademico, EjeRSU, LineaEstrategica, ObjetivoInstitucional, ODS


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

    # 1.9 Beneficiarios / Destinatarios (checkboxes, only one text field for benef_otro)
    benef_comunidad_universitaria = models.BooleanField(
        default=False, help_text="1.9a Comunidad universitaria - interna")
    benef_inst_educativas_basicas = models.BooleanField(
        default=False, help_text="1.9b Instituciones Educativas Básico Regulares")
    benef_inst_educativas_especiales = models.BooleanField(
        default=False, help_text="1.9c Instituciones Educativas Especiales")
    benef_gobierno_local = models.BooleanField(
        default=False, help_text="1.9d Gobierno Local")
    benef_gobierno_regional = models.BooleanField(
        default=False, help_text="1.9d Gobierno Regional")
    benef_gobierno_nacional = models.BooleanField(
        default=False, help_text="1.9d Gobierno Nacional")
    benef_asociaciones = models.BooleanField(
        default=False, help_text="1.9e Asociaciones")
    benef_organizaciones_comunales = models.BooleanField(
        default=False, help_text="1.9f Organizaciones comunales")
    benef_sector_empresarial = models.BooleanField(
        default=False, help_text="1.9g Sector empresarial")
    benef_sectores_laborales = models.BooleanField(
        default=False, help_text="1.9h Sectores laborales")
    benef_centros_penitenciarios = models.BooleanField(
        default=False, help_text="1.9i Centros Penitenciarios")
    benef_otro = models.BooleanField(
        default=False, help_text="1.9j Otro")
    benef_otro_detalle = models.CharField(
        max_length=500, blank=True, null=True)

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
    eje_rsu_subitems = models.JSONField(
        default=dict, blank=True,
        help_text="1.10 Sub-ítems seleccionados por eje RSU (Gestión, Formación, Investigación, Extensión)")
    eje_rsu_otro_detalle = models.TextField(
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

    # 1.12 - 1.13  Meta e indicador
    meta_cuantitativa = models.CharField(
        max_length=400, blank=True, null=True,
        help_text="1.12 Meta cuantificable (ej: Capacitar a 50 docentes)")
    indicador = models.CharField(
        max_length=400, blank=True, null=True,
        help_text="1.13 Indicador propuesto en el plan (ej: N° de docentes capacitados)")

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
        return f'{self.docente.nombre_completo} - proyecto#{self.proyecto_id}'


class ActividadProyecto(models.Model):
    """
    VI. Desarrollo de Actividades - cada actividad conducente al logro de objetivos.
    """
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
    mes_semana = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Periodo de ejecución (ej: Mes 1, Sem 2)")
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
    archivo = models.FileField(upload_to='proyectos/sustento/')
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
        ('movilidad',         'Movilidad'),
        ('material_educativo','Material educativo'),
        ('equipos',           'Equipos'),
        ('alimentacion',      'Alimentación'),
        ('servicios',         'Servicios'),
        ('otros',             'Otros'),
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
    fuente = models.CharField(
        max_length=50, choices=ProyectoRSU.FUENTES_FINANCIAMIENTO,
        blank=True, null=True,
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

