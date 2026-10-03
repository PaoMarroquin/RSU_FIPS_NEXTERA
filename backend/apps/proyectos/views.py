"""
Vistas del modulo de proyectos RSU: formulacion, revision y seguimiento.

Concentra el ciclo de vida completo del proyecto y las reglas de quien puede
verlo y tocarlo en cada estado.

Visibilidad por rol (_filter_proyectos_por_rol): el Administrador ve todo; la
Jefatura RSU ve su facultad; el Departamento ve su departamento; el Docente
ve los suyos. Los sub-recursos reutilizan ese mismo criterio a traves de
_verificar_proyecto_visible, para que la lectura no se salte el scope.

Bloques de vistas:
- Proyecto: alta, edicion, envio a revision y continuacion entre semestres.
- Detalle del ANEXO 4: actividades, cronograma, financiamiento, presupuesto
  y metas e indicadores.
- Revision y aprobacion (HU-04): bandeja del Departamento, aprobar y
  observar. Observar exige comentario tecnico.
- Notificaciones: listado y marcado de leidas.
- Seguimiento (HU-05): registro de avances y evidencias, observacion de un
  avance y correccion por parte del docente.

Reglas de estado que se hacen cumplir aqui:
- Solo se edita en borrador u observado.
- Solo se envia a revision con los campos obligatorios del ANEXO 4 completos.
- Solo se aprueba u observa un proyecto en revision.
- Solo se registran avances en proyectos aprobados o en ejecucion, y solo el
  docente responsable. El primer avance pasa el proyecto a en_ejecucion.
- El porcentaje de ejecucion se recalcula solo, nunca se escribe a mano.

Conecta con:
- apps/proyectos/models.py y serializers.py: datos y validacion.
- apps/proyectos/urls.py: rutas que exponen estas vistas.
- apps/utils/permissions.py: control de acceso por rol.
- apps/proyectos/views_consolidado.py: reutiliza el criterio de visibilidad
  para los informes de HU-06.
"""
from decimal import Decimal
from rest_framework import generics, status, serializers, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, F, ExpressionWrapper, DecimalField
from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.utils.permissions import (
    IsOwnerOrReadOnly, IsDepartamento, IsAdministrador, IsJefaturaRSU
)
from apps.planificacion.models import PeriodoAcademico
from .models import (
    ProyectoRSU, ProyectoDocente, ActividadProyecto, CronogramaAccion,
    PartidaPresupuestaria, MetaIndicadorProyecto, FuenteFinanciamiento,
    ProyectoEjeSubitem, RevisionProyecto, HistorialEstadoProyecto, Notificacion,
    AvanceActividad, EvidenciaAvance,
)
from .serializers import (
    ProyectoRSUSerializer,
    ActividadProyectoSerializer,
    CronogramaAccionSerializer,
    PartidaPresupuestariaSerializer,
    MetaIndicadorProyectoSerializer,
    FuenteFinanciamientoSerializer,
    RevisionProyectoSerializer,
    NotificacionSerializer,
    AvanceActividadSerializer,
    EvidenciaAvanceSerializer,
)
from apps.usuarios.models import Rol


def _proyecto_qs_base():
    return ProyectoRSU.objects.select_related(
        'facultad', 'escuela', 'departamento', 'periodo',
        'linea_estrategica', 'objetivo_institucional',
        'docente_responsable', 'informe_finalizacion',
    ).prefetch_related(
        'ejes_rsu', 'ods', 'objetivos_regionales', 'objetivos_nacionales',
        'asignaturas', 'docentes_adicionales',
        'actividades__acciones', 'cronograma',
        'ejes_subitems__sub_eje',
        'fuentes_financiamiento__partidas',
    )


def get_proyecto_editable(pk, user):
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        raise PermissionDenied('No tienes permisos para modificar este proyecto.')
    if proyecto.estado not in ['borrador', 'observado']:
        raise serializers.ValidationError(
            'Solo se pueden modificar proyectos en estado Borrador u Observado.')
    return proyecto


TEXTOS_OBLIGATORIOS = [
    ('titulo', 'El título del proyecto'),
    ('lugar_ejecucion', 'El lugar de ejecución (1.18)'),
    ('fund_por_que_grupo', '¿Por qué se eligió el grupo beneficiario?'),
    ('fund_para_que_proyecto', '¿Para qué servirá el proyecto?'),
    ('fund_mecanismo_ensenanza', 'El mecanismo de enseñanza-aprendizaje'),
    ('diag_estado_grupo', 'El estado actual del grupo beneficiario'),
    ('diag_problemas_detectados', 'Los problemas detectados'),
    ('diag_aportes_formacion', 'Los aportes desde la formación profesional'),
    ('diag_justificacion_intervencion', 'La justificación de la intervención'),
    ('obj_logro_intervencion', 'El objetivo de intervención (IV)'),
    ('obj_mejora_curricular', 'La mejora curricular esperada (IV)'),
    ('resultado_en_beneficiarios', 'Los resultados esperados en los beneficiarios'),
    ('resultado_en_curriculo', 'Los resultados esperados en el proceso curricular'),
    ('rec_mat_material_didactico', 'El material didáctico (VIII)'),
    ('rec_mat_afiches', 'Los afiches (VIII)'),
    ('rec_mat_equipos', 'Los equipos (VIII)'),
    ('rec_mat_utiles', 'Los útiles (VIII)'),
    ('rec_mat_otros', 'Otros materiales (VIII)'),
]

FECHAS_OBLIGATORIAS = [
    ('fecha_inicio', 'La fecha de inicio (1.14)'),
    ('fecha_evaluacion_avance', 'La fecha de evaluación de avance (1.15)'),
    ('fecha_termino', 'La fecha de término (1.16)'),
    ('fecha_encuesta_docentes', 'La fecha de encuesta a docentes (1.17)'),
    ('fecha_encuesta_alumnos', 'La fecha de encuesta a estudiantes (1.17)'),
    ('fecha_encuesta_grupo_destinatario', 'La fecha de encuesta al grupo destinatario (1.17)'),
]


