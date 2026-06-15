from django.urls import path
from . import views

urlpatterns = [
    path('periodos/', views.PeriodoAcademicoListCreateView.as_view(), name='periodo-list'),
    path('periodos/<int:pk>/', views.PeriodoAcademicoRetrieveUpdateDestroyView.as_view(), name='periodo-detail'),
    
    path('ejes-rsu/', views.EjeRSUListView.as_view(), name='eje-rsu-list'),
    
    path('ods/', views.ODSListView.as_view(), name='ods-list'),
    
    path('lineas-estrategicas/', views.LineaEstrategicaListCreateView.as_view(), name='linea-estrategica-list'),
    path('lineas-estrategicas/<int:pk>/', views.LineaEstrategicaRetrieveUpdateDestroyView.as_view(), name='linea-estrategica-detail'),
    
    path('matrices/', views.MatrizOperativaListCreateView.as_view(), name='matriz-list'),
    path('matrices/<int:pk>/', views.MatrizOperativaRetrieveUpdateDestroyView.as_view(), name='matriz-detail'),
    
    path('objetivos-institucionales/', views.ObjetivoInstitucionalListCreateView.as_view(), name='objetivo-list'),
    path('objetivos-institucionales/<int:pk>/', views.ObjetivoInstitucionalRetrieveUpdateDestroyView.as_view(), name='objetivo-detail'),
    
    path('indicadores-institucionales/', views.IndicadorInstitucionalListCreateView.as_view(), name='indicador-list'),
    path('indicadores-institucionales/<int:pk>/', views.IndicadorInstitucionalRetrieveUpdateDestroyView.as_view(), name='indicador-detail'),
    
    path('actividades-sugeridas/', views.ActividadSugeridaListCreateView.as_view(), name='actividad-sugerida-list'),
    path('actividades-sugeridas/<int:pk>/', views.ActividadSugeridaRetrieveUpdateDestroyView.as_view(), name='actividad-sugerida-detail'),
]
