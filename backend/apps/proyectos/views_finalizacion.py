"""
Seguimiento (HU-16), Informe de Finalización (HU-09, Sprint 8) y constancia.

Flujo de cierre de un proyecto:
1. El proyecto en ejecución llega al 100% de actividades completadas: se
   avisa al docente que ya puede completar su Informe de Finalización.
2. El docente completa lo que falta (textos, valores alcanzados de las metas,
   montos ejecutados) y lo envía: se avisa al Departamento.
3. El Departamento lo observa con comentario obligatorio (vuelve al docente)
   o lo aprueba: el proyecto pasa a 'finalizado' y se genera la constancia.
4. El Departamento revisa la constancia y la aprueba: desde ahí el docente
   puede descargarla.

Jefatura RSU hace seguimiento en lectura, pero no finaliza proyectos ni
aprueba constancias.

Conecta con:
- apps/proyectos/services_finalizacion.py: datos del seguimiento y del informe.
- apps/proyectos/exports_finalizacion.py: PDF del informe y de la constancia.
- apps/proyectos/views.py: helpers de visibilidad, historial y notificaciones.
- apps/proyectos/urls.py: rutas.
"""
from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.models import Rol, Usuario
from apps.utils.permissions import IsAdministrador, IsDepartamento

from .exports_finalizacion import exportar_constancia_pdf, exportar_informe_finalizacion_pdf
from .models import InformeFinalizacion, ProyectoRSU, RevisionProyecto
from .serializers import InformeFinalSerializer, ProyectoRSUSerializer
from .services_finalizacion import (
    campos_pendientes, informe_finalizacion, obtener_informe, seguimiento_proyecto,
)
from .views import (
    _crear_notificacion, _filter_proyectos_por_rol, _proyecto_qs_base, _recalcular_porcentaje_ejecucion,
    _registrar_historial,
)

MIN_COMENTARIO = 15


def _proyecto_visible(pk, user):
    return get_object_or_404(_filter_proyectos_por_rol(ProyectoRSU.objects.all(), user), pk=pk)


def _es_admin(user):
    return user.is_staff or (user.rol and user.rol.nombre == Rol.ADMINISTRADOR)


def _validar_comentario(request):
    comentario = (request.data.get('comentario') or '').strip()
    if len(comentario) < MIN_COMENTARIO:
        raise serializers.ValidationError({
            'comentario': f'El comentario es obligatorio y debe tener al menos {MIN_COMENTARIO} caracteres.'})
    return comentario


def _pdf(archivo, nombre):
    return FileResponse(archivo, as_attachment=True, filename=nombre, content_type='application/pdf')


# ─── HU-16: seguimiento en solo lectura ──────────────────────────────────────