def _vacio(valor):
    return not valor or not str(valor).strip()


def _validar_campos_obligatorios(proyecto):
    """
    Errores que impiden enviar a revisión, o {} si el proyecto está completo.

    Al enviar, todos los campos del ANEXO 4 deben estar llenos. En los campos
    de texto que no le apliquen, el docente puede escribir "n/a", pero no
    dejarlos vacíos. El borrador, en cambio, se guarda con lo que haya.
    """
    errores = {}

    for campo, label in TEXTOS_OBLIGATORIOS:
        if _vacio(getattr(proyecto, campo, None)):
            errores[campo] = f'{label} es obligatorio (escriba "n/a" si no aplica).'
    for campo, label in FECHAS_OBLIGATORIAS:
        if not getattr(proyecto, campo):
            errores[campo] = f'{label} es obligatoria.'
    if proyecto.fecha_inicio and proyecto.fecha_termino and proyecto.fecha_termino < proyecto.fecha_inicio:
        errores['fecha_termino'] = 'La fecha de término no puede ser anterior a la de inicio.'

    for campo, label in [
        ('periodo_id', 'El periodo académico'),
        ('facultad_id', 'La facultad'),
        ('escuela_id', 'La escuela profesional'),
        ('departamento_id', 'El departamento académico'),
    ]:
        if not getattr(proyecto, campo):
            errores[campo.replace('_id', '')] = f'{label} es obligatorio.'

    tipos = proyecto.tipo_actividad or []
    if not tipos:
        errores['tipo_actividad'] = 'Debe seleccionar al menos un tipo de actividad (1.11).'
    elif 'otro' in tipos and _vacio(proyecto.tipo_actividad_otro):
        errores['tipo_actividad_otro'] = 'Describa el tipo de actividad "Otro" (1.11).'

    nro_docentes = proyecto.nro_docentes or 0
    nombres = proyecto.docentes_participantes or []
    if nro_docentes < 1:
        errores['nro_docentes'] = 'Debe participar al menos un docente (1.7).'
    elif len(nombres) != nro_docentes:
        errores['docentes_participantes'] = (
            f'Registre el nombre de los {nro_docentes} docentes participantes (1.7).')
    if proyecto.nro_estudiantes is None:
        errores['nro_estudiantes'] = 'Indique el número de estudiantes (1.8).'

    if not proyecto.ejes_rsu.exists():
        errores['ejes_rsu'] = 'Debe seleccionar al menos un eje RSU (1.10).'
    if not proyecto.beneficiarios.exists() and _vacio(proyecto.benef_otro_detalle):
        errores['beneficiarios'] = 'Debe seleccionar al menos un tipo de beneficiario (1.9).'
    if not proyecto.ods.exists():
        errores['ods'] = 'Debe seleccionar al menos un ODS.'
    if not proyecto.asignaturas.exists():
        errores['asignaturas'] = 'Debe registrar al menos una asignatura vinculada (1.5).'

    errores.update(_validar_actividades_y_cronograma(proyecto))

    total_rrhh = sum(getattr(proyecto, c) or 0 for c in (
        'rec_hum_docentes', 'rec_hum_administrativos', 'rec_hum_estudiantes',
        'rec_hum_egresados', 'rec_hum_voluntarios', 'rec_hum_otros'))
    if total_rrhh < 1:
        errores['recursos_humanos'] = 'Debe registrar al menos un recurso humano (VIII).'
    if not proyecto.fuentes_financiamiento.exists():
        errores['fuentes_financiamiento'] = 'Debe registrar al menos una fuente de financiamiento (IX).'

    errores.update(_validar_indicadores_y_presupuesto(proyecto))

    return errores


def _validar_actividades_y_cronograma(proyecto):
    """VI y VII: cada actividad con nombre, descripción y su bloque de acciones completo."""
    errores = {}
    actividades = list(proyecto.actividades.prefetch_related('acciones'))
    if not actividades:
        return {'actividades': 'Debe registrar al menos una actividad (VI).'}

    for i, act in enumerate(actividades, start=1):
        if _vacio(act.nombre) or _vacio(act.descripcion):
            errores['actividades'] = f'La actividad {i} necesita nombre y descripción (VI).'
            break

    for i, act in enumerate(actividades, start=1):
        acciones = list(act.acciones.all())
        if not acciones:
            errores['cronograma'] = f'La actividad {i} ("{act.nombre}") no tiene acciones en el cronograma (VII).'
            break
        incompleta = next((a for a in acciones if _vacio(a.descripcion) or _vacio(a.responsable)
                           or _vacio(a.evidencia_esperada) or not a.fecha_inicio or not a.fecha_fin), None)
        if incompleta:
            errores['cronograma'] = (
                f'En la actividad {i} hay acciones sin descripción, fechas, responsable '
                'o evidencia esperada (VII).')
            break

    if 'cronograma' not in errores and proyecto.cronograma.filter(actividad__isnull=True).exists():
        errores['cronograma'] = 'Todas las acciones del cronograma deben pertenecer a una actividad (VII).'
    return errores


def _validar_indicadores_y_presupuesto(proyecto):
    """HU-05 AC#2/AC#3: indicador cuantitativo obligatorio y presupuesto > 0 antes de enviar a revisión."""
    errores = {}

    if not proyecto.metas_indicadores.filter(valor_meta__isnull=False).exists():
        errores['metas_indicadores'] = (
            'Debe definir al menos un indicador de cumplimiento cuantitativo '
            '(con meta numérica) antes de enviar a revisión.'
        )

    total_presupuesto = sum(
        (p.monto_presupuestado for p in proyecto.partidas_presupuesto.all()),
        Decimal('0'),
    )
    if total_presupuesto <= 0:
        errores['presupuesto'] = (
            'Debe registrar al menos una partida presupuestaria con monto '
            'mayor a cero antes de enviar a revisión.'
        )

    return errores


