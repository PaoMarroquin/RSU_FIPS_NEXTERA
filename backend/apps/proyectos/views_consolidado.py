"""
API REST de informes consolidados de proyectos RSU (HU-06, T-105).

Publica bajo /api/v1/informes/consolidado/ todo lo que necesitan el
Coordinador RSU y la Autoridad Universitaria: el tablero de indicadores, el
listado de proyectos aprobados y finalizados, la ficha de cada uno, los
catalogos para armar los filtros y la descarga en PDF y Excel.

Como se cumplen los criterios de aceptacion:

- CA-01: ninguna vista arma su propio queryset. Todas parten de
  services_consolidado.queryset_consolidable(), que ya viene filtrado a los
  estados aprobado y finalizado y recortado al alcance del rol. No hay
  parametro que permita salirse de ahi.

- CA-02: el modulo entero es de solo lectura. Las vistas heredan de APIView y
  solo implementan get(), asi que cualquier POST, PUT, PATCH o DELETE recibe
  405. Ademas cada respuesta incluye "solo_lectura": true, que es la senal
  para que el frontend deshabilite los botones de accion en el perfil de
  Autoridad Universitaria.

- CA-03: los filtros son facultad, eje RSU, ODS y periodo academico (mas
  escuela, departamento y estado como extras). La consolidacion resuelve todo
  con un numero fijo de consultas agrupadas, sin recorrer proyecto por
  proyecto, para mantenerse holgadamente por debajo de los 30 segundos.

Vistas:
- InformeConsolidadoView: informe completo con indicadores y proyectos.
- InformeConsolidadoProyectosView: listado paginado de fichas.
- InformeConsolidadoProyectoDetailView: ficha detallada de un proyecto.
- InformeConsolidadoFiltrosView: catalogos para poblar los combos.
- InformeConsolidadoExportPDFView: descarga en PDF (T-107).
- InformeConsolidadoExportExcelView: descarga en Excel (T-108).

Conecta con:
- apps/proyectos/services_consolidado.py: consultas y consolidacion.
- apps/proyectos/exports_consolidado.py: generacion de PDF y Excel.
- apps/proyectos/urls.py: rutas que exponen estas vistas.
- apps/utils/permissions.py: PuedeVerInformesConsolidados.
"""
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planificacion.models import ODS, EjeRSU, PeriodoAcademico
from apps.usuarios.models import DepartamentoAcademico, EscuelaProfesional, Facultad
from apps.utils.permissions import PuedeVerInformesConsolidados

from .exports_consolidado import (
    exportar_consolidado_excel, exportar_consolidado_pdf,
)
from .services_consolidado import (
    ESTADOS_CONSOLIDABLES, aplicar_filtros, consolidar, consolidar_proyecto,
    queryset_consolidable,
)


