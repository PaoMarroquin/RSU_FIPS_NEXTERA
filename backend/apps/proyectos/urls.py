from django.urls import path
from . import views

urlpatterns = [
    # ── Proyecto principal ────────────────────────────────────────────────────
    path('proyectos/', views.ProyectoListCreateView.as_view(), name='proyecto-list'),
    path('proyectos/<int:pk>/', views.ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-detail'),
    path('proyectos/<int:pk>/enviar-revision/', views.ProyectoEnviarRevisionView.as_view(), name='proyecto-enviar-revision'),
    path('proyectos/<int:pk>/continuar/', views.ProyectoContinuarView.as_view(), name='proyecto-continuar'),

    # ── VI. Actividades ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/actividades/', views.ActividadProyectoListCreateView.as_view(), name='actividad-list'),
    path('proyectos/<int:proyecto_pk>/actividades/<int:pk>/', views.ActividadProyectoDetailView.as_view(), name='actividad-detail'),

    # ── VII. Cronograma ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/cronograma/', views.CronogramaAccionListCreateView.as_view(), name='cronograma-list'),
    path('proyectos/<int:proyecto_pk>/cronograma/<int:pk>/', views.CronogramaAccionDetailView.as_view(), name='cronograma-detail'),

    # ── IX. Presupuesto estimado ──────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/presupuesto/', views.PartidaPresupuestariaListCreateView.as_view(), name='presupuesto-list'),
    path('proyectos/<int:proyecto_pk>/presupuesto/resumen/', views.PresupuestoResumenView.as_view(), name='presupuesto-resumen'),
    path('proyectos/<int:proyecto_pk>/presupuesto/confirmar/', views.FinanciamientoConfirmarView.as_view(), name='financiamiento-confirmar'),
    path('proyectos/<int:proyecto_pk>/presupuesto/<int:pk>/', views.PartidaPresupuestariaDetailView.as_view(), name='presupuesto-detail'),

    # ── IV/V. Metas e Indicadores ─────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/metas-indicadores/', views.MetaIndicadorProyectoListCreateView.as_view(), name='meta-indicador-list'),
    path('proyectos/<int:proyecto_pk>/metas-indicadores/<int:pk>/', views.MetaIndicadorProyectoDetailView.as_view(), name='meta-indicador-detail'),
]
