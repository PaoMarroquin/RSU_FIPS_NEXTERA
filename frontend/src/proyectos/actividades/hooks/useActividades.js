import { useState, useEffect, useCallback } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';
import { useToast } from '../../../shared/context/ToastContext';

const SIGUIENTE_ESTADO = {
  'pendiente': 'en_ejecucion',
  'en_ejecucion': 'completada',
  'completada': 'pendiente'
};

export const useActividades = () => {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [metasIndicadores, setMetasIndicadores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { showToast } = useToast();

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [urlInputs, setUrlInputs] = useState({});

  useEffect(() => {
    const cargarProyectosDocente = async () => {
      try {
        setLoading(true);
        const response = await proyectoApi.obtenerProyectos();
        const listaProyectos = response.results ? response.results : (Array.isArray(response) ? response : []);
        const aprobados = listaProyectos.filter(p => 
          p.estado?.toLowerCase() === "aprobado" || p.estado?.toLowerCase() === "en_ejecucion"
        );
        setProyectos(aprobados);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
        showToast("error", "No se pudo sincronizar la lista de proyectos desde el servidor.");
      } finally {
        setLoading(false);
      }
    };
    cargarProyectosDocente();
  }, [showToast]);

  const seleccionarProyecto = async (proyecto) => {
    try {
      setLoadingDetalle(true);
      setProyectoSeleccionado(proyecto);

      const [dataActividades, dataProyectoFull] = await Promise.all([
        proyectoApi.obtenerActividades(proyecto.id),
        proyectoApi.obtenerProyectoPorId(proyecto.id)
      ]);

      const listaActividades = Array.isArray(dataActividades) 
        ? dataActividades 
        : (dataActividades?.results || []);

      setActividades(listaActividades);
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);

      const urlsIniciales = {};
      listaActividades.forEach(act => {
        if (act.url_evidencia) urlsIniciales[act.id] = act.url_evidencia;
      });
      setUrlInputs(urlsIniciales);

    } catch (error) {
      console.error("Error al abrir proyecto:", error);
      showToast("error", "Ocurrió un problema al descargar los indicadores y el plan de trabajo.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const deseleccionarProyecto = () => {
    setProyectoSeleccionado(null);
    setActividades([]);
    setMetasIndicadores([]);
    setUrlInputs({});
  };

  const cambiarEstadoActividad = async (actividadId, estadoActual) => {
    if (estadoActual === 'completada') {
      const confirmar = window.confirm("¿Estás seguro de reiniciar esta actividad a estado Pendiente?\nSe perderá el avance registrado.");
      if (!confirmar) return;
    }

    try {
      const proximoEstado = SIGUIENTE_ESTADO[estadoActual] || 'pendiente';
      const dataActualizada = await proyectoApi.actualizarActividad(proyectoSeleccionado.id, actividadId, { estado: proximoEstado });

      setActividades(prev => Array.isArray(prev) ? prev.map(act => act.id === actividadId ? dataActualizada : act) : []);
      showToast("success", `Actividad actualizada a: ${proximoEstado.replace('_', ' ').toUpperCase()}`);

      const dataProyectoFull = await proyectoApi.obtenerProyectoPorId(proyectoSeleccionado.id);
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showToast("error", "No se pudo actualizar el estado de la actividad.");
    }
  };

  const subirEvidencia = async (actividadId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataPayload = new FormData();
      dataPayload.append("archivo_evidencia", file);

      const dataActualizada = await proyectoApi.actualizarActividad(proyectoSeleccionado.id, actividadId, dataPayload);
      setActividades(prev => Array.isArray(prev) ? prev.map(act => act.id === actividadId ? dataActualizada : act) : []);
      showToast("success", `Evidencia adjuntada con éxito.`);
    } catch (error) {
      console.error("Error al subir evidencia:", error);
      showToast("error", "Error crítico al transferir el archivo al servidor.");
    }
  };

  const guardarUrlEvidencia = async (actividadId) => {
    const url = urlInputs[actividadId]?.trim();
    if (!url) return;
    try {
      const dataActualizada = await proyectoApi.actualizarActividad(proyectoSeleccionado.id, actividadId, { url_evidencia: url });
      setActividades(prev => Array.isArray(prev) ? prev.map(act => act.id === actividadId ? { ...act, ...dataActualizada } : act) : []);
      showToast("success", "URL de evidencia guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar URL:", error);
      showToast("error", "No se pudo guardar la URL de evidencia.");
    }
  };

  const actualizarUrlInput = (actividadId, valor) => {
    setUrlInputs(prev => ({ ...prev, [actividadId]: valor }));
  };

  const actividadesFiltradas = Array.isArray(actividades)
    ? actividades.filter(act => filtroEstado === "todos" || act.estado === filtroEstado)
    : [];

  const totalActividades = Array.isArray(actividades) ? actividades.length : 0;
  const actividadesCompletadas = Array.isArray(actividades) ? actividades.filter(act => act.estado === 'completada').length : 0;
  const porcentajeProgreso = totalActividades > 0 ? Math.round((actividadesCompletadas / totalActividades) * 100) : 0;

  return {
    proyectos,
    proyectoSeleccionado,
    metasIndicadores,
    actividadesFiltradas,
    loading,
    loadingDetalle,
    filtroEstado,
    setFiltroEstado,
    urlInputs,
    totalActividades,
    actividadesCompletadas,
    porcentajeProgreso,
    seleccionarProyecto,
    deseleccionarProyecto,
    cambiarEstadoActividad,
    subirEvidencia,
    guardarUrlEvidencia,
    actualizarUrlInput
  };
};