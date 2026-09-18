import { useState, useEffect } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

export const useRepositorio = () => {
  // =========================
  // UI
  // =========================
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // =========================
  // PROYECTOS
  // =========================
  const [proyectosRepositorio, setProyectosRepositorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================
  // PAGINACIÓN
  // =========================
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);

  // =========================
  // FILTROS
  // =========================
  const [filtros, setFiltros] = useState({
    semestre: '',
    facultad: '',
    escuela: '',
    departamento: '',
    eje_rsu: '',
    ods: '',
    periodo: '',
    anio: '',
    fecha_cierre_desde: '',
    fecha_cierre_hasta: '',
    ordering: '-fecha_cierre',
  });

  const [opcionesFiltros, setOpcionesFiltros] = useState({
    semestres: [],
    anios: [],
    periodos: [],
    facultades: [],
    escuelas: [],
    departamentos: [],
    ejes_rsu: [],
    ods: [],
    ordenamientos: [],
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  // =========================
  // DEBOUNCE DE BÚSQUEDA
  // =========================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // =========================
  // CARGAR FILTROS
  // =========================
  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        const response = await proyectoApi.obtenerFiltrosRepositorio();

        setOpcionesFiltros({
          semestres: response?.semestres || [],
          anios: response?.anios || [],
          periodos: response?.periodos || [],
          facultades: response?.facultades || [],
          escuelas: response?.escuelas || [],
          departamentos: response?.departamentos || [],
          ejes_rsu: response?.ejes_rsu || [],
          ods: response?.ods || [],
          ordenamientos: response?.ordenamientos || [],
        });
      } catch (err) {
        console.error(
          'Error cargando filtros del repositorio:',
          err
        );
      }
    };

    cargarFiltros();
  }, []);

  // =========================
  // CARGAR PROYECTOS
  // =========================
  useEffect(() => {
    const cargarProyectos = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          page_size: pageSize,
          ordering: filtros.ordering || '-fecha_cierre',
        };

        // -------------------------
        // Búsqueda
        // -------------------------
        if (debouncedSearch) {
          params.q = debouncedSearch;
        }

        // -------------------------
        // Filtros
        // -------------------------
        Object.entries(filtros).forEach(([key, value]) => {
          if (
            key !== 'ordering' &&
            value !== '' &&
            value !== null &&
            value !== undefined
          ) {
            params[key] = value;
          }
        });

        const response =
          await proyectoApi.obtenerProyectosRepositorio(params);

        setProyectosRepositorio(response?.results || []);

        setFiltrosAplicados(
          response?.filtros_aplicados || {}
        );

        const total = response?.count || 0;

        setTotalPages(
          Math.max(1, Math.ceil(total / pageSize))
        );
      } catch (err) {
        console.error(
          'Error cargando el repositorio:',
          err
        );

        setError(err);
        setProyectosRepositorio([]);
        setFiltrosAplicados({});
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    cargarProyectos();
  }, [
    page,
    debouncedSearch,
    filtros,
  ]);

  // =========================
  // ACTUALIZAR FILTRO
  // =========================
  const actualizarFiltro = (nombre, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [nombre]: valor,
    }));

    setPage(1);
  };

  // =========================
  // LIMPIAR FILTROS
  // =========================
  const limpiarFiltros = () => {
    setFiltros({
      semestre: '',
      facultad: '',
      escuela: '',
      departamento: '',
      eje_rsu: '',
      ods: '',
      periodo: '',
      anio: '',
      fecha_cierre_desde: '',
      fecha_cierre_hasta: '',
      ordering: '-fecha_cierre',
    });

    setSearchTerm('');
    setDebouncedSearch('');
    setPage(1);
  };

  // =========================
  // OBTENER DETALLE
  // =========================
  const obtenerDetalleProyecto = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await proyectoApi.obtenerProyectoRepositorio(id);

      setProyectoSeleccionado(response);

      return response;
    } catch (err) {
      console.error(
        'Error cargando detalle del proyecto:',
        err
      );

      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CERRAR DETALLE
  // =========================
  const cerrarDetalleProyecto = () => {
    setProyectoSeleccionado(null);
  };

  // =========================
  // INFORME FINAL
  // =========================
  const obtenerInformeFinal = async (id) => {
    try {
      setError(null);

      const response =
        await proyectoApi.obtenerInformeFinalRepositorio(id);

      return response;
    } catch (err) {
      console.error(
        'Error cargando informe final:',
        err
      );

      setError(err);
      return null;
    }
  };

  // =========================
  // LECCIONES APRENDIDAS
  // =========================
  const obtenerLeccionesAprendidas = async (
    params = {}
  ) => {
    try {
      setError(null);

      const response =
        await proyectoApi.obtenerLeccionesAprendidas(params);

      return response;
    } catch (err) {
      console.error(
        'Error cargando lecciones aprendidas:',
        err
      );

      setError(err);
      return null;
    }
  };

  return {
    // UI
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,

    // Proyecto seleccionado
    proyectoSeleccionado,
    setProyectoSeleccionado,
    cerrarDetalleProyecto,

    // Proyectos
    proyectosRepositorio,
    loading,
    error,

    // Paginación
    page,
    setPage,
    pageSize,
    totalPages,

    // Filtros
    filtros,
    setFiltros,
    opcionesFiltros,
    filtrosAplicados,
    actualizarFiltro,
    limpiarFiltros,

    // Detalle
    obtenerDetalleProyecto,

    // Informe final
    obtenerInformeFinal,

    // Lecciones aprendidas
    obtenerLeccionesAprendidas,
  };
};