class ProyectoSeguimientoView(APIView):
    """GET /proyectos/<pk>/seguimiento/ - avance por actividad con evidencias.

    Lo usan el docente (Mis actividades) y, en solo lectura, Departamento,
    Jefatura RSU y Administrador, cada uno dentro de su alcance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(seguimiento_proyecto(_proyecto_visible(pk, request.user), request))


# ─── Sprint 8: Informe de Finalización ───────────────────────────────────────

def _actualizar_valores(relacion, items, campo, clave):
    if items is None:
        return
    if not isinstance(items, list):
        raise serializers.ValidationError({clave: 'Debe ser una lista.'})
    objetos = {o.id: o for o in relacion.all()}
    for item in items:
        obj = objetos.get(item.get('id') if isinstance(item, dict) else None)
        if obj is None:
            raise serializers.ValidationError({clave: 'Uno de los elementos no pertenece al proyecto.'})
        valor = serializers.DecimalField(max_digits=12, decimal_places=2).to_internal_value(
            item.get(campo))
        if valor < 0:
            raise serializers.ValidationError({clave: 'No se permiten valores negativos.'})
        setattr(obj, campo, valor)
        obj.save(update_fields=[campo])


def sincronizar_ejecucion(proyecto):
    """Alinea estado y % guardados con las actividades reales.

    Las actividades son la fuente de verdad: si ya hay alguna completada, el
    proyecto aprobado está en ejecución (igual que al registrar evidencia) y el
    porcentaje se recalcula, por si quedó desactualizado.
    """
    if proyecto.estado == 'aprobado' and proyecto.actividades.filter(estado='completada').exists():
        proyecto.estado = 'en_ejecucion'
        proyecto.fecha_inicio_ejecucion = proyecto.fecha_inicio_ejecucion or timezone.now()
        proyecto.save(update_fields=['estado', 'fecha_inicio_ejecucion', 'updated_at'])
    if proyecto.estado == 'en_ejecucion':
        _recalcular_porcentaje_ejecucion(proyecto)


def guardar_informe(proyecto, usuario, data):
    """Guarda textos, metas y partidas del informe. Debe correr dentro de una transacción."""
    if proyecto.docente_responsable != usuario:
        raise PermissionDenied('Solo el docente responsable completa el Informe de Finalización.')
    sincronizar_ejecucion(proyecto)
    if proyecto.estado == 'finalizado':
        raise serializers.ValidationError(
            'El proyecto ya está finalizado: su Informe de Finalización ya no se puede modificar.')
    if proyecto.estado != 'en_ejecucion' or proyecto.porcentaje_ejecucion < 100:
        raise serializers.ValidationError(
            'El Informe de Finalización se habilita cuando el proyecto en ejecución '
            f'completa el 100% de sus actividades (estado actual: "{proyecto.estado}", '
            f'avance: {proyecto.porcentaje_ejecucion}%).')

    informe, _ = InformeFinalizacion.objects.get_or_create(proyecto=proyecto)
    if informe.estado not in ('borrador', 'observado'):
        raise serializers.ValidationError(
            f'El informe está "{informe.get_estado_display()}" y no se puede modificar.')

    textos = InformeFinalSerializer(data=data, partial=True)
    textos.is_valid(raise_exception=True)
    for campo, valor in textos.validated_data.items():
        setattr(proyecto, campo, valor)
    if textos.validated_data:
        proyecto.save(update_fields=[*textos.validated_data, 'updated_at'])

    _actualizar_valores(proyecto.metas_indicadores, data.get('metas'), 'valor_alcanzado', 'metas')
    _actualizar_valores(proyecto.partidas_presupuesto, data.get('partidas'), 'monto_ejecutado', 'partidas')
    return informe


class InformeFinalizacionView(APIView):
    """
    GET   /proyectos/<pk>/informe-finalizacion/ - informe con datos cargados.
    PATCH /proyectos/<pk>/informe-finalizacion/ - el docente completa lo que falta.

    Body del PATCH (todo opcional):
        {"conclusiones": "...", "recomendaciones": "...",
         "lecciones_aprendidas": "...", "medio_difusion": "...",
         "metas": [{"id": 1, "valor_alcanzado": 40}],
         "partidas": [{"id": 3, "monto_ejecutado": 120.5}]}
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(informe_finalizacion(_proyecto_visible(pk, request.user), request))

    @transaction.atomic
    def patch(self, request, pk):
        proyecto = get_object_or_404(ProyectoRSU, pk=pk)
        guardar_informe(proyecto, request.user, request.data)
        return Response(informe_finalizacion(proyecto, request))

