import { useState, useEffect, useCallback } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import { useToast } from "../../../shared/context/ToastContext";

// =====================================================
// HOOK - MIS INFORMES
// Sprint 8 / HU-11
// =====================================================

export const useInformes = () => {
  // =====================================================
  // FILTROS
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // =====================================================
  // PROYECTOS
  // =====================================================

  const [dataMatrices, setDataMatrices] = useState([]);
  const [matrizSeleccionada, setMatrizSeleccionada] = useState(null);

  // =====================================================
  // INFORME DE FINALIZACIÓN DEL PROYECTO SELECCIONADO
  // =====================================================

  const [informeFinalizacion, setInformeFinalizacion] = useState(null);
  const [loadingInformeFinalizacion, setLoadingInformeFinalizacion] =
    useState(false);

  // =====================================================
  // ESTADOS GENERALES
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { showToast } = useToast();

  // =====================================================
  // OBTENER PROYECTOS DEL DOCENTE
  // =====================================================

  const fetchMatrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /*
       * El endpoint de proyectos ya trabaja con el usuario autenticado.
       * Por eso no enviamos un docente manualmente.
       */
      const response = await proyectoApi.obtenerProyectos();

      const proyectosArray = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : [];

      setDataMatrices(proyectosArray);

      // Seleccionar automáticamente el primer proyecto
      if (proyectosArray.length > 0) {
        setMatrizSeleccionada(proyectosArray[0]);
      } else {
        setMatrizSeleccionada(null);
      }
    } catch (err) {
      console.error(
        "Error al traer los proyectos del docente:",
        err
      );

      setDataMatrices([]);
      setMatrizSeleccionada(null);

      if (err.response?.status === 401) {
        setError(
          "No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión."
        );
      } else {
        setError(
          "No se pudo obtener la información de los proyectos."
        );

        showToast(
          "error",
          "Error al cargar los expedientes."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    fetchMatrices();
  }, [fetchMatrices]);

  // =====================================================
  // OBTENER INFORME DE FINALIZACIÓN
  // DEL PROYECTO SELECCIONADO
  // =====================================================

  const fetchInformeFinalizacion = useCallback(
    async (proyectoId) => {
      if (
        proyectoId === undefined ||
        proyectoId === null ||
        proyectoId === ""
      ) {
        setInformeFinalizacion(null);
        return;
      }

      try {
        setLoadingInformeFinalizacion(true);

        const response =
          await proyectoApi.obtenerInformeFinalizacion(
            proyectoId
          );

        setInformeFinalizacion(response);
      } catch (err) {
        console.error(
          "Error al obtener el informe de finalización:",
          err
        );

        setInformeFinalizacion(null);

        /*
         * No mostramos error inmediatamente porque un proyecto
         * puede tener todavía el informe de finalización sin iniciar.
         */
        if (err.response?.status !== 404) {
          showToast(
            "error",
            "No se pudo cargar el informe de finalización."
          );
        }
      } finally {
        setLoadingInformeFinalizacion(false);
      }
    },
    [showToast]
  );

  // =====================================================
  // CAMBIAR PROYECTO SELECCIONADO
  // =====================================================

  const seleccionarProyecto = useCallback(
    (proyecto) => {
      setMatrizSeleccionada(proyecto);
      setInformeFinalizacion(null);

      if (proyecto?.id) {
        fetchInformeFinalizacion(proyecto.id);
      }
    },
    [fetchInformeFinalizacion]
  );

  // =====================================================
  // SI CAMBIA EL PROYECTO SELECCIONADO
  // CARGAR SU INFORME DE FINALIZACIÓN
  // =====================================================

  useEffect(() => {
    if (matrizSeleccionada?.id) {
      fetchInformeFinalizacion(matrizSeleccionada.id);
    } else {
      setInformeFinalizacion(null);
    }
  }, [
    matrizSeleccionada?.id,
    fetchInformeFinalizacion,
  ]);

  // =====================================================
  // FILTRAR PROYECTOS
  // =====================================================

  const filteredMatrices = (
    Array.isArray(dataMatrices)
      ? dataMatrices
      : []
  ).filter((matriz) => {
    if (!matriz) return false;

    const facultad =
      matriz.facultad_nombre ||
      matriz.facultad ||
      "";

    const titulo =
      matriz.titulo ||
      matriz.nombre ||
      "";

    const codigo =
      matriz.codigo ||
      `PRY-${matriz.id}`;

    const estado =
      matriz.estado ||
      "pendiente";

    const textoBusqueda =
      searchTerm.trim().toLowerCase();

    const matchesSearch =
      !textoBusqueda ||
      facultad
        .toLowerCase()
        .includes(textoBusqueda) ||
      titulo
        .toLowerCase()
        .includes(textoBusqueda) ||
      codigo
        .toLowerCase()
        .includes(textoBusqueda);

    const matchesFaculty =
      facultyFilter
        ? facultad === facultyFilter
        : true;

    const matchesStatus =
      statusFilter
        ? estado === statusFilter
        : true;

    return (
      matchesSearch &&
      matchesFaculty &&
      matchesStatus
    );
  });

  // =====================================================
  // DOCUMENTOS DEL PROYECTO SELECCIONADO
  // SOLO LECTURA
  // =====================================================

  const documentosProyecto = matrizSeleccionada
    ? [
        {
          id: "planificacion",
          tipo: "planificacion",
          titulo: "Informe de planificación",
          descripcion:
            "Documento oficial de planificación del proyecto.",
          estado: "disponible",
          fecha:
            matrizSeleccionada.fecha_aprobacion ||
            matrizSeleccionada.fecha_creacion ||
            null,
        },
        {
          id: "finalizacion",
          tipo: "finalizacion",
          titulo: "Informe de finalización",
          descripcion:
            "Informe de ejecución y cierre presentado por el docente.",
          estado:
            informeFinalizacion?.finalizacion?.estado ||
            informeFinalizacion?.estado ||
            "pendiente",
          fecha:
            informeFinalizacion?.fecha_envio ||
            null,
        },
        {
          id: "constancia",
          tipo: "constancia",
          titulo: "Constancia de ejecución",
          descripcion:
            "Constancia emitida después de aprobar el informe de finalización.",
          estado:
            informeFinalizacion?.constancia_aprobada === true
              ? "disponible"
              : "pendiente",
          fecha:
            informeFinalizacion?.fecha_aprobacion ||
            null,
        },
      ]
    : [];

  // =====================================================
  // RECARGAR
  // =====================================================

  const recargarInformes = useCallback(async () => {
    await fetchMatrices();
  }, [fetchMatrices]);

  // =====================================================
  // RETORNO
  // =====================================================

  return {
    // -----------------------------------------
    // Proyectos
    // -----------------------------------------
    dataMatrices,
    filteredMatrices,
    matrizSeleccionada,
    setMatrizSeleccionada,
    seleccionarProyecto,

    // -----------------------------------------
    // Filtros
    // -----------------------------------------
    searchTerm,
    setSearchTerm,

    facultyFilter,
    setFacultyFilter,

    statusFilter,
    setStatusFilter,

    // -----------------------------------------
    // Informe de finalización
    // -----------------------------------------
    informeFinalizacion,
    loadingInformeFinalizacion,
    fetchInformeFinalizacion,

    // -----------------------------------------
    // Documentos
    // -----------------------------------------
    documentosProyecto,

    // -----------------------------------------
    // Estados
    // -----------------------------------------
    loading,
    error,

    // -----------------------------------------
    // Acciones
    // -----------------------------------------
    recargarInformes,
  };
};