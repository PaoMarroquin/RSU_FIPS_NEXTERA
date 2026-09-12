"""
Rutas del modulo de planificacion, montadas bajo /api/v1/.

Rutas:
- /periodos/, /periodos/<id>/
- /ejes-rsu/, /ods/
- /objetivos-regionales/, /objetivos-regionales/<id>/
- /objetivos-nacionales/, /objetivos-nacionales/<id>/
- /lineas-estrategicas/, /lineas-estrategicas/<id>/
- /matrices/, /matrices/<id>/
- /matrices/<id>/export/excel/, /matrices/<id>/export/pdf/
- /objetivos-institucionales/, /objetivos-institucionales/<id>/
- /indicadores-institucionales/, /indicadores-institucionales/<id>/
- /actividades-sugeridas/, /actividades-sugeridas/<id>/
- /documentos-apoyo/, /documentos-apoyo/<id>/

Conecta con:
- apps/planificacion/views.py: vistas a las que apunta cada ruta.
- config/urls.py: enrutador raiz que incluye este archivo.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('periodos/', views.PeriodoAcademicoListCreateView.as_view(), name='periodo-list'),
    path('periodos/<int:pk>/', views.PeriodoAcademicoRetrieveUpdateDestroyView.as_view(), name='periodo-detail'),
    
    path('ejes-rsu/', views.EjeRSUListView.as_view(), name='eje-rsu-list'),
    
    path('ods/', views.ODSListView.as_view(), name='ods-list'),

    path('objetivos-regionales/', views.ObjetivoRegionalListCreateView.as_view(), name='objetivo-regional-list'),
    path('objetivos-regionales/<int:pk>/', views.ObjetivoRegionalRetrieveUpdateDestroyView.as_view(), name='objetivo-regional-detail'),

    path('objetivos-nacionales/', views.ObjetivoNacionalListCreateView.as_view(), name='objetivo-nacional-list'),
    path('objetivos-nacionales/<int:pk>/', views.ObjetivoNacionalRetrieveUpdateDestroyView.as_view(), name='objetivo-nacional-detail'),

    path('lineas-estrategicas/', views.LineaEstrategicaListCreateView.as_view(), name='linea-estrategica-list'),
    path('lineas-estrategicas/<int:pk>/', views.LineaEstrategicaRetrieveUpdateDestroyView.as_view(), name='linea-estrategica-detail'),
    
    path('matrices/', views.MatrizOperativaListCreateView.as_view(), name='matriz-list'),
    path('matrices/<int:pk>/', views.MatrizOperativaRetrieveUpdateDestroyView.as_view(), name='matriz-detail'),
    path('matrices/<int:pk>/export/excel/', views.MatrizOperativaExportExcelView.as_view(), name='matriz-export-excel'),
    path('matrices/<int:pk>/export/pdf/', views.MatrizOperativaExportPDFView.as_view(), name='matriz-export-pdf'),
    
    path('objetivos-institucionales/', views.ObjetivoInstitucionalListCreateView.as_view(), name='objetivo-list'),
    path('objetivos-institucionales/<int:pk>/', views.ObjetivoInstitucionalRetrieveUpdateDestroyView.as_view(), name='objetivo-detail'),
    
    path('indicadores-institucionales/', views.IndicadorInstitucionalListCreateView.as_view(), name='indicador-list'),
    path('indicadores-institucionales/<int:pk>/', views.IndicadorInstitucionalRetrieveUpdateDestroyView.as_view(), name='indicador-detail'),
    
    path('actividades-sugeridas/', views.ActividadSugeridaListCreateView.as_view(), name='actividad-sugerida-list'),
    path('actividades-sugeridas/<int:pk>/', views.ActividadSugeridaRetrieveUpdateDestroyView.as_view(), name='actividad-sugerida-detail'),

    path('documentos-apoyo/', views.DocumentoApoyoListCreateView.as_view(), name='documento-apoyo-list'),
    path('documentos-apoyo/<int:pk>/', views.DocumentoApoyoRetrieveUpdateDestroyView.as_view(), name='documento-apoyo-detail'),
]
