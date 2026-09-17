"""
API REST del Repositorio Historico de proyectos RSU finalizados (HU-07).

Publica bajo /api/v1/repositorio/ la consulta de proyectos finalizados: el
listado con filtros combinados, los catalogos para armar esos filtros, la
ficha tecnica de cada proyecto, su informe final y el listado transversal de
lecciones aprendidas.

Como en el informe consolidado de HU-06:
- Ninguna vista arma su propio queryset: todas parten de
  services_repositorio.queryset_historico(), que ya viene filtrado a estado
  finalizado. No hay parametro que permita salirse de ahi.
- El modulo es de solo lectura: las vistas heredan de APIView y solo
  implementan get(), asi que POST, PUT, PATCH o DELETE reciben 405. Cada
  respuesta incluye "solo_lectura": true.
- Un proyecto que no esta finalizado responde 404, no 403, para no filtrar
  la existencia de proyectos en curso.

Vistas:
- RepositorioProyectosView (T-121, T-122): listado paginado y filtrado.
- RepositorioFiltrosView (T-120): catalogos para poblar los filtros.
- RepositorioFichaTecnicaView (T-123): ficha tecnica completa.
- RepositorioInformeFinalView (T-124): informe final y resultados.
- RepositorioLeccionesAprendidasView (T-124): lecciones de todos los
  proyectos, con los mismos filtros del listado.

Conecta con:
- apps/proyectos/services_repositorio.py: consultas, filtros y armado.
- apps/proyectos/urls.py: rutas que exponen estas vistas.
- apps/utils/permissions.py: PuedeConsultarRepositorioHistorico.
"""
from django.http import Http404
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planificacion.models import ODS, EjeRSU, PeriodoAcademico
from apps.usuarios.models import DepartamentoAcademico, EscuelaProfesional, Facultad
from apps.utils.permissions import PuedeConsultarRepositorioHistorico

from .services_repositorio import (
    ORDENAMIENTOS, aplicar_filtros, ordenar, queryset_historico, resumen_proyecto,
)


class _PaginacionRepositorio(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class _BaseRepositorioView(APIView):
    """Base comun: permiso y respuesta paginada con filtros aplicados."""
    permission_classes = [IsAuthenticated, PuedeConsultarRepositorioHistorico]

    def listar(self, request, qs, construir):
        """Filtra, ordena, pagina y arma cada item con `construir`."""
        qs, filtros = aplicar_filtros(qs, request.query_params)
        qs, orden = ordenar(qs, request.query_params)

        paginador = _PaginacionRepositorio()
        pagina = paginador.paginate_queryset(qs, request, view=self)
        respuesta = paginador.get_paginated_response([construir(p) for p in pagina])
        respuesta.data['solo_lectura'] = True
        respuesta.data['filtros_aplicados'] = filtros
        respuesta.data['ordering'] = orden
        return respuesta


class RepositorioProyectosView(_BaseRepositorioView):
    """GET /repositorio/proyectos/  (T-121, T-122)

    Listado paginado de proyectos finalizados. Filtros combinables: facultad,
    escuela, departamento, periodo, anio, eje_rsu, ods, semestre,
    fecha_cierre_desde, fecha_cierre_hasta y q. Cada uno admite varios
    valores (?ods=1,4). Orden con ?ordering=, por defecto -fecha_cierre.
    """

    def get(self, request):
        return self.listar(request, queryset_historico(), resumen_proyecto)
