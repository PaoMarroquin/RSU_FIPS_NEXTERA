from django.urls import path

from . import views

urlpatterns = [
    path('auth/login/',         views.SessionLoginView.as_view(),        name='auth-login'),
    path('auth/token/refresh/', views.SessionTokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/logout/',        views.LogoutView.as_view(),              name='auth-logout'),
    path('auth/google/',        views.GoogleAuthView.as_view(),          name='auth-google'),

    path('usuarios/',                              views.UsuarioListCreateView.as_view(),          name='usuario-list'),
    path('usuarios/<int:pk>/',                     views.UsuarioRetrieveUpdateDestroyView.as_view(), name='usuario-detail'),
    path('usuarios/<int:pk>/asignar-rol/',         views.AsignarRolView.as_view(),                name='usuario-asignar-rol'),
    path('usuarios/<int:pk>/historial-roles/',     views.HistorialRolUsuarioListView.as_view(),   name='usuario-historial-roles'),

    path('roles/',         views.RolListView.as_view(),                  name='rol-list'),
    path('facultades/',    views.FacultadListView.as_view(),             name='facultad-list'),
    path('escuelas/',      views.EscuelaProfesionalListView.as_view(),   name='escuela-list'),
    path('departamentos/', views.DepartamentoAcademicoListView.as_view(), name='departamento-list'),

    path('auditoria/', views.AuditoriaListView.as_view(), name='auditoria-list'),
]
