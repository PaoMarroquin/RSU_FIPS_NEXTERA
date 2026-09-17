"""
Vistas del modulo de planificacion.

Exponen los catalogos que alimentan los formularios de proyecto (periodos,
ejes RSU, ODS, lineas estrategicas), los objetivos institucionales con sus
indicadores y actividades sugeridas, y los documentos de guia que publica la
Jefatura RSU (matriz operativa y documentos de apoyo).

Regla de acceso: los catalogos son de lectura para cualquier usuario
autenticado; crearlos o modificarlos es tarea del Administrador. Los
documentos de guia los publica la Jefatura RSU o el Administrador.

Conecta con:
- apps/planificacion/models.py y serializers.py: datos y validacion.
- apps/planificacion/urls.py: rutas que exponen estas vistas.
- apps/utils/permissions.py: IsAdministrador e IsJefaturaRSU.
"""
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.utils.permissions import IsAdministrador, IsJefaturaRSU
from .models import (
    PeriodoAcademico,
    EjeRSU,
    ODS,
    ObjetivoRegional,
    ObjetivoNacional,
    LineaEstrategica,
    MatrizOperativa,
    ObjetivoInstitucional,
    IndicadorInstitucional,
    ActividadSugerida,
    DocumentoApoyo,
)
from .serializers import (
    PeriodoAcademicoSerializer,
    EjeRSUSerializer,
    ODSSerializer,
    ObjetivoRegionalSerializer,
    ObjetivoNacionalSerializer,
    LineaEstrategicaSerializer,
    MatrizOperativaSerializer,
    ObjetivoInstitucionalSerializer,
    IndicadorInstitucionalSerializer,
    ActividadSugeridaSerializer,
    DocumentoApoyoSerializer,
)
from apps.usuarios.models import Rol


class PeriodoAcademicoListCreateView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('-anio', '-nombre')
    serializer_class = PeriodoAcademicoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre']
    ordering_fields = ['nombre', 'anio', 'semestre', 'fecha_inicio']
    ordering = ['-anio', 'semestre']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class PeriodoAcademicoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class EjeRSUListView(generics.ListAPIView):
    queryset = EjeRSU.objects.prefetch_related('subitems').order_by('nombre')
    serializer_class = EjeRSUSerializer
    permission_classes = [IsAuthenticated]


class ODSListView(generics.ListAPIView):
    queryset = ODS.objects.all().order_by('numero')
    serializer_class = ODSSerializer
    permission_classes = [IsAuthenticated]


class ObjetivoRegionalListCreateView(generics.ListCreateAPIView):
    queryset = ObjetivoRegional.objects.all().order_by('codigo', 'nombre')
    serializer_class = ObjetivoRegionalSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ObjetivoRegionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ObjetivoRegional.objects.all()
    serializer_class = ObjetivoRegionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ObjetivoNacionalListCreateView(generics.ListCreateAPIView):
    queryset = ObjetivoNacional.objects.all().order_by('codigo', 'nombre')
    serializer_class = ObjetivoNacionalSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'codigo']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ObjetivoNacionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ObjetivoNacional.objects.all()
    serializer_class = ObjetivoNacionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class LineaEstrategicaListCreateView(generics.ListCreateAPIView):
    serializer_class = LineaEstrategicaSerializer

    def get_queryset(self):
        qs = LineaEstrategica.objects.select_related('eje_rsu').order_by('nombre')
        eje_id = self.request.query_params.get('eje_rsu')
        if eje_id:
            qs = qs.filter(eje_rsu_id=eje_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class LineaEstrategicaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LineaEstrategica.objects.select_related('eje_rsu').all()
    serializer_class = LineaEstrategicaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class MatrizOperativaListCreateView(generics.ListCreateAPIView):
    """
    Documentos de guia para la formulacion de proyectos.

    Lectura: cualquier usuario autenticado (los docentes los consultan).
    Escritura: Jefatura RSU o Administrador, que son quienes los publican.
    """
    queryset = MatrizOperativa.objects.all()
    serializer_class = MatrizOperativaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['created_at', 'nombre']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class MatrizOperativaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MatrizOperativa.objects.all()
    serializer_class = MatrizOperativaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ObjetivoInstitucionalListCreateView(generics.ListCreateAPIView):
    serializer_class = ObjetivoInstitucionalSerializer

    def get_queryset(self):
        qs = (
            ObjetivoInstitucional.objects
            .select_related('linea_estrategica', 'eje_rsu')
            .prefetch_related('indicadores')
            .order_by('nombre')
        )
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ObjetivoInstitucionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = (
        ObjetivoInstitucional.objects
        .select_related('linea_estrategica', 'eje_rsu')
        .prefetch_related('indicadores')
    )
    serializer_class = ObjetivoInstitucionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class IndicadorInstitucionalListCreateView(generics.ListCreateAPIView):
    serializer_class = IndicadorInstitucionalSerializer

    def get_queryset(self):
        qs = IndicadorInstitucional.objects.select_related('objetivo').order_by('nombre')
        objetivo_id = self.request.query_params.get('objetivo')
        if objetivo_id:
            qs = qs.filter(objetivo_id=objetivo_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class IndicadorInstitucionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = IndicadorInstitucional.objects.select_related('objetivo').all()
    serializer_class = IndicadorInstitucionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]


class ActividadSugeridaListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadSugeridaSerializer

    def get_queryset(self):
        qs = (
            ActividadSugerida.objects
            .select_related('eje_rsu', 'objetivo')
            .order_by('anio_academico', 'nombre')
        )

        anio = self.request.query_params.get('anio_academico')
        if anio:
            qs = qs.filter(anio_academico=anio)

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]


class ActividadSugeridaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ActividadSugerida.objects.select_related('eje_rsu', 'objetivo').all()
    serializer_class = ActividadSugeridaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdministrador()]
        return [IsAuthenticated()]




class DocumentoApoyoListCreateView(generics.ListCreateAPIView):
    """
    Repositorio de documentos guía para la formulación de proyectos.

    Lectura: cualquier usuario autenticado (los docentes solo ven los
    documentos activos; Administrador y Jefatura RSU ven también los
    inactivos para poder reactivarlos).
    Escritura: Administrador o Jefatura RSU, que es quien sube las guías
    (líneas de investigación, objetivos regionales, normativa, etc.).
    """
    serializer_class = DocumentoApoyoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['created_at', 'titulo', 'categoria']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = DocumentoApoyo.objects.select_related('publicado_por').all()
        user = self.request.user
        es_gestor = user.is_staff or (user.rol and user.rol.nombre in [Rol.ADMINISTRADOR, Rol.JEFATURA])
        if not es_gestor:
            qs = qs.filter(activo=True)
        categoria = self.request.query_params.get('categoria')
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(publicado_por=self.request.user)


class DocumentoApoyoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentoApoyoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = DocumentoApoyo.objects.select_related('publicado_por').all()
        user = self.request.user
        es_gestor = user.is_staff or (user.rol and user.rol.nombre in [Rol.ADMINISTRADOR, Rol.JEFATURA])
        if not es_gestor:
            qs = qs.filter(activo=True)
        return qs

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), (IsAdministrador | IsJefaturaRSU)()]
        return [IsAuthenticated()]