def _registrar_historial(proyecto, usuario, estado_anterior, estado_nuevo,
                          comentario='', request=None):
    """Helper T-66/T-70: Crea un HistorialEstadoProyecto de forma centralizada."""
    ip = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
    HistorialEstadoProyecto.objects.create(
        proyecto=proyecto,
        usuario=usuario,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        comentario=comentario,
        ip_address=ip,
    )


def _crear_notificacion(destinatario, proyecto, tipo, titulo, mensaje):
    """Helper T-71: Crea una Notificacion interna de forma centralizada."""
    Notificacion.objects.create(
        destinatario=destinatario,
        proyecto=proyecto,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
    )


def _filter_proyectos_por_rol(qs, user):
    """Visibilidad por rol: Admin ve todo; Jefatura ve su facultad; Departamento ve su departamento; Docente ve los suyos."""
    if user.is_staff or (user.rol and user.rol.nombre == Rol.ADMINISTRADOR):
        return qs
    if user.rol and user.rol.nombre == Rol.JEFATURA:
        return qs.filter(facultad=user.facultad).exclude(estado='borrador') if user.facultad else qs.none()
    if user.rol and user.rol.nombre == Rol.DEPARTAMENTO:
        return qs.filter(departamento=user.departamento).exclude(estado='borrador') if user.departamento else qs.none()
    if user.rol and user.rol.nombre == Rol.DOCENTE:
        return qs.filter(
            Q(docente_responsable=user) | Q(docentes_adicionales__docente=user)
        ).distinct()
    return qs.none()


def _verificar_proyecto_visible(pk, user):
    """Lanza 404 si el proyecto no es visible para el usuario según su rol
    (mismo criterio que ProyectoListCreateView). Usar en get_queryset() de los
    sub-recursos (actividades, cronograma, presupuesto, indicadores) para que
    la lectura respete el mismo scope que ya se aplica a escritura."""
    if not _filter_proyectos_por_rol(ProyectoRSU.objects.all(), user).filter(pk=pk).exists():
        raise Http404


class ProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ProyectoRSUSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'codigo', 'docente_responsable__nombres', 'escuela__nombre']
    ordering_fields = ['titulo', 'estado', 'created_at', 'anio_carrera', 'periodo__nombre']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = _filter_proyectos_por_rol(_proyecto_qs_base(), user).order_by('-created_at')

        # ?facultad solo respetado para Admin (los demás roles tienen su scope fijado)
        if user.is_staff or (user.rol and user.rol.nombre == Rol.ADMINISTRADOR):
            facultad_id = self.request.query_params.get('facultad')
            if facultad_id:
                qs = qs.filter(facultad_id=facultad_id)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        periodo_id = self.request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            from apps.utils.permissions import IsDocenteOrAdmin
            return [IsAuthenticated(), IsDocenteOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        docente = self.request.user
        facultad_id = serializer.validated_data.get('facultad_id') or (
            serializer.validated_data.get('facultad').id
            if serializer.validated_data.get('facultad') else None)
        titulo = (serializer.validated_data.get('titulo') or '').strip()
        existente = ProyectoRSU.objects.filter(
            docente_responsable=docente,
            facultad_id=facultad_id,
            titulo=titulo,
            estado='borrador',
        ).first()
        if existente:
            # Evita duplicados en reintentos: retorna el borrador existente
            serializer.instance = existente
            return
        serializer.save(docente_responsable=docente)


class ProyectoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProyectoRSUSerializer

    def get_queryset(self):
        user = self.request.user
        qs = _filter_proyectos_por_rol(_proyecto_qs_base(), user)

        # Para DELETE, Docente solo puede borrar si es responsable
        if (self.request.method == 'DELETE'
                and user.rol and user.rol.nombre == Rol.DOCENTE):
            return _proyecto_qs_base().filter(docente_responsable=user)

        return qs

    def get_permissions(self):
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def perform_destroy(self, instance):
        if instance.estado != 'borrador':
            raise serializers.ValidationError(
                'Solo se pueden eliminar proyectos en estado Borrador.'
            )
        instance.delete()


class ProyectoEnviarRevisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        proyecto = get_object_or_404(
            ProyectoRSU.objects
            .select_related(
                'facultad', 'escuela', 'departamento', 'periodo',
                'linea_estrategica', 'objetivo_institucional',
                'docente_responsable',
            )
            .prefetch_related('ejes_rsu', 'ods', 'asignaturas', 'docentes_adicionales',
                              'actividades', 'cronograma'),
            pk=pk,
        )

        if proyecto.docente_responsable != request.user:
            raise PermissionDenied('No tienes permisos para enviar este proyecto a revisión.')

        if proyecto.estado not in ['borrador', 'observado']:
            raise serializers.ValidationError(
                {'detail': f'El estado "{proyecto.estado}" no permite envío a revisión.'}
            )

        errores = _validar_campos_obligatorios(proyecto)
        if errores:
            raise serializers.ValidationError(
                {'detail': 'Faltan completar campos obligatorios.', 'errors': errores}
            )

        if not proyecto.es_continuacion and proyecto.anio_carrera:
            conflicto = ProyectoRSU.objects.filter(
                escuela=proyecto.escuela,
                periodo=proyecto.periodo,
                anio_carrera=proyecto.anio_carrera,
                es_continuacion=False,
                estado__in=['en_revision', 'corregido', 'aprobado', 'en_ejecucion', 'finalizado'],
            ).exclude(pk=proyecto.pk).exists()
            if conflicto:
                raise serializers.ValidationError({
                    'detail': 'Ya existe otro proyecto activo para este año/escuela/periodo.',
                    'errors': {'anio_carrera': 'Conflicto de unicidad.'},
                })

        estado_anterior = proyecto.estado
        proyecto.estado = 'en_revision'
        proyecto.fecha_envio_revision = timezone.now()
        proyecto.save(update_fields=['estado', 'fecha_envio_revision'])

        # T-70: Registrar historial de cambio de estado
        _registrar_historial(
            proyecto=proyecto,
            usuario=request.user,
            estado_anterior=estado_anterior,
            estado_nuevo='en_revision',
            comentario='Docente envió el proyecto a revisión.',
            request=request,
        )

        serializer = ProyectoRSUSerializer(
            _proyecto_qs_base().get(pk=pk),
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActividadProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return ActividadProyecto.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class ActividadProyectoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActividadProyectoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return ActividadProyecto.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


class CronogramaAccionListCreateView(generics.ListCreateAPIView):
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return CronogramaAccion.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class CronogramaAccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CronogramaAccionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return CronogramaAccion.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


# ─── Presupuesto ─────────────────────────────────────────────────────────────

class PartidaPresupuestariaListCreateView(generics.ListCreateAPIView):
    serializer_class = PartidaPresupuestariaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return PartidaPresupuestaria.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class PartidaPresupuestariaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PartidaPresupuestariaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return PartidaPresupuestaria.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


class FuenteFinanciamientoListCreateView(generics.ListCreateAPIView):
    serializer_class = FuenteFinanciamientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return FuenteFinanciamiento.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class FuenteFinanciamientoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FuenteFinanciamientoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return FuenteFinanciamiento.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


class PresupuestoResumenView(APIView):
    """
    GET /proyectos/<proyecto_pk>/presupuesto/resumen/
    Devuelve el total estimado, desglose por categoría y fuente, datos del docente
    y estado de confirmación del financiamiento.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, proyecto_pk):
        proyecto = get_object_or_404(
            _filter_proyectos_por_rol(
                ProyectoRSU.objects.select_related('docente_responsable'), request.user
            ),
            pk=proyecto_pk,
        )
        partidas = PartidaPresupuestaria.objects.filter(proyecto_id=proyecto_pk)

        total_presupuestado = sum(p.monto_presupuestado for p in partidas)
        total_ejecutado = sum(p.monto_ejecutado for p in partidas)

        por_categoria = {}
        por_fuente = {}
        for p in partidas:
            cat_key = p.categoria or 'sin_especificar'
            cat_label = dict(PartidaPresupuestaria.CATEGORIAS).get(cat_key, 'Sin especificar')
            if cat_key not in por_categoria:
                por_categoria[cat_key] = {'categoria': cat_label, 'presupuestado': 0, 'ejecutado': 0}
            por_categoria[cat_key]['presupuestado'] += float(p.monto_presupuestado)
            por_categoria[cat_key]['ejecutado'] += float(p.monto_ejecutado)

            fuente_key = p.fuente or 'sin_especificar'
            fuente_label = p.get_fuente_display() if p.fuente else 'Sin especificar'
            if fuente_key not in por_fuente:
                por_fuente[fuente_key] = {'fuente': fuente_label, 'presupuestado': 0, 'ejecutado': 0}
            por_fuente[fuente_key]['presupuestado'] += float(p.monto_presupuestado)
            por_fuente[fuente_key]['ejecutado'] += float(p.monto_ejecutado)

        docente = proyecto.docente_responsable
        docente_data = None
        if docente:
            firma_url = None
            if docente.firma_digital:
                firma_url = request.build_absolute_uri(docente.firma_digital.url)
            docente_data = {
                'id': docente.id,
                'nombres': docente.nombres,
                'apellidos': docente.apellidos,
                'correo_institucional': docente.correo_institucional,
                'firma_digital': firma_url,
            }

        return Response({
            'proyecto_id': proyecto_pk,
            'total_presupuestado': float(total_presupuestado),
            'total_ejecutado': float(total_ejecutado),
            'nro_partidas': partidas.count(),
            'desglose_por_categoria': list(por_categoria.values()),
            'desglose_por_fuente': list(por_fuente.values()),
            'docente_responsable': docente_data,
            'financiamiento_confirmado': proyecto.financiamiento_confirmado,
            'financiamiento_fecha_confirmacion': proyecto.financiamiento_fecha_confirmacion,
        })


class FinanciamientoConfirmarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, proyecto_pk):
        proyecto = get_object_or_404(
            ProyectoRSU.objects.select_related('docente_responsable'),
            pk=proyecto_pk,
        )
        if proyecto.docente_responsable != request.user:
            return Response(
                {'error': 'Sin permiso',
                 'detail': 'Solo el docente responsable puede confirmar el financiamiento.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not request.user.firma_digital:
            return Response(
                {'error': 'Sin firma digital',
                 'detail': 'Debe cargar su firma digital antes de confirmar el financiamiento.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        proyecto.financiamiento_confirmado = True
        proyecto.financiamiento_fecha_confirmacion = timezone.now()
        proyecto.save(update_fields=['financiamiento_confirmado', 'financiamiento_fecha_confirmacion'])
        return Response(
            {
                'financiamiento_confirmado': proyecto.financiamiento_confirmado,
                'financiamiento_fecha_confirmacion': proyecto.financiamiento_fecha_confirmacion,
            },
            status=status.HTTP_200_OK,
        )


# ─── Metas e Indicadores ─────────────────────────────────────────────────────

class MetaIndicadorProyectoListCreateView(generics.ListCreateAPIView):
    serializer_class = MetaIndicadorProyectoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return MetaIndicadorProyecto.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).order_by('orden')

    def perform_create(self, serializer):
        proyecto = get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        serializer.save(proyecto=proyecto)


class MetaIndicadorProyectoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MetaIndicadorProyectoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return MetaIndicadorProyecto.objects.filter(proyecto_id=self.kwargs['proyecto_pk'])

    def update(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        get_proyecto_editable(self.kwargs['proyecto_pk'], self.request.user)
        return super().destroy(request, *args, **kwargs)


# ─── Continuación de proyectos ────────────────────────────────────────────────

class ProyectoContinuarView(APIView):
    """
    POST /proyectos/<pk>/continuar/
    Crea una continuación del proyecto en un nuevo periodo.
    Copia los campos principales, conserva los docentes originales
    y permite añadir nuevos docentes adicionales.

    Body: { "periodo": <id>, "docentes_adicionales": [{"docente": <id>, "rol_en_proyecto": "..."}] }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        original = get_object_or_404(
            ProyectoRSU.objects.select_related(
                'facultad', 'escuela', 'departamento',
                'linea_estrategica', 'objetivo_institucional',
                'docente_responsable',
            ).prefetch_related('ejes_rsu', 'ods', 'docentes_adicionales__docente'),
            pk=pk,
        )

        if original.docente_responsable != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Sin permiso',
                 'detail': 'Solo el docente responsable puede crear una continuación.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        estados_validos = ['aprobado', 'en_ejecucion', 'finalizado']
        if original.estado not in estados_validos:
            return Response(
                {'error': 'Estado inválido',
                 'detail': f'Solo se puede continuar un proyecto en estado: {", ".join(estados_validos)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        periodo_id = request.data.get('periodo')
        if not periodo_id:
            return Response(
                {'error': 'Campo requerido', 'detail': 'Debe indicar el periodo para la continuación.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            nuevo_periodo = PeriodoAcademico.objects.get(pk=periodo_id)
        except PeriodoAcademico.DoesNotExist:
            return Response(
                {'error': 'No encontrado', 'detail': f'No existe un periodo con id={periodo_id}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ProyectoRSU.objects.filter(proyecto_origen=original, periodo=nuevo_periodo).exists():
            return Response(
                {'error': 'Duplicado',
                 'detail': 'Ya existe una continuación de este proyecto para ese periodo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nuevos_docentes = request.data.get('docentes_adicionales', [])

        with transaction.atomic():
            nuevo = ProyectoRSU.objects.create(
                facultad=original.facultad,
                escuela=original.escuela,
                departamento=original.departamento,
                eje_detalle=original.eje_detalle,
                linea_estrategica=original.linea_estrategica,
                objetivo_institucional=original.objetivo_institucional,
                titulo=f'{original.titulo} (Continuación)',
                anio_carrera=original.anio_carrera,
                es_tesis_quinto_anio=original.es_tesis_quinto_anio,
                docente_responsable=original.docente_responsable,
                periodo=nuevo_periodo,
                semestre_academico=nuevo_periodo.nombre,
                estado='borrador',
                es_continuacion=True,
                proyecto_origen=original,
                fund_por_que_grupo=original.fund_por_que_grupo,
                fund_para_que_proyecto=original.fund_para_que_proyecto,
                fund_mecanismo_ensenanza=original.fund_mecanismo_ensenanza,
                diag_estado_grupo=original.diag_estado_grupo,
                diag_problemas_detectados=original.diag_problemas_detectados,
                diag_aportes_formacion=original.diag_aportes_formacion,
                diag_justificacion_intervencion=original.diag_justificacion_intervencion,
            )
            nuevo.ods.set(original.ods.all())
            nuevo.ejes_rsu.set(original.ejes_rsu.all())
            nuevo.objetivos_regionales.set(original.objetivos_regionales.all())
            nuevo.objetivos_nacionales.set(original.objetivos_nacionales.all())

            for es in original.ejes_subitems.all():
                ProyectoEjeSubitem.objects.create(
                    proyecto=nuevo, sub_eje=es.sub_eje, detalle=es.detalle,
                )

            # Docentes originales (responsable ya está en docente_responsable, copiar adicionales)
            for pd in original.docentes_adicionales.all():
                ProyectoDocente.objects.create(
                    proyecto=nuevo,
                    docente=pd.docente,
                    rol_en_proyecto=pd.rol_en_proyecto,
                )

            # Nuevos docentes adicionales enviados en el request
            for item in nuevos_docentes:
                docente_id = item.get('docente')
                rol = item.get('rol_en_proyecto', 'Colaborador')
                if docente_id:
                    ProyectoDocente.objects.get_or_create(
                        proyecto=nuevo,
                        docente_id=docente_id,
                        defaults={'rol_en_proyecto': rol},
                    )

        serializer = ProyectoRSUSerializer(
            _proyecto_qs_base().get(pk=nuevo.pk),
            context={'request': request},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================================
# SPRINT 4: MÓDULO DE REVISIÓN Y APROBACIÓN (HU-04)
# ============================================================

class ProyectosParaRevisarView(generics.ListAPIView):
    """
    T-67: Lista proyectos en revisión correspondientes al departamento
    del usuario (Administrativo de Departamento).
    """
    serializer_class = ProyectoRSUSerializer
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    def get_queryset(self):
        user = self.request.user
        qs = _proyecto_qs_base().filter(estado='en_revision').order_by('fecha_envio_revision')
        if not user.is_staff and not (user.rol and user.rol.nombre == Rol.ADMINISTRADOR):
            qs = qs.filter(departamento=user.departamento)
        return qs


def _observaciones_secciones(request):
    """Observaciones por sección del formulario, con las mismas claves que usa el docente."""
    secciones = request.data.get('observaciones_secciones') or {}
    if not isinstance(secciones, dict):
        raise serializers.ValidationError({'observaciones_secciones': 'Debe ser un objeto {sección: texto}.'})
    invalidas = [k for k in secciones if k not in RevisionProyecto.SECCIONES]
    if invalidas:
        raise serializers.ValidationError({'observaciones_secciones': (
            f'Secciones no válidas: {", ".join(invalidas)}. Use: {", ".join(RevisionProyecto.SECCIONES)}.')})
    return {k: str(v).strip() for k, v in secciones.items() if str(v or '').strip()}


class ProyectoAprobarView(APIView):
    """
    T-68: Aprueba un proyecto en revisión.
    """
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = get_object_or_404(ProyectoRSU, pk=pk)
        
        # Validación de visibilidad / permisos
        if not request.user.is_staff and not (request.user.rol and request.user.rol.nombre == Rol.ADMINISTRADOR):
            if proyecto.departamento != request.user.departamento:
                raise PermissionDenied('No tienes permisos sobre este proyecto.')

        if proyecto.estado != 'en_revision':
            raise serializers.ValidationError('El proyecto no está en revisión.')

        # El Departamento asigna el número del proyecto al aprobarlo.
        codigo = (request.data.get('codigo') or '').strip()
        if not codigo:
            raise serializers.ValidationError(
                {'codigo': 'Debe asignar el número del proyecto para aprobarlo.'})
        if len(codigo) > 50:
            raise serializers.ValidationError({'codigo': 'El número admite hasta 50 caracteres.'})
        if ProyectoRSU.objects.filter(codigo=codigo).exclude(pk=proyecto.pk).exists():
            raise serializers.ValidationError({'codigo': f'El número "{codigo}" ya está asignado a otro proyecto.'})

        estado_anterior = proyecto.estado
        proyecto.estado = 'aprobado'
        proyecto.codigo = codigo
        proyecto.fecha_aprobacion = timezone.now()
        proyecto.save(update_fields=['estado', 'codigo', 'fecha_aprobacion'])

        # Crear RevisionProyecto (Dictamen)
        RevisionProyecto.objects.create(
            proyecto=proyecto,
            revisor=request.user,
            decision='aprobado',
            comentario_tecnico=(request.data.get('comentario_tecnico') or '').strip(),
            observaciones_secciones=_observaciones_secciones(request),
            estado_anterior=estado_anterior,
            estado_nuevo='aprobado',
        )

        # Historial (append-only)
        _registrar_historial(
            proyecto=proyecto,
            usuario=request.user,
            estado_anterior=estado_anterior,
            estado_nuevo='aprobado',
            comentario='Proyecto aprobado por el Departamento.',
            request=request,
        )

        # Notificación al docente
        _crear_notificacion(
            destinatario=proyecto.docente_responsable,
            proyecto=proyecto,
            tipo='aprobacion',
            titulo=f'Proyecto "{proyecto.titulo[:50]}..." Aprobado',
            mensaje='Tu proyecto ha sido aprobado. Ya puedes proceder con su ejecución.',
        )

        return Response({'detail': 'Proyecto aprobado exitosamente.'}, status=status.HTTP_200_OK)


class ProyectoObservarView(APIView):
    """
    T-69: Observa un proyecto en revisión (requiere comentario_tecnico).
    """
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = get_object_or_404(ProyectoRSU, pk=pk)
        
        if not request.user.is_staff and not (request.user.rol and request.user.rol.nombre == Rol.ADMINISTRADOR):
            if proyecto.departamento != request.user.departamento:
                raise PermissionDenied('No tienes permisos sobre este proyecto.')

        if proyecto.estado != 'en_revision':
            raise serializers.ValidationError('El proyecto no está en revisión.')

        # CA-02: comentario técnico general obligatorio de al menos 15 caracteres.
        comentario_tecnico = (request.data.get('comentario_tecnico') or '').strip()
        if len(comentario_tecnico) < 15:
            raise serializers.ValidationError({
                'comentario_tecnico': 'El comentario técnico es obligatorio y debe tener al menos 15 caracteres.'})
        secciones = _observaciones_secciones(request)

        estado_anterior = proyecto.estado
        proyecto.estado = 'observado'
        proyecto.save(update_fields=['estado'])

        RevisionProyecto.objects.create(
            proyecto=proyecto,
            revisor=request.user,
            decision='observado',
            comentario_tecnico=comentario_tecnico,
            observaciones_secciones=secciones,
            estado_anterior=estado_anterior,
            estado_nuevo='observado',
        )

        _registrar_historial(
            proyecto=proyecto,
            usuario=request.user,
            estado_anterior=estado_anterior,
            estado_nuevo='observado',
            comentario=comentario_tecnico,
            request=request,
        )

        _crear_notificacion(
            destinatario=proyecto.docente_responsable,
            proyecto=proyecto,
            tipo='observacion',
            titulo=f'Proyecto "{proyecto.titulo[:50]}..." Observado',
            mensaje=f'Tu proyecto ha sido observado. Por favor revisa y corrige según el siguiente comentario:\n\n{comentario_tecnico}',
        )

        return Response({'detail': 'Proyecto observado exitosamente.'}, status=status.HTTP_200_OK)


class NotificacionListView(generics.ListAPIView):
    """
    T-71: Lista las notificaciones del usuario autenticado.
    """
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notificacion.objects.filter(destinatario=self.request.user).order_by('-created_at')


class NotificacionLeerView(APIView):
    """
    T-71: Marca una notificación como leída.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notificacion = get_object_or_404(Notificacion, pk=pk, destinatario=request.user)
        if not notificacion.leida:
            notificacion.leida = True
            notificacion.leida_en = timezone.now()
            notificacion.save(update_fields=['leida', 'leida_en'])
        return Response({'detail': 'Notificación marcada como leída.'}, status=status.HTTP_200_OK)


# ─── HU-05: Registro de avances y evidencias ─────────────────────────────────

def _get_proyecto_ejecucion(pk, user):
    """
    T-88: solo el docente responsable registra avances, y solo en proyectos
    aprobados o en ejecución.
    """
    proyecto = get_object_or_404(ProyectoRSU, pk=pk)
    if proyecto.docente_responsable != user:
        raise PermissionDenied('Solo el docente responsable puede registrar avances de este proyecto.')
    if proyecto.estado not in ['aprobado', 'en_ejecucion']:
        raise serializers.ValidationError(
            f"Solo se pueden registrar avances en proyectos aprobados o en ejecución "
            f"(estado actual: '{proyecto.estado}')."
        )
    return proyecto


def _notificar_listo_para_cerrar(proyecto):
    """Avisa al docente que ya puede completar su Informe de Finalización."""
    _crear_notificacion(
        destinatario=proyecto.docente_responsable,
        proyecto=proyecto,
        tipo='listo_para_cerrar',
        titulo=f'Proyecto "{proyecto.titulo[:50]}..." listo para finalizar',
        mensaje='Completaste el 100% de las actividades. Ya puedes llenar y enviar '
                'el Informe de Finalización para que el Departamento lo revise.',
    )


def _recalcular_porcentaje_ejecucion(proyecto):
    """
    T-89: % de ejecución = actividades completadas / total de actividades * 100.
    Punto único de cálculo: si se decide ponderar 'en_ejecucion', se cambia aquí.

    Cuando el porcentaje cruza a 100% (y no estaba ya en 100%), avisa al
    docente que ya puede completar su Informe de Finalización
    (views_finalizacion.py).
    """
    porcentaje_anterior = proyecto.porcentaje_ejecucion

    actividades = proyecto.actividades.all()
    total = actividades.count()
    if total == 0:
        pct = Decimal('0.00')
    else:
        completadas = actividades.filter(estado='completada').count()
        pct = (Decimal(completadas) / Decimal(total) * 100).quantize(Decimal('0.01'))
    proyecto.porcentaje_ejecucion = pct
    proyecto.save(update_fields=['porcentaje_ejecucion', 'updated_at'])

    llego_a_100_ahora = pct == Decimal('100.00') and porcentaje_anterior != Decimal('100.00')
    if llego_a_100_ahora and proyecto.estado == 'en_ejecucion':
        _notificar_listo_para_cerrar(proyecto)

    return pct


def _validar_consistencia_metas(proyecto):
    """
    T-88: consistencia de las metas del proyecto.

    Se valida aquí (flujo de avances) y NO en MetaIndicadorProyectoSerializer,
    porque ese serializer se reutiliza en el guardado anidado del proyecto y
    endurecerlo rompería la edición de metas que ya usa el frontend.
    """
    for meta in proyecto.metas_indicadores.all():
        if meta.valor_alcanzado is None:
            continue
        if meta.valor_meta is not None and meta.valor_alcanzado > meta.valor_meta:
            raise serializers.ValidationError({'metas_indicadores': (
                f'La meta "{meta.indicador_nombre}" tiene un valor alcanzado '
                f'({meta.valor_alcanzado}) mayor que su valor meta ({meta.valor_meta}).'
            )})
        if meta.linea_base is not None and meta.valor_alcanzado < meta.linea_base:
            raise serializers.ValidationError({'metas_indicadores': (
                f'La meta "{meta.indicador_nombre}" tiene un valor alcanzado '
                f'({meta.valor_alcanzado}) menor que su línea base ({meta.linea_base}).'
            )})


def _get_avance_visible(proyecto_pk, avance_pk, user):
    """Avance accesible según el scope de lectura por rol del proyecto."""
    _verificar_proyecto_visible(proyecto_pk, user)
    return get_object_or_404(
        AvanceActividad.objects.select_related('proyecto', 'actividad', 'autor'),
        pk=avance_pk, proyecto_id=proyecto_pk,
    )


class AvanceActividadListCreateView(generics.ListCreateAPIView):
    """
    T-86: GET historial de avances (CA-06) / POST registra un avance (CA-01, CA-05).
    La lectura respeta el scope por rol (la Jefatura RSU también lo visualiza).
    """
    serializer_class = AvanceActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['proyecto_pk'] = self.kwargs['proyecto_pk']
        return ctx

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        qs = AvanceActividad.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).select_related('actividad', 'autor', 'revisor').prefetch_related('evidencias')
        actividad_id = self.request.query_params.get('actividad')
        if actividad_id:
            qs = qs.filter(actividad_id=actividad_id)
        return qs.order_by('-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        proyecto = _get_proyecto_ejecucion(self.kwargs['proyecto_pk'], self.request.user)
        _validar_consistencia_metas(proyecto)
        avance = serializer.save(proyecto=proyecto, autor=self.request.user)

        # CA-01: el avance actualiza el estado de la actividad.
        actividad = avance.actividad
        actividad.estado = avance.estado_actividad
        actividad.save(update_fields=['estado'])

        # El primer avance pone el proyecto en ejecución.
        if proyecto.estado == 'aprobado':
            proyecto.estado = 'en_ejecucion'
            if not proyecto.fecha_inicio_ejecucion:
                proyecto.fecha_inicio_ejecucion = timezone.now()
            proyecto.save(update_fields=['estado', 'fecha_inicio_ejecucion'])

        # CA-02 / T-89: recálculo automático del % de ejecución.
        _recalcular_porcentaje_ejecucion(proyecto)


class ActividadEvidenciaView(APIView):
    """
    POST /proyectos/<proyecto_pk>/actividades/<pk>/evidencia/  (multipart)

    Flujo de "Mis actividades" en un solo paso: el docente sube un archivo
    (PDF/JPG/JPEG/PNG, máx. 10MB) o pega un enlace de Drive, con una
    observación opcional. En la misma operación se registra el avance, la
    actividad queda completada y se recalcula el % de ejecución del proyecto.

    Body: archivo | enlace_drive (uno de los dos), observacion (opcional).
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def post(self, request, proyecto_pk, pk):
        proyecto = _get_proyecto_ejecucion(proyecto_pk, request.user)
        actividad = get_object_or_404(ActividadProyecto, pk=pk, proyecto=proyecto)

        archivo = request.FILES.get('archivo')
        enlace = (request.data.get('enlace_drive') or '').strip()
        if bool(archivo) == bool(enlace):
            raise serializers.ValidationError(
                {'detail': 'Adjunte un archivo o pegue un enlace de Drive (solo uno de los dos).'})
        evidencia = EvidenciaAvanceSerializer(data={
            'tipo': 'archivo' if archivo else 'enlace',
            'archivo': archivo,
            'enlace_drive': enlace or None,
            'nombre': archivo.name if archivo else (request.data.get('nombre') or enlace)[:255],
        })
        evidencia.is_valid(raise_exception=True)
        _validar_consistencia_metas(proyecto)

        observacion = (request.data.get('observacion') or '').strip()
        avance = AvanceActividad.objects.create(
            proyecto=proyecto, actividad=actividad,
            descripcion=observacion or 'Evidencia registrada.',
            estado_actividad='completada', observaciones=observacion, autor=request.user)
        evidencia.save(avance=avance)

        actividad.estado = 'completada'
        actividad.save(update_fields=['estado'])
        if proyecto.estado == 'aprobado':
            proyecto.estado = 'en_ejecucion'
            proyecto.fecha_inicio_ejecucion = proyecto.fecha_inicio_ejecucion or timezone.now()
            proyecto.save(update_fields=['estado', 'fecha_inicio_ejecucion'])
        porcentaje = _recalcular_porcentaje_ejecucion(proyecto)

        return Response({
            'actividad': ActividadProyectoSerializer(actividad).data,
            'avance': AvanceActividadSerializer(avance, context={'request': request}).data,
            'porcentaje_ejecucion': porcentaje,
            'estado_proyecto': proyecto.estado,
        }, status=status.HTTP_201_CREATED)


class AvanceActividadDetailView(generics.RetrieveAPIView):
    """T-86: detalle de un avance. Sin PUT/PATCH/DELETE: el historial es append-only."""
    serializer_class = AvanceActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _verificar_proyecto_visible(self.kwargs['proyecto_pk'], self.request.user)
        return AvanceActividad.objects.filter(
            proyecto_id=self.kwargs['proyecto_pk']
        ).select_related('actividad', 'autor', 'revisor').prefetch_related('evidencias')


class EvidenciaAvanceListCreateView(generics.ListCreateAPIView):
    """
    T-87: GET lista evidencias vigentes / POST carga archivo (PDF/JPG/JPEG/PNG)
    o registra un enlace de Google Drive (CA-03, CA-04).
    """
    serializer_class = EvidenciaAvanceSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        avance = _get_avance_visible(
            self.kwargs['proyecto_pk'], self.kwargs['avance_pk'], self.request.user)
        return avance.evidencias.filter(eliminada=False).order_by('-uploaded_at')

    def perform_create(self, serializer):
        proyecto = _get_proyecto_ejecucion(self.kwargs['proyecto_pk'], self.request.user)
        avance = get_object_or_404(
            AvanceActividad, pk=self.kwargs['avance_pk'], proyecto=proyecto)
        if avance.autor != self.request.user:
            raise PermissionDenied('Solo el autor del avance puede cargar sus evidencias.')
        serializer.save(avance=avance)


class EvidenciaAvanceDetailView(generics.RetrieveDestroyAPIView):
    """
    T-87: GET visualiza una evidencia / DELETE la marca como eliminada
    (soft-delete): el registro se conserva para la trazabilidad del proyecto.
    """
    serializer_class = EvidenciaAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        avance = _get_avance_visible(
            self.kwargs['proyecto_pk'], self.kwargs['avance_pk'], self.request.user)
        return avance.evidencias.filter(eliminada=False)

    def perform_destroy(self, instance):
        _get_proyecto_ejecucion(self.kwargs['proyecto_pk'], self.request.user)
        if instance.avance.autor != self.request.user:
            raise PermissionDenied('Solo el autor del avance puede eliminar sus evidencias.')
        instance.eliminada = True
        instance.eliminada_en = timezone.now()
        instance.save(update_fields=['eliminada', 'eliminada_en'])


class AvanceObservarView(APIView):
    """
    T-90: Jefatura RSU / Departamento / Administrador observa un avance y
    notifica al docente responsable que requiere corrección.
    """
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador | IsJefaturaRSU]

    @transaction.atomic
    def post(self, request, proyecto_pk, pk):
        _verificar_proyecto_visible(proyecto_pk, request.user)
        avance = get_object_or_404(
            AvanceActividad.objects.select_related(
                'proyecto', 'actividad', 'proyecto__docente_responsable'),
            pk=pk, proyecto_id=proyecto_pk,
        )
        comentario = request.data.get('comentario', '').strip()
        if not comentario:
            raise serializers.ValidationError(
                {'comentario': 'Este campo es obligatorio al observar un avance.'})

        avance.estado_revision = 'observado'
        avance.comentario_revision = comentario
        avance.revisor = request.user
        avance.revisado_en = timezone.now()
        avance.save(update_fields=[
            'estado_revision', 'comentario_revision', 'revisor', 'revisado_en'])

        proyecto = avance.proyecto
        _crear_notificacion(
            destinatario=proyecto.docente_responsable,
            proyecto=proyecto,
            tipo='avance_observado',
            titulo=f'Avance observado en "{proyecto.titulo[:50]}"',
            mensaje=(
                f'Tu avance de la actividad "{avance.actividad.nombre}" fue observado '
                f'y requiere corrección:\n\n{comentario}'
            ),
        )
        return Response({'detail': 'Avance observado exitosamente.'}, status=status.HTTP_200_OK)


class AvanceCorregirView(APIView):
    """
    T-90: el docente responsable marca como corregido un avance observado y
    notifica al revisor que lo observó.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, proyecto_pk, pk):
        proyecto = _get_proyecto_ejecucion(proyecto_pk, request.user)
        avance = get_object_or_404(
            AvanceActividad.objects.select_related('actividad'), pk=pk, proyecto=proyecto)
        if avance.estado_revision != 'observado':
            raise serializers.ValidationError('Solo se pueden corregir avances observados.')

        comentario = request.data.get('comentario', '').strip()
        avance.estado_revision = 'corregido'
        avance.save(update_fields=['estado_revision'])

        if avance.revisor:
            _crear_notificacion(
                destinatario=avance.revisor,
                proyecto=proyecto,
                tipo='avance_corregido',
                titulo=f'Avance corregido en "{proyecto.titulo[:50]}"',
                mensaje=(
                    f'El docente corrigió el avance de la actividad "{avance.actividad.nombre}".'
                    + (f'\n\n{comentario}' if comentario else '')
                ),
            )
        return Response({'detail': 'Avance marcado como corregido.'}, status=status.HTTP_200_OK)
