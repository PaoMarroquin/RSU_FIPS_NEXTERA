import { useState, useCallback } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useRevision = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Estados del Modal de Evaluación
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [observacionesCampos, setObservacionesCampos] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'aprobar' o 'observar'
  const [activeTab, setActiveTab] = useState("general");
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Estados del Modal de Visualización (solo lectura)
  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [loadingVista, setLoadingVista] = useState(false);

  // Diccionario exhaustivo de observaciones — claves alineadas 1:1 con
  // ProyectoRSUSerializer (backend) y useFormRSU (creación/edición).
  const CAMPOS_INICIALES = {
    // Sección I - Identificación y clasificación académica
    unidad_academica: "", periodo_semestre: "", titulo: "",
    asignaturas: "", anio_carrera: "", num_docentes_estudiantes: "",
    lugar_ejecucion: "",
    // Sección I - Enfoque RSU
    beneficiarios: "", eje_rsu: "", ejes_subitems: "",
    tipo_actividad: "", ods: "",
    metas_indicadores: "", fechas_clave: "",
    // Sección II - Fundamentación
    fund_por_que_grupo: "", fund_para_que_proyecto: "", fund_mecanismo_ensenanza: "",
    // Sección III - Diagnóstico
    diag_estado_grupo: "", diag_problemas_detectados: "",
    diag_aportes_formacion: "", diag_justificacion_intervencion: "",
    // Sección IV - Objetivos
    obj_logro_intervencion: "", obj_mejora_curricular: "",
    // Sección V - Resultados
    resultado_en_beneficiarios: "", resultado_en_curriculo: "", impacto_esperado: "",
    // Sección VI - Actividades
    actividades: "",
    // Sección VII - Cronograma
    cronograma: "",
    // Sección VIII - Recursos
    rec_humanos: "", rec_materiales: "",
    // Sección IX - Financiamiento
    monto_financiamiento: "", fuentes_financiamiento: "",
    descripcion_gastos: "", observaciones_financiamiento: "",
    // Cierre
    observacion_general: ""
  };

  const fetchProyectos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await proyectoApi.obtenerProyectosParaRevisar();
      setProyectos(res.results || res || []);
    } catch (error) {
      console.error("Error fetching revisiones:", error);
      showToast("error", "No se pudo conectar con el servidor de proyectos.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const openModalVisualizacion = async (proyecto) => {
    setProyectoDetalle(null);
    setModalVistaOpen(true);
    try {
      setLoadingVista(true);
      const data = await proyectoApi.obtenerProyectoPorId(proyecto.id);
      setProyectoDetalle(data);
    } catch (error) {
      console.error("Error cargando detalle del proyecto:", error);
      showToast("error", "Error al cargar el detalle del expediente.");
    } finally {
      setLoadingVista(false);
    }
  };

  const openModalRevision = async (proyecto, action) => {
    setSelectedProyecto(null);
    setActionType(action);
    setActiveTab("general");
    setModalOpen(true);
    setLoadingDetalle(true);
    setObservacionesCampos({ ...CAMPOS_INICIALES });

    try {
      // Una sola llamada: el serializer ya trae actividades, cronograma,
      // metas_indicadores y fuentes_financiamiento anidados.
      const data = await proyectoApi.obtenerProyectoPorId(proyecto.id);
      setSelectedProyecto(data);
    } catch (error) {
      console.error("Error cargando el expediente:", error);
      showToast("error", "Error al sincronizar los campos del proyecto.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setObservacionesCampos(prev => ({ ...prev, [campo]: valor }));
  };

  const handleEvaluate = async () => {
    const camposConObservacion = Object.entries(observacionesCampos).reduce((acc, [key, val]) => {
      if (val.trim() && key !== "observacion_general") acc[key] = val.trim();
      return acc;
    }, {});

    if (actionType === "observar" && Object.keys(camposConObservacion).length === 0 && !observacionesCampos.observacion_general?.trim()) {
      showToast("error", "Debes registrar al menos una observación detallada o un comentario general.");
      return;
    }

    try {
      setEvaluating(true);
      const payload = {};

      if (actionType === "aprobar") {
        payload.comentario = "El proyecto cumple con los requisitos normativos.";
        await proyectoApi.aprobarProyecto(selectedProyecto.id, payload);
      } else if (actionType === "observar") {
        let textoEstructurado = "";
        if (observacionesCampos.observacion_general?.trim()) {
          textoEstructurado += `RESUMEN GENERAL:\n${observacionesCampos.observacion_general.trim()}\n\n`;
        }
        textoEstructurado += "DETALLE DE OBSERVACIONES POR CAMPO:\n";

        Object.entries(camposConObservacion).forEach(([campo, textoObs]) => {
          const nombreFormateado = campo.replace(/_/g, " ").toUpperCase();
          textoEstructurado += `- En [${nombreFormateado}]: ${textoObs}\n`;
        });
        payload.comentario_tecnico = textoEstructurado;
        await proyectoApi.observarProyecto(selectedProyecto.id, payload);
      }

      showToast("success", `El proyecto ha sido ${actionType === 'aprobar' ? 'Aprobado' : 'Observado'} con éxito.`);
      setModalOpen(false);
      fetchProyectos();
    } catch (error) {
      console.error("Error al evaluar:", error);
      const apiError = error.response?.data?.comentario_tecnico || error.response?.data?.detail;
      const mensajeFinal = typeof apiError === 'object' ? (apiError.string || JSON.stringify(apiError)) : apiError;
      showToast("error", mensajeFinal || "Error al procesar el dictamen.");
    } finally {
      setEvaluating(false);
    }
  };

  return {
    proyectos, loading, modalOpen, setModalOpen, selectedProyecto,
    observacionesCampos, evaluating, actionType, activeTab, setActiveTab,
    loadingDetalle,
    modalVistaOpen, setModalVistaOpen, proyectoDetalle, loadingVista,
    fetchProyectos, openModalVisualizacion, openModalRevision, handleInputChange, handleEvaluate
  };
};