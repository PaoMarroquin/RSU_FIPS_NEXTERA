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
    ORDENAMIENTOS, aplicar_filtros, con_lecciones_aprendidas, ficha_tecnica,
    informe_final, leccion_aprendida, ordenar, queryset_ficha,
    queryset_historico, resumen_proyecto,
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


class RepositorioLeccionesAprendidasView(_BaseRepositorioView):
    """GET /repositorio/lecciones-aprendidas/  (T-124)

    Lecciones aprendidas de todos los proyectos finalizados que las
    registraron, con los mismos filtros y orden que el listado de proyectos.
    Permite consultarlas de forma transversal (p. ej. todas las de un eje RSU)
    sin entrar proyecto por proyecto.
    """

    def get(self, request):
        qs = con_lecciones_aprendidas(queryset_historico())
        return self.listar(request, qs, leccion_aprendida)


class RepositorioFiltrosView(_BaseRepositorioView):
    """GET /repositorio/filtros/  (T-120)

    Catalogos para los combos de filtros. Solo devuelve valores presentes en
    al menos un proyecto finalizado, para no ofrecer opciones que lleven a un
    resultado vacio.
    """

    def get(self, request):
        qs = queryset_historico()

        def ids_de(campo):
            return [i for i in qs.values_list(campo, flat=True).distinct() if i]

        def catalogo(modelo, campo):
            return [
                {'id': r.id, 'nombre': r.nombre}
                for r in modelo.objects.filter(id__in=ids_de(campo)).order_by('nombre')
            ]

        escuelas = [
            {'id': e.id, 'nombre': e.nombre, 'facultad_id': e.facultad_id}
            for e in EscuelaProfesional.objects.filter(
                id__in=ids_de('escuela_id')).order_by('nombre')
        ]
        departamentos = [
            {'id': d.id, 'nombre': d.nombre, 'facultad_id': d.facultad_id}
            for d in DepartamentoAcademico.objects.filter(
                id__in=ids_de('departamento_id')).order_by('nombre')
        ]
        periodos = [
            {'id': p.id, 'nombre': p.nombre, 'anio': p.anio, 'semestre': p.semestre}
            for p in PeriodoAcademico.objects.filter(
                id__in=ids_de('periodo_id')).order_by('-anio', '-semestre')
        ]
        ods = [
            {'id': o.id, 'numero': o.numero, 'nombre': o.nombre, 'icono_url': o.icono_url}
            for o in ODS.objects.filter(id__in=ids_de('ods__id')).order_by('numero')
        ]
        semestres = sorted(
            {s for s in qs.values_list('semestre_academico', flat=True) if s},
            reverse=True)

        return Response({
            'solo_lectura': True,
            'semestres': semestres,
            'anios': sorted({p['anio'] for p in periodos}, reverse=True),
            'periodos': periodos,
            'facultades': catalogo(Facultad, 'facultad_id'),
            'escuelas': escuelas,
            'departamentos': departamentos,
            'ejes_rsu': catalogo(EjeRSU, 'ejes_rsu__id'),
            'ods': ods,
            'ordenamientos': sorted(ORDENAMIENTOS),
        })


class _BaseProyectoHistoricoView(_BaseRepositorioView):
    """Obtiene un proyecto finalizado o responde 404."""

    def get_proyecto(self, pk):
        proyecto = queryset_ficha().filter(pk=pk).first()
        if proyecto is None:
            raise Http404('No existe un proyecto finalizado con ese identificador.')
        return proyecto

    def responder(self, datos):
        datos['solo_lectura'] = True
        datos['generado_en'] = timezone.now().isoformat()
        return Response(datos)


class RepositorioFichaTecnicaView(_BaseProyectoHistoricoView):
    """GET /repositorio/proyectos/<pk>/  (T-123)

    Ficha tecnica del proyecto historico con todas las secciones del ANEXO 4.
    """

    def get(self, request, pk):
        return self.responder(ficha_tecnica(self.get_proyecto(pk)))


class RepositorioInformeFinalView(_BaseProyectoHistoricoView):
    """GET /repositorio/proyectos/<pk>/informe-final/  (T-124)

    Conclusiones, recomendaciones, lecciones aprendidas y medio de difusion,
    junto con los resultados esperados y los alcanzados (actividades, metas y
    presupuesto ejecutado).
    """

    def get(self, request, pk):
        return self.responder(informe_final(self.get_proyecto(pk)))