class InformeFinalizacionEnviarView(APIView):
    """POST /proyectos/<pk>/informe-finalizacion/enviar/ - el docente lo envía.

    El body es opcional y admite lo mismo que el PATCH (textos, metas, partidas):
    si viene, se guarda y se envía en una sola transacción, así un error no
    deja el informe a medias.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = get_object_or_404(ProyectoRSU, pk=pk)
        if proyecto.docente_responsable != request.user:
            raise PermissionDenied('Solo el docente responsable envía el Informe de Finalización.')
        if request.data:
            guardar_informe(proyecto, request.user, request.data)
        informe = obtener_informe(proyecto)
        if informe is None or informe.estado not in ('borrador', 'observado'):
            raise serializers.ValidationError(
                'Primero complete el Informe de Finalización antes de enviarlo.')

        pendientes, _ = campos_pendientes(proyecto)
        if pendientes:
            raise serializers.ValidationError({
                'detail': 'Faltan campos del Informe de Finalización.',
                'errors': {'campos_pendientes': pendientes}})

        informe.estado = 'enviado'
        informe.fecha_envio = timezone.now()
        informe.save(update_fields=['estado', 'fecha_envio', 'updated_at'])

        revisores = Usuario.objects.filter(
            rol__nombre=Rol.DEPARTAMENTO, departamento_id=proyecto.departamento_id,
        ) if proyecto.departamento_id else Usuario.objects.none()
        for revisor in revisores:
            _crear_notificacion(
                destinatario=revisor, proyecto=proyecto, tipo='informe_finalizacion_enviado',
                titulo=f'Informe de Finalización enviado: "{proyecto.titulo[:50]}"',
                mensaje='El docente envió el Informe de Finalización. Revísalo en '
                        'Proyectos por finalizar para aprobarlo u observarlo.')
        return Response(informe_finalizacion(proyecto, request))


class InformeFinalizacionObservarView(APIView):
    """POST /proyectos/<pk>/informe-finalizacion/observar/ - {"comentario": "..."}."""
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = _proyecto_visible(pk, request.user)
        informe = obtener_informe(proyecto)
        if informe is None or informe.estado != 'enviado':
            raise serializers.ValidationError('Solo se puede observar un informe enviado a revisión.')
        comentario = _validar_comentario(request)

        informe.estado = 'observado'
        informe.save(update_fields=['estado', 'updated_at'])
        RevisionProyecto.objects.create(
            proyecto=proyecto, revisor=request.user, etapa='finalizacion', decision='observado',
            comentario_tecnico=comentario,
            estado_anterior=proyecto.estado, estado_nuevo=proyecto.estado)
        _crear_notificacion(
            destinatario=proyecto.docente_responsable, proyecto=proyecto,
            tipo='informe_finalizacion_observado',
            titulo=f'Informe de Finalización observado: "{proyecto.titulo[:50]}"',
            mensaje=f'Corrige tu Informe de Finalización según el comentario:\n\n{comentario}')
        return Response(informe_finalizacion(proyecto, request))


class InformeFinalizacionPDFView(APIView):
    """GET /proyectos/<pk>/informe-finalizacion/pdf/ - descarga del informe."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        proyecto = _proyecto_visible(pk, request.user)
        archivo = exportar_informe_finalizacion_pdf(informe_finalizacion(proyecto, request))
        return _pdf(archivo, f'informe-finalizacion-{proyecto.codigo or proyecto.id}.pdf')


# ─── HU-09: aprobación de la finalización ────────────────────────────────────

class ProyectosParaFinalizarView(generics.ListAPIView):
    """GET /proyectos/para-finalizar/ - informes enviados que esperan dictamen."""
    serializer_class = ProyectoRSUSerializer
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    def get_queryset(self):
        return _filter_proyectos_por_rol(_proyecto_qs_base(), self.request.user).filter(
            estado='en_ejecucion', informe_finalizacion__estado='enviado',
        ).order_by('informe_finalizacion__fecha_envio')


class ProyectoFinalizarView(APIView):
    """
    POST /proyectos/<pk>/finalizar/ - el Departamento aprueba el Informe de
    Finalización y el proyecto pasa a 'finalizado'. Genera la constancia, que
    queda pendiente de aprobación del mismo Departamento.
    """
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = _proyecto_visible(pk, request.user)
        if proyecto.estado != 'en_ejecucion':
            raise serializers.ValidationError(
                f"Solo se pueden finalizar proyectos en ejecución (estado actual: '{proyecto.estado}').")
        informe = obtener_informe(proyecto)
        if informe is None or informe.estado != 'enviado':
            raise serializers.ValidationError(
                'El docente debe enviar el Informe de Finalización antes de finalizar el proyecto.')

        ahora = timezone.now()
        informe.estado = 'aprobado'
        informe.fecha_aprobacion = ahora
        informe.save(update_fields=['estado', 'fecha_aprobacion', 'updated_at'])

        estado_anterior = proyecto.estado
        proyecto.estado = 'finalizado'
        proyecto.fecha_cierre = ahora
        proyecto.save(update_fields=['estado', 'fecha_cierre', 'updated_at'])

        RevisionProyecto.objects.create(
            proyecto=proyecto, revisor=request.user, etapa='finalizacion', decision='aprobado',
            comentario_tecnico=(request.data.get('comentario') or '').strip(),
            estado_anterior=estado_anterior, estado_nuevo='finalizado')
        _registrar_historial(
            proyecto=proyecto, usuario=request.user, estado_anterior=estado_anterior,
            estado_nuevo='finalizado',
            comentario='Informe de Finalización aprobado por el Departamento.', request=request)
        _crear_notificacion(
            destinatario=proyecto.docente_responsable, proyecto=proyecto, tipo='finalizacion',
            titulo=f'Proyecto "{proyecto.titulo[:50]}..." Finalizado',
            mensaje='Tu Informe de Finalización fue aprobado y el proyecto quedó finalizado. '
                    'La constancia estará disponible cuando el Departamento la apruebe.')
        return Response({'detail': 'Proyecto finalizado exitosamente.'}, status=status.HTTP_200_OK)


