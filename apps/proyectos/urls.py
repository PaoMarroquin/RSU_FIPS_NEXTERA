from django.urls import path
from . import views

urlpatterns = [
    path('proyectos/', views.ProyectoListCreateView.as_view(), name='proyecto-list'),
    path('proyectos/<int:pk>/', views.ProyectoRetrieveUpdateDestroyView.as_view(), name='proyecto-detail'),
    path('proyectos/<int:pk>/enviar-revision/', views.ProyectoEnviarRevisionView.as_view(), name='proyecto-enviar-revision'),
]
