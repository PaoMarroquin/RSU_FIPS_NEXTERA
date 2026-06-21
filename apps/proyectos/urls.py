from django.urls import path
from . import views

urlpatterns = [
    # ── Proyecto principal ────────────────────────────────────────────────────
    path('proyectos/', views.ProyectoListCreateView.as_view(), name='proyecto-list'),
    path('proyectos/<int:pk>/', views.ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-detail'),
    path('proyectos/<int:pk>/enviar-revision/', views.ProyectoEnviarRevisionView.as_view(), name='proyecto-enviar-revision'),

    # ── IV. Objetivos Específicos ─────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/objetivos/', views.ObjetivoEspecificoListCreateView.as_view(), name='objetivo-list'),
    path('proyectos/<int:proyecto_pk>/objetivos/<int:pk>/', views.ObjetivoEspecificoDetailView.as_view(), name='objetivo-detail'),

    # ── VI/VII. Fases y Tareas ────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/fases/', views.FaseProyectoListCreateView.as_view(), name='fase-list'),
    path('proyectos/<int:proyecto_pk>/fases/<int:pk>/', views.FaseProyectoDetailView.as_view(), name='fase-detail'),
    path('proyectos/<int:proyecto_pk>/fases/<int:fase_pk>/tareas/', views.TareaProyectoListCreateView.as_view(), name='tarea-list'),
    path('proyectos/<int:proyecto_pk>/fases/<int:fase_pk>/tareas/<int:pk>/', views.TareaProyectoDetailView.as_view(), name='tarea-detail'),

    # ── IX. Presupuesto estimado ──────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/presupuesto/', views.PartidaPresupuestariaListCreateView.as_view(), name='presupuesto-list'),
    path('proyectos/<int:proyecto_pk>/presupuesto/resumen/', views.PresupuestoResumenView.as_view(), name='presupuesto-resumen'),
    path('proyectos/<int:proyecto_pk>/presupuesto/<int:pk>/', views.PartidaPresupuestariaDetailView.as_view(), name='presupuesto-detail'),

    # ── IV/V. Metas e Indicadores ─────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/metas-indicadores/', views.MetaIndicadorProyectoListCreateView.as_view(), name='meta-indicador-list'),
    path('proyectos/<int:proyecto_pk>/metas-indicadores/<int:pk>/', views.MetaIndicadorProyectoDetailView.as_view(), name='meta-indicador-detail'),
]
