from django.urls import path
from . import views

urlpatterns = [
    path('', views.UsuarioListCreateView.as_view(), name='usuario-list-create'),
    path('<int:pk>/', views.UsuarioRetrieveUpdateDestroyView.as_view(), name='usuario-detail'),
    path('<int:pk>/asignar-rol/', views.asignar_rol, name='usuario-asignar-rol'),
    path('roles/', views.RolListView.as_view(), name='rol-list'),
]
