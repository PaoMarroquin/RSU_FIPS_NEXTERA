from django.urls import path
from . import views
from .views_reportes import ReporteGeneralView, ReporteFacultadView

urlpatterns = [
    # ── Proyecto principal ────────────────────────────────────────────────────
    path('proyectos/', views.ProyectoListCreateView.as_view(), name='proyecto-list'),
    path('proyectos/<int:pk>/', views.ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-detail'),
    path('proyectos/<int:pk>/revisar/', views.ProyectoEnviarRevisionView.as_view(), name='proyecto-revisar'),
    path('proyectos/<int:pk>/continuar/', views.ProyectoContinuarView.as_view(), name='proyecto-continuar'),

    # ── VI. Actividades ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/actividades/', views.ActividadProyectoListCreateView.as_view(), name='actividad-list'),
    path('proyectos/<int:proyecto_pk>/actividades/<int:pk>/', views.ActividadProyectoDetailView.as_view(), name='actividad-detail'),

    # ── VII. Cronograma ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/cronograma/', views.CronogramaAccionListCreateView.as_view(), name='cronograma-list'),
    path('proyectos/<int:proyecto_pk>/cronograma/<int:pk>/', views.CronogramaAccionDetailView.as_view(), name='cronograma-detail'),

    # ── IX. Fuentes de financiamiento ────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/financiamiento/', views.FuenteFinanciamientoListCreateView.as_view(), name='financiamiento-list'),
    path('proyectos/<int:proyecto_pk>/financiamiento/<int:pk>/', views.FuenteFinanciamientoDetailView.as_view(), name='financiamiento-detail'),

    # ── IX. Presupuesto estimado ──────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/presupuesto/', views.PartidaPresupuestariaListCreateView.as_view(), name='presupuesto-list'),
    path('proyectos/<int:proyecto_pk>/presupuesto/resumen/', views.PresupuestoResumenView.as_view(), name='presupuesto-resumen'),
    path('proyectos/<int:proyecto_pk>/presupuesto/confirmar/', views.FinanciamientoConfirmarView.as_view(), name='financiamiento-confirmar'),
    path('proyectos/<int:proyecto_pk>/presupuesto/<int:pk>/', views.PartidaPresupuestariaDetailView.as_view(), name='presupuesto-detail'),

    # ── IV/V. Metas e Indicadores ─────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/metas-indicadores/', views.MetaIndicadorProyectoListCreateView.as_view(), name='meta-indicador-list'),
    path('proyectos/<int:proyecto_pk>/metas-indicadores/<int:pk>/', views.MetaIndicadorProyectoDetailView.as_view(), name='meta-indicador-detail'),

    # ── Reportes ──────────────────────────────────────────────────────────────
    path('reportes/general/', ReporteGeneralView.as_view(), name='reporte-general'),
    path('reportes/facultad/<int:facultad_pk>/', ReporteFacultadView.as_view(), name='reporte-facultad'),

    # ── Módulo 4: Revisión y Aprobación ───────────────────────────────────────
    path('proyectos/para-revisar/', views.ProyectosParaRevisarView.as_view(), name='proyecto-para-revisar'),
    path('proyectos/<int:pk>/aprobar/', views.ProyectoAprobarView.as_view(), name='proyecto-aprobar'),
    path('proyectos/<int:pk>/observar/', views.ProyectoObservarView.as_view(), name='proyecto-observar'),

    # ── Módulo 4: Notificaciones ──────────────────────────────────────────────
    path('notificaciones/', views.NotificacionListView.as_view(), name='notificacion-list'),
    path('notificaciones/<int:pk>/leer/', views.NotificacionLeerView.as_view(), name='notificacion-leer'),
]
