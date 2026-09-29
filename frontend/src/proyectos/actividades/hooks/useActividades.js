import { useState, useEffect } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import { useToast } from "../../../shared/context/ToastContext";

export const useActividades = () => {
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  const [actividades, setActividades] = useState([]);
  const [avances, setAvances] = useState([]);
  const [evidencias, setEvidencias] = useState({});
  const [metasIndicadores, setMetasIndicadores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [urlInputs, setUrlInputs] = useState({});

  const { showToast } = useToast();

  // =========================================================
  // CARGAR PROYECTOS
  // =========================================================

  useEffect(() => {
    const cargarProyectosDocente = async () => {
      try {
        setLoading(true);

        const response = await proyectoApi.obtenerProyectos();

        const listaProyectos = response?.results
          ? response.results
          : Array.isArray(response)
            ? response
            : [];

        const proyectosEnEjecucion = listaProyectos.filter(
          (proyecto) =>
            proyecto.estado?.toLowerCase() === "aprobado" ||
            proyecto.estado?.toLowerCase() === "en_ejecucion"
        );

        setProyectos(proyectosEnEjecucion);
      } catch (error) {
        console.error("Error cargando proyectos:", error);

        showToast(
          "error",
          "No se pudo sincronizar la lista de proyectos desde el servidor."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarProyectosDocente();
  }, [showToast]);

  // =========================================================
  // SELECCIONAR PROYECTO
  // =========================================================

  const seleccionarProyecto = async (proyecto) => {
    try {
      setLoadingDetalle(true);
      setProyectoSeleccionado(proyecto);

      const [
        dataActividades,
        dataAvances,
        dataMetasIndicadores
      ] = await Promise.all([
        proyectoApi.obtenerActividades(proyecto.id),
        proyectoApi.obtenerAvances(proyecto.id),
        proyectoApi.obtenerMetasIndicadores(proyecto.id)
      ]);

      const listaActividades = Array.isArray(dataActividades)
        ? dataActividades
        : dataActividades?.results || [];

      const listaAvances = Array.isArray(dataAvances)
        ? dataAvances
        : dataAvances?.results || [];

      const listaMetasIndicadores = Array.isArray(dataMetasIndicadores)
        ? dataMetasIndicadores
        : dataMetasIndicadores?.results || [];

      setActividades(listaActividades);
      setAvances(listaAvances);
      setMetasIndicadores(listaMetasIndicadores);

      // =====================================================
      // CARGAR EVIDENCIAS
      // =====================================================

      const evidenciasPorAvance = {};

      await Promise.all(
        listaAvances.map(async (avance) => {
          try {
            const response =
              await proyectoApi.obtenerEvidenciasAvance(
                proyecto.id,
                avance.id
              );

            const listaEvidencias = Array.isArray(response)
              ? response
              : response?.results || [];

            evidenciasPorAvance[avance.id] = listaEvidencias;
          } catch (error) {
            console.error(
              `Error cargando evidencias del avance ${avance.id}:`,
              error
            );

            evidenciasPorAvance[avance.id] = [];
          }
        })
      );

      setEvidencias(evidenciasPorAvance);
    } catch (error) {
      console.error("Error al abrir proyecto:", error);

      showToast(
        "error",
        "Ocurrió un problema al descargar las actividades, avances y metas."
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  // =========================================================
  // DESELECCIONAR PROYECTO
  // =========================================================

  const deseleccionarProyecto = () => {
    setProyectoSeleccionado(null);
    setActividades([]);
    setAvances([]);
    setEvidencias({});
    setMetasIndicadores([]);
    setUrlInputs({});
  };

  // =========================================================
  // CAMBIAR ESTADO DE ACTIVIDAD
  // =========================================================
const cambiarEstadoActividad = async (
  actividadId,
  estadoActual
) => {
  try {
    // Si ya está completada, no permitir cambios
    if (estadoActual === "completada") {
      showToast(
        "info",
        "Esta actividad ya fue completada y no puede modificarse."
      );
      return;
    }

    let nuevoEstado;

    if (estadoActual === "pendiente") {
      nuevoEstado = "en_ejecucion";
    } else if (estadoActual === "en_ejecucion") {
      nuevoEstado = "completada";
    }

    // Actualizar actividad
    const actividadActualizada =
      await proyectoApi.actualizarActividad(
        proyectoSeleccionado.id,
        actividadId,
        {
          estado: nuevoEstado
        }
      );

    setActividades((prev) =>
      prev.map((actividad) =>
        actividad.id === actividadId
          ? actividadActualizada
          : actividad
      )
    );

    // Si se completó, registrar el avance
    if (nuevoEstado === "completada") {
      const nuevoAvance =
        await proyectoApi.crearAvance(
          proyectoSeleccionado.id,
          {
            actividad: actividadId,
            descripcion: "Actividad completada",
            estado_actividad: "completada",
            observaciones: ""
          }
        );

      setAvances((prev) => [
        ...prev,
        nuevoAvance
      ]);

      setEvidencias((prev) => ({
        ...prev,
        [nuevoAvance.id]: []
      }));
    }

    showToast(
      "success",
      `Actividad actualizada a: ${nuevoEstado
        .replace("_", " ")
        .toUpperCase()}`
    );

    return actividadActualizada;

  } catch (error) {
    console.error(
      "Error actualizando actividad:",
      error
    );

    showToast(
      "error",
      "No se pudo actualizar el estado de la actividad."
    );

    throw error;
  }
};

  // =========================================================
  // REGISTRAR AVANCE
  // =========================================================

  const registrarAvance = async (
    actividadId,
    descripcion,
    observaciones = ""
  ) => {
    try {
      const actividad = actividades.find(
        (actividad) => actividad.id === actividadId
      );

      if (!actividad) {
        throw new Error("Actividad no encontrada.");
      }

      const nuevoAvance =
        await proyectoApi.crearAvance(
          proyectoSeleccionado.id,
          {
            actividad: actividadId,
            descripcion: descripcion || "",
            estado_actividad:
              actividad.estado || "pendiente",
            observaciones: observaciones || ""
          }
        );

      setAvances((prev) => [
        ...prev,
        nuevoAvance
      ]);

      setEvidencias((prev) => ({
        ...prev,
        [nuevoAvance.id]: []
      }));

      showToast(
        "success",
        "Avance registrado correctamente."
      );

      return nuevoAvance;
    } catch (error) {
      console.error("Error registrando avance:", error);

      showToast(
        "error",
        "No se pudo registrar el avance."
      );

      throw error;
    }
  };

  // =========================================================
  // OBTENER DETALLE DE AVANCE
  // =========================================================

  const obtenerDetalleAvance = async (avanceId) => {
    try {
      return await proyectoApi.obtenerAvancePorId(
        proyectoSeleccionado.id,
        avanceId
      );
    } catch (error) {
      console.error("Error obteniendo avance:", error);

      showToast(
        "error",
        "No se pudo obtener el detalle del avance."
      );

      throw error;
    }
  };

  // =========================================================
  // SUBIR ARCHIVO DE EVIDENCIA
  // =========================================================

  const subirEvidencia = async (avanceId, file) => {
    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("tipo", "archivo");
      formData.append("archivo", file);
      formData.append("nombre", file.name);

      const nuevaEvidencia =
        await proyectoApi.crearEvidenciaAvance(
          proyectoSeleccionado.id,
          avanceId,
          formData
        );

      setEvidencias((prev) => ({
        ...prev,
        [avanceId]: [
          ...(prev[avanceId] || []),
          nuevaEvidencia
        ]
      }));

      showToast(
        "success",
        "Evidencia adjuntada correctamente."
      );

      return nuevaEvidencia;
    } catch (error) {
      console.error("Error subiendo evidencia:", error);

      showToast(
        "error",
        "No se pudo subir la evidencia."
      );

      throw error;
    }
  };

  // =========================================================
  // GUARDAR ENLACE GOOGLE DRIVE
  // =========================================================

  const guardarUrlEvidencia = async (avanceId) => {
    const url = urlInputs[avanceId]?.trim();

    if (!url) return;

    try {
      const formData = new FormData();

      formData.append("tipo", "enlace");
      formData.append("enlace_drive", url);
      formData.append(
        "nombre",
        "Evidencia - Google Drive"
      );

      const nuevaEvidencia =
        await proyectoApi.crearEvidenciaAvance(
          proyectoSeleccionado.id,
          avanceId,
          formData
        );

      setEvidencias((prev) => ({
        ...prev,
        [avanceId]: [
          ...(prev[avanceId] || []),
          nuevaEvidencia
        ]
      }));

      setUrlInputs((prev) => ({
        ...prev,
        [avanceId]: ""
      }));

      showToast(
        "success",
        "Enlace de Google Drive registrado correctamente."
      );

      return nuevaEvidencia;
    } catch (error) {
      console.error("Error guardando enlace:", error);

      showToast(
        "error",
        "No se pudo guardar el enlace."
      );

      throw error;
    }
  };

  // =========================================================
  // ACTUALIZAR INPUT URL
  // =========================================================

  const actualizarUrlInput = (avanceId, valor) => {
    setUrlInputs((prev) => ({
      ...prev,
      [avanceId]: valor
    }));
  };

  // =========================================================
  // ELIMINAR EVIDENCIA
  // =========================================================

  const eliminarEvidencia = async (
    avanceId,
    evidenciaId
  ) => {
    try {
      await proyectoApi.eliminarEvidenciaAvance(
        proyectoSeleccionado.id,
        avanceId,
        evidenciaId
      );

      setEvidencias((prev) => ({
        ...prev,
        [avanceId]:
          (prev[avanceId] || []).filter(
            (evidencia) =>
              evidencia.id !== evidenciaId
          )
      }));

      showToast(
        "success",
        "Evidencia eliminada correctamente."
      );
    } catch (error) {
      console.error("Error eliminando evidencia:", error);

      showToast(
        "error",
        "No se pudo eliminar la evidencia."
      );

      throw error;
    }
  };

  // =========================================================
  // CORREGIR AVANCE OBSERVADO
  // =========================================================

  const corregirAvance = async (avanceId) => {
    try {
      await proyectoApi.corregirAvance(
        proyectoSeleccionado.id,
        avanceId
      );

      const avanceActualizado =
        await proyectoApi.obtenerAvancePorId(
          proyectoSeleccionado.id,
          avanceId
        );

      setAvances((prev) =>
        prev.map((avance) =>
          avance.id === avanceId
            ? avanceActualizado
            : avance
        )
      );

      showToast(
        "success",
        "El avance fue marcado como corregido."
      );

      return avanceActualizado;
    } catch (error) {
      console.error("Error corrigiendo avance:", error);

      showToast(
        "error",
        "No se pudo corregir el avance."
      );

      throw error;
    }
  };

  // =========================================================
  // OBSERVAR AVANCE
  // =========================================================

  const observarAvance = async (
    avanceId,
    comentario = ""
  ) => {
    try {
      await proyectoApi.observarAvance(
        proyectoSeleccionado.id,
        avanceId,
        {
          comentario_revision: comentario
        }
      );

      const avanceActualizado =
        await proyectoApi.obtenerAvancePorId(
          proyectoSeleccionado.id,
          avanceId
        );

      setAvances((prev) =>
        prev.map((avance) =>
          avance.id === avanceId
            ? avanceActualizado
            : avance
        )
      );

      showToast(
        "success",
        "El avance fue observado correctamente."
      );

      return avanceActualizado;
    } catch (error) {
      console.error("Error observando avance:", error);

      showToast(
        "error",
        "No se pudo observar el avance."
      );

      throw error;
    }
  };

  // =========================================================
  // FILTRAR ACTIVIDADES
  // =========================================================

  const actividadesFiltradas =
    Array.isArray(actividades)
      ? actividades.filter(
          (actividad) =>
            filtroEstado === "todos" ||
            actividad.estado === filtroEstado
        )
      : [];

  // =========================================================
  // PROGRESO
  // =========================================================

  const totalActividades = actividades.length;

  const actividadesCompletadas =
    actividades.filter(
      (actividad) =>
        actividad.estado === "completada"
    ).length;

  const porcentajeProgreso =
    totalActividades > 0
      ? Math.round(
          (actividadesCompletadas /
            totalActividades) *
            100
        )
      : 0;

  // =========================================================
  // RETURN
  // =========================================================

  return {
    proyectos,
    proyectoSeleccionado,

    actividades,
    actividadesFiltradas,

    avances,
    evidencias,

    metasIndicadores,

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

    registrarAvance,
    obtenerDetalleAvance,

    subirEvidencia,
    guardarUrlEvidencia,
    actualizarUrlInput,
    eliminarEvidencia,

    observarAvance,
    corregirAvance
  };
};