class _PaginacionProyectos(PageNumberPagination):
    """Paginacion del listado de fichas.

    El tamano por defecto sirve para la tabla del dashboard; el frontend
    puede pedir mas con ?page_size= hasta el tope, util al armar vistas de
    impresion sin llegar a descargar el archivo.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200


class _BaseInformeConsolidadoView(APIView):
    """Base comun: permiso, alcance por rol y aplicacion de filtros.

    Solo define get() en las subclases, de modo que el resto de metodos HTTP
    devuelven 405 sin que haya que bloquearlos uno por uno (CA-02).
    """
    permission_classes = [IsAuthenticated, PuedeVerInformesConsolidados]

    def get_queryset_filtrado(self, request):
        """Queryset visible para el usuario, ya filtrado por los query params."""
        qs = queryset_consolidable(request.user)
        return aplicar_filtros(qs, request.query_params)


class InformeConsolidadoView(_BaseInformeConsolidadoView):
    """GET /informes/consolidado/

    Informe completo: indicadores, presupuesto, cumplimiento de metas,
    distribuciones y la lista de proyectos consolidados. Es la respuesta que
    alimenta el dashboard de CA-01.

    Parametros: facultad, eje_rsu, ods, periodo, escuela, departamento,
    estado. Ademas `incluir_proyectos=false` devuelve solo los agregados,
    para cuando el dashboard solo va a pintar graficos.
    """

    def get(self, request):
        qs, filtros = self.get_queryset_filtrado(request)
        incluir = request.query_params.get('incluir_proyectos', 'true').lower() != 'false'
        return Response(consolidar(qs, filtros, incluir_proyectos=incluir))


class InformeConsolidadoProyectosView(_BaseInformeConsolidadoView):
    """GET /informes/consolidado/proyectos/

    Listado paginado de fichas de proyecto, con los mismos filtros que el
    informe. Pensado para la tabla del dashboard cuando el volumen crece y no
    conviene traer todo de una vez.
    """

    def get(self, request):
        qs, filtros = self.get_queryset_filtrado(request)
        informe = consolidar(qs, filtros, incluir_proyectos=True)
        fichas = informe['proyectos']

        paginador = _PaginacionProyectos()
        pagina = paginador.paginate_queryset(fichas, request, view=self)
        respuesta = paginador.get_paginated_response(pagina)
        respuesta.data['solo_lectura'] = True
        respuesta.data['filtros_aplicados'] = filtros
        respuesta.data['resumen'] = informe['resumen']
        return respuesta


class InformeConsolidadoProyectoDetailView(_BaseInformeConsolidadoView):
    """GET /informes/consolidado/proyectos/<pk>/

    Ficha detallada de un proyecto: ademas de los totales incluye el detalle
    linea a linea de presupuesto, fuentes, metas e indicadores y avances.

    Si el proyecto no esta aprobado ni finalizado, o queda fuera del alcance
    del rol, responde 404 en lugar de 403: asi no se filtra la existencia de
    proyectos que el usuario no deberia poder ver.
    """

    def get(self, request, pk):
        qs = queryset_consolidable(request.user)
        proyecto = qs.filter(pk=pk).first()
        if proyecto is None:
            raise Http404('No existe un proyecto consolidable con ese identificador.')

        ficha = consolidar_proyecto(proyecto)
        ficha['solo_lectura'] = True
        ficha['generado_en'] = timezone.now().isoformat()
        return Response(ficha)


class InformeConsolidadoFiltrosView(_BaseInformeConsolidadoView):
    """GET /informes/consolidado/filtros/

    Catalogos para poblar los combos del panel de filtros. Solo devuelve
    valores que aparecen en al menos un proyecto consolidable dentro del
    alcance del usuario, para que el frontend no ofrezca opciones que
    llevarian a un resultado vacio.
    """

    def get(self, request):
        qs = queryset_consolidable(request.user)

        def catalogo(modelo, campo_id, extra=None):
            ids = qs.values_list(campo_id, flat=True).distinct()
            registros = modelo.objects.filter(id__in=[i for i in ids if i])
            return [
                {'id': r.id, 'nombre': (extra(r) if extra else r.nombre)}
                for r in registros.order_by('nombre')
            ]

        ods_ids = qs.values_list('ods__id', flat=True).distinct()
        ods = [
            {'id': o.id, 'numero': o.numero, 'nombre': o.nombre}
            for o in ODS.objects.filter(id__in=[i for i in ods_ids if i]).order_by('numero')
        ]

        return Response({
            'solo_lectura': True,
            'estados': [
                {'valor': valor, 'nombre': valor.replace('_', ' ').capitalize()}
                for valor in ESTADOS_CONSOLIDABLES
            ],
            'facultades': catalogo(Facultad, 'facultad_id'),
            'escuelas': catalogo(EscuelaProfesional, 'escuela_id'),
            'departamentos': catalogo(DepartamentoAcademico, 'departamento_id'),
            'ejes_rsu': catalogo(EjeRSU, 'eje_rsu_id'),
            'periodos': catalogo(PeriodoAcademico, 'periodo_id'),
            'ods': ods,
        })


class _BaseExportView(_BaseInformeConsolidadoView):
    """Base de las descargas: consolida y entrega el archivo como adjunto."""

    extension = ''
    content_type = ''

    def construir(self, informe, titulo):
        raise NotImplementedError

    def nombre_archivo(self):
        marca = timezone.localtime().strftime('%Y%m%d-%H%M')
        return 'informe-consolidado-rsu-%s.%s' % (marca, self.extension)

    def get(self, request):
        qs, filtros = self.get_queryset_filtrado(request)
        informe = consolidar(qs, filtros, incluir_proyectos=True)
        archivo = self.construir(informe, 'Informe consolidado de proyectos RSU')
        return FileResponse(
            archivo,
            as_attachment=True,
            filename=self.nombre_archivo(),
            content_type=self.content_type,
        )


class InformeConsolidadoExportPDFView(_BaseExportView):
    """GET /informes/consolidado/export/pdf/  (T-107)

    Descarga el informe consolidado en PDF, con los mismos filtros que el
    endpoint principal.
    """
    extension = 'pdf'
    content_type = 'application/pdf'

    def construir(self, informe, titulo):
        return exportar_consolidado_pdf(informe, titulo)


class InformeConsolidadoExportExcelView(_BaseExportView):
    """GET /informes/consolidado/export/excel/  (T-108)

    Descarga el informe consolidado en Excel, con una hoja de resumen, una de
    proyectos y una de distribuciones.
    """
    extension = 'xlsx'
    content_type = (
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    def construir(self, informe, titulo):
        return exportar_consolidado_excel(informe, titulo)
