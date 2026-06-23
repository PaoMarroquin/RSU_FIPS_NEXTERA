from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from apps.utils.permissions import IsJefaturaRSU
from .models import (
    PeriodoAcademico,
    EjeRSU,
    ODS,
    LineaEstrategica,
    MatrizOperativa,
    ObjetivoInstitucional,
    IndicadorInstitucional,
    ActividadSugerida,
)
from .serializers import (
    PeriodoAcademicoSerializer,
    EjeRSUSerializer,
    ODSSerializer,
    LineaEstrategicaSerializer,
    MatrizOperativaSerializer,
    ObjetivoInstitucionalSerializer,
    IndicadorInstitucionalSerializer,
    ActividadSugeridaSerializer,
)
from apps.usuarios.models import Rol
from .services import export_matriz_excel, export_matriz_pdf


class PeriodoAcademicoListCreateView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('-anio', '-nombre')
    serializer_class = PeriodoAcademicoSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class PeriodoAcademicoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJefaturaRSU()]
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
        qs = LineaEstrategica.objects.select_related('eje_rsu').order_by('nombre')
        eje_id = self.request.query_params.get('eje_rsu')
        if eje_id:
            qs = qs.filter(eje_rsu_id=eje_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class LineaEstrategicaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LineaEstrategica.objects.select_related('eje_rsu').all()
    serializer_class = LineaEstrategicaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class MatrizOperativaListCreateView(generics.ListCreateAPIView):
    serializer_class = MatrizOperativaSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            MatrizOperativa.objects
            .select_related('periodo', 'facultad', 'coordinador')
            .prefetch_related(
                'objetivos__indicadores',
                'objetivos__linea_estrategica',
                'objetivos__eje_rsu',
                'actividades_sugeridas__eje_rsu',
                'actividades_sugeridas__objetivo',
            )
            .order_by('-created_at')
        )

        facultad_id = self.request.query_params.get('facultad')
        if facultad_id:
            qs = qs.filter(facultad_id=facultad_id)

        periodo_id = self.request.query_params.get('periodo')
        if periodo_id:
            qs = qs.filter(periodo_id=periodo_id)

        if user.rol and user.rol.nombre == Rol.DOCENTE:
            qs = qs.filter(estado='publicada')

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        periodo = serializer.validated_data.get('periodo')
        if not periodo:
            periodo = PeriodoAcademico.objects.filter(activo=True).first()
        serializer.save(coordinador=self.request.user, periodo=periodo)


class MatrizOperativaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = (
        MatrizOperativa.objects
        .select_related('periodo', 'facultad', 'coordinador')
        .prefetch_related(
            'objetivos__indicadores',
            'objetivos__linea_estrategica',
            'objetivos__eje_rsu',
            'actividades_sugeridas__eje_rsu',
            'actividades_sugeridas__objetivo',
        )
    )
    serializer_class = MatrizOperativaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJefaturaRSU()]
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
        matriz_id = self.request.query_params.get('matriz')
        if matriz_id:
            qs = qs.filter(matriz_id=matriz_id)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsJefaturaRSU()]
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
            return [IsAuthenticated(), IsJefaturaRSU()]
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
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class IndicadorInstitucionalRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = IndicadorInstitucional.objects.select_related('objetivo').all()
    serializer_class = IndicadorInstitucionalSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class ActividadSugeridaListCreateView(generics.ListCreateAPIView):
    serializer_class = ActividadSugeridaSerializer

    def get_queryset(self):
        qs = (
            ActividadSugerida.objects
            .select_related('eje_rsu', 'objetivo', 'matriz')
            .order_by('anio_academico', 'nombre')
        )

        matriz_id = self.request.query_params.get('matriz')
        if matriz_id:
            qs = qs.filter(matriz_id=matriz_id)

        anio = self.request.query_params.get('anio_academico')
        if anio:
            qs = qs.filter(anio_academico=anio)

        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class ActividadSugeridaRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ActividadSugerida.objects.select_related('eje_rsu', 'objetivo', 'matriz').all()
    serializer_class = ActividadSugeridaSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJefaturaRSU()]
        return [IsAuthenticated()]


class MatrizOperativaExportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        matriz = get_object_or_404(
            MatrizOperativa.objects.select_related('periodo', 'facultad', 'coordinador')
            .prefetch_related(
                'objetivos__indicadores',
                'objetivos__linea_estrategica',
                'objetivos__eje_rsu',
                'actividades_sugeridas__eje_rsu',
                'actividades_sugeridas__objetivo',
            ), 
            pk=pk
        )
        excel_file = export_matriz_excel(matriz)
        response = HttpResponse(
            excel_file.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="matriz_operativa_{matriz.id}.xlsx"'
        return response


class MatrizOperativaExportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        matriz = get_object_or_404(
            MatrizOperativa.objects.select_related('periodo', 'facultad', 'coordinador')
            .prefetch_related(
                'objetivos__indicadores',
                'objetivos__linea_estrategica',
                'objetivos__eje_rsu',
                'actividades_sugeridas__eje_rsu',
                'actividades_sugeridas__objetivo',
            ), 
            pk=pk
        )
        pdf_file = export_matriz_pdf(matriz)
        response = HttpResponse(pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="matriz_operativa_{matriz.id}.pdf"'
        return response
