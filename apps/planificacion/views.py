from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.utils.permissions import IsCoordinador
from .models import (
    PeriodoAcademico,
    EjeRSU,
    ODS,
    LineaEstrategica,
    MatrizOperativa,
    ObjetivoInstitucional,
    IndicadorInstitucional,
    ActividadSugerida
)
from .serializers import (
    PeriodoAcademicoSerializer,
    EjeRSUSerializer,
    ODSSerializer,
    LineaEstrategicaSerializer,
    MatrizOperativaSerializer,
    ObjetivoInstitucionalSerializer,
    IndicadorInstitucionalSerializer,
    ActividadSugeridaSerializer
)
from apps.usuarios.models import Rol

class PeriodoAcademicoListCreateView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('-anio', '-nombre')
    serializer_class = PeriodoAcademicoSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class PeriodoAcademicoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class EjeRSUListView(generics.ListAPIView):
    queryset = EjeRSU.objects.all().order_by('nombre')
    serializer_class = EjeRSUSerializer
    permission_classes = [IsAuthenticated]


class ODSListView(generics.ListAPIView):
    queryset = ODS.objects.all().order_by('numero')
    serializer_class = ODSSerializer
    permission_classes = [IsAuthenticated]


class LineaEstrategicaListCreateView(generics.ListCreateAPIView):
    serializer_class = LineaEstrategicaSerializer

    def get_queryset(self):
        qs = LineaEstrategica.objects.all().order_by('nombre')
        eje_id = self.request.query_params.get('eje_rsu')
        if eje_id:
            qs = qs.filter(eje_rsu_id=eje_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class LineaEstrategicaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LineaEstrategica.objects.all()
    serializer_class = LineaEstrategicaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class MatrizOperativaListCreateView(generics.ListCreateAPIView):
    serializer_class = MatrizOperativaSerializer

    def get_queryset(self):
        user = self.request.user
        qs = MatrizOperativa.objects.all().order_by('-created_at')

        # Filter by faculty if query param is set
        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)

        # Filter by period if query param is set
        periodo_id = self.request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        # If user is Docente or Estudiante, they should only see published matrices
        if user.rol and user.rol.nombre in [Rol.DOCENTE, Rol.ESTUDIANTE]:
            qs = qs.filter(estado='publicada')

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(coordinador=self.request.user)


class MatrizOperativaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MatrizOperativa.objects.all()
    serializer_class = MatrizOperativaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class ObjetivoInstitucionalListCreateView(generics.ListCreateAPIView):
    serializer_class = ObjetivoInstitucionalSerializer

    def get_queryset(self):
        qs = ObjetivoInstitucional.objects.all().order_by('nombre')
        matriz_id = self.request.query_params.get('matriz')
        if matriz_id:
            qs = qs.filter(matriz_id=matriz_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class ObjetivoInstitucionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ObjetivoInstitucional.objects.all()
    serializer_class = ObjetivoInstitucionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class IndicadorInstitucionalListCreateView(generics.ListCreateAPIView):
    serializer_class = IndicadorInstitucionalSerializer

    def get_queryset(self):
        qs = IndicadorInstitucional.objects.all().order_by('nombre')
        objetivo_id = self.request.query_params.get('objetivo')
        if objetivo_id:
            qs = qs.filter(objetivo_id=objetivo_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class IndicadorInstitucionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = IndicadorInstitucional.objects.all()
    serializer_class = IndicadorInstitucionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class ActividadSugeridaListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadSugeridaSerializer

    def get_queryset(self):
        qs = ActividadSugerida.objects.all().order_by('anio_academico', 'nombre')
        
        matriz_id = self.request.query_params.get('matriz')
        if matriz_id:
            qs = qs.filter(matriz_id=matriz_id)

        anio = self.request.query_params.get('anio_academico')
        if anio:
            qs = qs.filter(anio_academico=anio)

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]


class ActividadSugeridaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ActividadSugerida.objects.all()
    serializer_class = ActividadSugeridaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsCoordinador()]
        return [IsAuthenticated()]
