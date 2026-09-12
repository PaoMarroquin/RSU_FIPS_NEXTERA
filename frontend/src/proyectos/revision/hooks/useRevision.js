import { useState, useCallback } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useRevision = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Estados del Modal de Evaluación y Detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null); 
  
  // Diccionario dinámico exhaustivo para mapear observaciones por cada campo
  const [observacionesCampos, setObservacionesCampos] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'aprobar' o 'observar'

  // Pestañas organizadas
  const [activeTab, setActiveTab] = useState("general"); 
  const [metas, setMetas] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [presupuestoCompleto, setPresupuestoCompleto] = useState([]);
  const [loadingSubRecursos, setLoadingSubRecursos] = useState(false);

  // Estados del Modal de Visualización
  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const fetchProyectos = useCallback(async () => {
    try {
      setLoading(true);
      // Usamos el endpoint específico del backend para Módulo 4: Revisión
      const res = await proyectoApi.obtenerProyectosParaRevisar();
      const pendientesDeRevision = res.results || res || [];
      setProyectos(pendientesDeRevision);
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
      setLoadingDetalle(true);
      const data = await proyectoApi.obtenerProyectoPorId(proyecto.id);
      setProyectoDetalle(data);
    } catch (error) {
      console.error("Error cargando detalle del proyecto:", error);
      showToast("error", "Error al cargar el detalle del expediente.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const openModalRevision = async (proyecto, action) => {
    setSelectedProyecto(null); 
    setActionType(action);
    setActiveTab("general");
    setModalOpen(true);
    setLoadingSubRecursos(true);
    
    setObservacionesCampos({
      titulo: "", codigo: "", linea_investigacion: "", ods_vinculados: "",
      resumen: "", justificacion: "", planteamiento_problema: "",
      objetivo_general: "", objetivos_especificos: "", localizacion: "",
      distrito_provincia: "", beneficiarios_directos: "", beneficiarios_indirectos: "",
      docentes_participantes: "", estudiantes_participantes: "", entities_aliadas: "",
      metas_globales: "", cronograma_global: "", monto_financiamiento: "",
      partidas_bienes: "", partidas_servicios: "", observacion_general: ""
    });
    
    try {
      // Llamadas concurrentes centralizadas
      const [resProyectoFull, resMetas, resCronograma, resPresupuesto] = await Promise.all([
        proyectoApi.obtenerProyectoPorId(proyecto.id),
        proyectoApi.obtenerMetasIndicadores(proyecto.id).catch(() => []),
        proyectoApi.obtenerCronograma(proyecto.id).catch(() => []),
        proyectoApi.obtenerPresupuesto(proyecto.id).catch(() => [])
      ]);

      setSelectedProyecto(resProyectoFull);
      setMetas(resMetas.results || resMetas || []);
      setCronograma(resCronograma.results || resCronograma || []);
      setPresupuestoCompleto(resPresupuesto.results || resPresupuesto || []);
    } catch (error) {
      console.error("Error cargando los datos detallados del expediente:", error);
      showToast("error", "Error al sincronizar los campos del proyecto.");
    } finally {
      setLoadingSubRecursos(false);
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
    metas, cronograma, presupuestoCompleto, loadingSubRecursos,
    modalVistaOpen, setModalVistaOpen, proyectoDetalle, loadingDetalle,
    fetchProyectos, openModalVisualizacion, openModalRevision, handleInputChange, handleEvaluate
  };
};