# ─── Constancia de finalización ──────────────────────────────────────────────

class ConstanciasListView(APIView):
    """GET /constancias/ - proyectos finalizados del alcance y el estado de su constancia."""
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    def get(self, request):
        proyectos = _filter_proyectos_por_rol(ProyectoRSU.objects.all(), request.user).filter(
            estado='finalizado', informe_finalizacion__isnull=False,
        ).select_related('informe_finalizacion', 'docente_responsable').order_by('-fecha_cierre')
        return Response([
            {
                'proyecto_id': p.id,
                'codigo': p.codigo,
                'titulo': p.titulo,
                'docente': f'{p.docente_responsable.nombres} {p.docente_responsable.apellidos}'.strip(),
                'fecha_cierre': p.fecha_cierre.isoformat() if p.fecha_cierre else None,
                'constancia_aprobada': p.informe_finalizacion.constancia_aprobada,
                'constancia_aprobada_en': (
                    p.informe_finalizacion.constancia_aprobada_en.isoformat()
                    if p.informe_finalizacion.constancia_aprobada_en else None),
            }
            for p in proyectos
        ])


class ConstanciaPDFView(APIView):
    """
    GET /proyectos/<pk>/constancia/pdf/ - Departamento y Administrador la ven
    desde que el proyecto se finaliza; el docente, solo una vez aprobada.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        proyecto = _proyecto_visible(pk, request.user)
        informe = obtener_informe(proyecto)
        if proyecto.estado != 'finalizado' or informe is None:
            raise serializers.ValidationError('La constancia existe solo para proyectos finalizados.')

        user = request.user
        es_departamento = user.rol and user.rol.nombre == Rol.DEPARTAMENTO
        es_docente_dueno = proyecto.docente_responsable_id == user.id
        if not (_es_admin(user) or es_departamento or (es_docente_dueno and informe.constancia_aprobada)):
            raise PermissionDenied('La constancia todavía no está disponible.')
        return _pdf(exportar_constancia_pdf(proyecto, informe),
                    f'constancia-{proyecto.codigo or proyecto.id}.pdf')


class ConstanciaAprobarView(APIView):
    """POST /proyectos/<pk>/constancia/aprobar/ - la deja disponible para el docente."""
    permission_classes = [IsAuthenticated, IsDepartamento | IsAdministrador]

    @transaction.atomic
    def post(self, request, pk):
        proyecto = _proyecto_visible(pk, request.user)
        informe = obtener_informe(proyecto)
        if proyecto.estado != 'finalizado' or informe is None:
            raise serializers.ValidationError('Solo se aprueba la constancia de un proyecto finalizado.')
        if informe.constancia_aprobada:
            raise serializers.ValidationError('La constancia ya fue aprobada.')

        informe.constancia_aprobada = True
        informe.constancia_aprobada_en = timezone.now()
        informe.constancia_aprobada_por = request.user
        informe.save(update_fields=[
            'constancia_aprobada', 'constancia_aprobada_en', 'constancia_aprobada_por', 'updated_at'])
        _crear_notificacion(
            destinatario=proyecto.docente_responsable, proyecto=proyecto,
            tipo='constancia_disponible',
            titulo=f'Constancia disponible: "{proyecto.titulo[:50]}"',
            mensaje='Tu Constancia de Finalización ya está disponible para descargar en Informes.')
        return Response({'detail': 'Constancia aprobada.'}, status=status.HTTP_200_OK)
