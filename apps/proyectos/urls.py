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

    # ── VI. Actividades ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/actividades/', views.ActividadProyectoListCreateView.as_view(), name='actividad-list'),
    path('proyectos/<int:proyecto_pk>/actividades/<int:pk>/', views.ActividadProyectoDetailView.as_view(), name='actividad-detail'),

    # ── VII. Cronograma ───────────────────────────────────────────────────────
    path('proyectos/<int:proyecto_pk>/cronograma/', views.CronogramaAccionListCreateView.as_view(), name='cronograma-list'),
    path('proyectos/<int:proyecto_pk>/cronograma/<int:pk>/', views.CronogramaAccionDetailView.as_view(), name='cronograma-detail'),
]
