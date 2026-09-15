import React, { useEffect, useState } from "react";
import Layout from "../../../shared/layout/Layout";
import {
  FiSearch,
  FiFileText,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiEye,
  FiX,
  FiBarChart2,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiActivity,
  FiLock,
  FiAlertTriangle,
} from "react-icons/fi";
import { useInformes } from "../hooks/informeconsolidado";

// Campos de filtro según el contrato HU-06 (sección 4). El "campo" coincide
// con la clave que espera el backend como query param y con la clave del
// catálogo devuelto por /informes/consolidado/filtros/.
const CAMPOS_FILTRO = [
  { campo: "facultad", label: "Facultad" },
  { campo: "escuela", label: "Escuela" },
  { campo: "departamento", label: "Departamento" },
  { campo: "periodo", label: "Periodo" },
  { campo: "eje_rsu", label: "Eje RSU" },
  { campo: "ods", label: "ODS" },
  { campo: "estado", label: "Estado" },
];

const InformeConsolidado = () => {
  const {
    informe,
    filtros,
    proyectos,
    proyectoDetalle,
    loading,
    loadingFiltros,
    loadingProyectos,
    loadingDetalle,
    error,
    obtenerInformeConsolidado,
    obtenerFiltros,
    obtenerProyectosConsolidados,
    obtenerDetalleProyecto,
    descargarPDF,
    descargarExcel,
  } = useInformes();

  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    facultad: "",
    eje_rsu: "",
    ods: "",
    periodo: "",
    escuela: "",
    departamento: "",
    estado: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [exportando, setExportando] = useState(null); // 'pdf' | 'excel' | null

  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {
    obtenerFiltros();

    obtenerInformeConsolidado({
      incluir_proyectos: false,
    });

    obtenerProyectosConsolidados();
  }, [
    obtenerFiltros,
    obtenerInformeConsolidado,
    obtenerProyectosConsolidados,
  ]);

  // =========================================================
  // FILTROS
  // =========================================================

  const handleFiltroChange = (campo, valor) => {
    setFiltrosSeleccionados((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const hayFiltrosActivos = Object.values(filtrosSeleccionados).some(
    (v) => v !== "" && v != null
  );

  const aplicarFiltros = async () => {
    try {
      await Promise.all([
        obtenerInformeConsolidado({
          ...filtrosSeleccionados,
          incluir_proyectos: false,
        }),
        obtenerProyectosConsolidados(filtrosSeleccionados),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const limpiarFiltros = async () => {
    const filtrosIniciales = {
      facultad: "",
      eje_rsu: "",
      ods: "",
      periodo: "",
      escuela: "",
      departamento: "",
      estado: "",
    };

    setFiltrosSeleccionados(filtrosIniciales);

    try {
      await Promise.all([
        obtenerInformeConsolidado({
          incluir_proyectos: false,
        }),
        obtenerProyectosConsolidados(),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================
  // DETALLE
  // =========================================================

  const verDetalle = async (id) => {
    try {
      setErrorDetalle(null);
      setMostrarDetalle(true);
      await obtenerDetalleProyecto(id);
    } catch (err) {
      console.error(err);
      // 404 según CA de la HU-06: proyecto fuera de alcance o no consolidable.
      const status = err?.response?.status;
      if (status === 404) {
        setErrorDetalle("El proyecto no está disponible en el informe.");
      } else {
        setErrorDetalle("No se pudo cargar la ficha del proyecto.");
      }
    }
  };

  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setErrorDetalle(null);
  };

  // =========================================================
  // EXPORTACIONES
  // =========================================================

  const exportarPDF = async () => {
    try {
      setExportando("pdf");
      await descargarPDF(filtrosSeleccionados);
    } catch (err) {
      console.error(err);
    } finally {
      setExportando(null);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando("excel");
      await descargarExcel(filtrosSeleccionados);
    } catch (err) {
      console.error(err);
    } finally {
      setExportando(null);
    }
  };

  // =========================================================
  // PROYECTOS
  // =========================================================

  const proyectosData = Array.isArray(proyectos)
    ? proyectos
    : proyectos?.results || [];

  const proyectosFiltrados = proyectosData.filter((proyecto) => {
    const texto = searchTerm.toLowerCase();

    return (
      String(proyecto?.titulo || "")
        .toLowerCase()
        .includes(texto) ||
      String(proyecto?.codigo || "")
        .toLowerCase()
        .includes(texto) ||
      String(proyecto?.docente_responsable || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  // =========================================================
  // OPCIONES DE FILTROS
  // =========================================================

  const obtenerOpciones = (campo) => {
    // El catálogo usa nombres en plural (facultades, escuelas, etc.)
    const clave = campo === "eje_rsu" ? "ejes_rsu" : `${campo}s`;
    const opciones = filtros?.[clave] ?? filtros?.[campo];

    return Array.isArray(opciones) ? opciones : [];
  };

  const obtenerValor = (campo, opcion) => {
    if (campo === "estado") {
      return opcion?.valor ?? "";
    }

    return opcion?.id ?? "";
  };

  const obtenerTexto = (campo, opcion) => {
    if (campo === "estado") {
      return opcion?.nombre ?? "";
    }

    if (campo === "ods") {
      return opcion?.nombre
        ? `ODS ${opcion.numero}: ${opcion.nombre}`
        : "";
    }

    return opcion?.nombre ?? "";
  };

  // =========================================================
  // DATOS DEL INFORME
  // =========================================================

  const resumen = informe?.resumen || {};
  const presupuesto = informe?.presupuesto || {};
  const metas = informe?.metas || {};
  const distribuciones = informe?.distribuciones || {};

  // Mensaje de error general (sección 6 del contrato: 401/403 casi siempre
  // vienen como { error, detail, errors } desde el backend).
  const mensajeError = (() => {
    if (!error) return null;
    if (typeof error === "string") return error;
    return error?.detail || error?.error || "Ocurrió un error al cargar el informe.";
  })();

  const esAccesoRestringido =
    error?.response?.status === 403 ||
    (typeof mensajeError === "string" &&
      mensajeError.toLowerCase().includes("permission"));

  // =========================================================
  // TARJETA INDICADOR
  // =========================================================

  const Indicador = ({
    icon,
    titulo,
    valor,
    descripcion,
  }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#b1122b]">
          {icon}
        </div>
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {titulo}
      </p>

      <p className="text-xl font-bold text-slate-800 mt-1">
        {valor}
      </p>

      {descripcion && (
        <p className="text-[10px] text-slate-400 mt-1">
          {descripcion}
        </p>
      )}
    </div>
  );

  // =========================================================
  // DISTRIBUCIÓN
  // =========================================================

  const Distribucion = ({ titulo, datos = [] }) => {
    const maximo = Math.max(
      ...(datos.map((item) => Number(item.total) || 0)),
      1
    );

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="text-[#b1122b]" />

          <h4 className="text-xs font-bold text-slate-700">
            {titulo}
          </h4>
        </div>

        {datos.length === 0 ? (
          <p className="text-xs text-slate-400">
            No hay información disponible.
          </p>
        ) : (
          <div className="space-y-3">
            {datos.map((item, index) => {
              const porcentaje =
                ((Number(item.total) || 0) / maximo) * 100;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs text-slate-500 truncate">
                      {item.etiqueta}
                    </span>

                    <span className="text-xs font-bold text-slate-700">
                      {item.total}
                    </span>
                  </div>

                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b1122b] rounded-full"
                      style={{
                        width: `${porcentaje}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Acceso restringido (403): la HU pide una pantalla dedicada, no el
  // dashboard vacío.
  if (esAccesoRestringido) {
    return (
      <Layout>
        <div className="p-6 md:p-8 flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-md">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
              <FiLock className="text-lg" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Acceso restringido</h2>
            <p className="text-sm text-slate-500 mt-2">
              Tu rol no tiene permiso para ver los informes consolidados. Este módulo está disponible solo para Administrador, Jefatura RSU y Departamento.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

        {/* ENCABEZADO */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Informes Consolidados
              </h2>
          
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Informe general de proyectos de Responsabilidad Social
            </p>
          </div>

          <div className="flex gap-2">

            <button
              onClick={exportarExcel}
              disabled={exportando !== null}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              {exportando === "excel" ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiDownload />
              )}
              Excel
            </button>

            <button
              onClick={exportarPDF}
              disabled={exportando !== null}
              className="flex items-center gap-2 px-4 py-2 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21] transition-colors disabled:opacity-50"
            >
              {exportando === "pdf" ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiFileText />
              )}
              PDF
            </button>

          </div>
        </div>

        {/* BANNER DE ERROR GENERAL */}
        {mensajeError && !esAccesoRestringido && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">No se pudo cargar el informe</p>
              <p className="text-xs text-red-600 mt-0.5">{mensajeError}</p>
            </div>
          </div>
        )}

        {/* =====================================================
            INDICADORES
        ====================================================== */}

        {loading ? (

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 mb-6">

            <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />

            Generando informe consolidado...

          </div>

        ) : informe ? (

          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

              <Indicador
                icon={<FiFileText />}
                titulo="Total proyectos"
                valor={resumen.total_proyectos ?? 0}
                descripcion={`${resumen.aprobados ?? 0} aprobados · ${resumen.finalizados ?? 0} finalizados`}
              />

              <Indicador
                icon={<FiUsers />}
                titulo="Docentes responsables"
                valor={resumen.docentes_responsables ?? 0}
                descripcion={`${resumen.total_docentes_declarados ?? 0} docentes declarados`}
              />

              <Indicador
                icon={<FiUsers />}
                titulo="Estudiantes"
                valor={resumen.total_estudiantes_declarados ?? 0}
                descripcion="Estudiantes declarados"
              />

              <Indicador
                icon={<FiActivity />}
                titulo="Avance promedio"
                valor={`${resumen.avance_promedio ?? 0}%`}
                descripcion={`${resumen.actividades_completadas ?? 0} de ${resumen.actividades_total ?? 0} actividades completadas`}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              <Indicador
                icon={<FiDollarSign />}
                titulo="Presupuesto ejecutado"
                valor={`S/ ${(presupuesto.monto_ejecutado ?? 0).toFixed(2)}`}
                descripcion={`${presupuesto.porcentaje_ejecucion_presupuestal ?? 0}% de ejecución`}
              />

              <Indicador
                icon={<FiCheckCircle />}
                titulo="Cumplimiento de metas"
                valor={`${metas.porcentaje_cumplimiento ?? 0}%`}
                descripcion={`${metas.cumplidas ?? 0} de ${metas.total ?? 0} metas cumplidas`}
              />

              <Indicador
                icon={<FiActivity />}
                titulo="Actividades completadas"
                valor={`${resumen.porcentaje_actividades_completadas ?? 0}%`}
                descripcion={`${resumen.actividades_completadas ?? 0} completadas`}
              />

            </div>

            {/* =====================================================
                DISTRIBUCIONES
            ====================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

              <Distribucion
                titulo="Por facultad"
                datos={distribuciones.por_facultad}
              />

              <Distribucion
                titulo="Por escuela"
                datos={distribuciones.por_escuela}
              />

              <Distribucion
                titulo="Por eje RSU"
                datos={distribuciones.por_eje_rsu}
              />

              <Distribucion
                titulo="Por periodo"
                datos={distribuciones.por_periodo}
              />

              <Distribucion
                titulo="Por estado"
                datos={distribuciones.por_estado}
              />

              <Distribucion
                titulo="Por ODS"
                datos={distribuciones.por_ods}
              />

            </div>
          </>

        ) : (

          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-400 mb-6">
            No hay información disponible.
          </div>

        )}

        {/* =====================================================
            PROYECTOS
        ====================================================== */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1">

          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Proyectos consolidados
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Listado de proyectos aprobados y finalizados.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg w-full md:w-72">

              <FiSearch className="text-slate-400" />

              <input
                type="text"
                placeholder="Buscar por título o código..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full text-xs outline-none bg-transparent text-slate-700"
              />

            </div>

          </div>

          {loadingProyectos ? (

            <div className="p-10 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">

              <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />

              Cargando proyectos...

            </div>

          ) : proyectosFiltrados.length === 0 ? (

            <div className="p-10 text-center text-xs text-slate-400">
              No se encontraron proyectos consolidados.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="bg-slate-50 border-b border-slate-100">

                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Código
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Proyecto
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Facultad
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Responsable
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Acción
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {proyectosFiltrados.map((proyecto) => (

                    <tr
                      key={proyecto.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >

                      <td className="px-5 py-4 text-xs font-mono font-bold text-slate-400">
                        {proyecto.codigo}
                      </td>

                      <td className="px-5 py-4">

                        <p className="text-sm font-bold text-slate-800">
                          {proyecto.titulo}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {proyecto.escuela || "Sin escuela"}
                        </p>

                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {proyecto.facultad || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {proyecto.docente_responsable || "—"}
                      </td>

                      <td className="px-5 py-4">

                        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {proyecto.estado_display ||
                            proyecto.estado ||
                            "—"}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            verDetalle(proyecto.id)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b] transition-colors"
                        >
                          <FiEye />
                          Ver ficha
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* =====================================================
            MODAL DETALLE
        ====================================================== */}

        {mostrarDetalle && (

          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">

              <div className="p-5 border-b border-slate-100 flex items-center justify-between">

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Ficha detallada del proyecto
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Información completa del proyecto consolidado.
                  </p>
                </div>

                <button
                  onClick={cerrarDetalle}
                  className="p-2 text-slate-400 hover:text-[#b1122b] transition-colors"
                >
                  <FiX />
                </button>

              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-90px)]">

                {loadingDetalle ? (

                  <div className="py-12 flex flex-col items-center gap-2 text-xs text-slate-400">

                    <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />

                    Cargando ficha del proyecto...

                  </div>

                ) : errorDetalle ? (

                  <div className="py-12 flex flex-col items-center gap-3 text-center">
                    <FiAlertTriangle className="text-2xl text-red-400" />
                    <p className="text-sm font-semibold text-slate-700">{errorDetalle}</p>
                  </div>

                ) : proyectoDetalle ? (

                  <div className="space-y-6">

                    {/* INFORMACIÓN GENERAL */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Información general
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                        {[
                          ["Código", proyectoDetalle.codigo],
                          ["Título", proyectoDetalle.titulo],
                          ["Estado", proyectoDetalle.estado_display],
                          ["Facultad", proyectoDetalle.facultad],
                          ["Escuela", proyectoDetalle.escuela],
                          ["Departamento", proyectoDetalle.departamento],
                          ["Periodo", proyectoDetalle.periodo],
                          ["Eje RSU", proyectoDetalle.eje_rsu],
                          ["Responsable", proyectoDetalle.docente_responsable],
                          ["Docentes", proyectoDetalle.nro_docentes],
                          ["Estudiantes", proyectoDetalle.nro_estudiantes],
                          ["Inicio", proyectoDetalle.fecha_inicio],
                          ["Término", proyectoDetalle.fecha_termino],
                        ].map(([label, value], index) => (

                          <div
                            key={index}
                            className="border border-slate-200 rounded-lg p-3"
                          >

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              {label}
                            </p>

                            <p className="text-sm text-slate-700 mt-1">
                              {value ?? "—"}
                            </p>

                          </div>

                        ))}

                      </div>
                    </div>

                    {/* PRESUPUESTO */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Presupuesto
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                        {[
                          ["Declarado", proyectoDetalle.presupuesto?.monto_declarado],
                          ["Financiado", proyectoDetalle.presupuesto?.monto_financiado],
                          ["Presupuestado", proyectoDetalle.presupuesto?.monto_presupuestado],
                          ["Ejecutado", proyectoDetalle.presupuesto?.monto_ejecutado],
                        ].map(([label, value], index) => (

                          <div
                            key={index}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                          >

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              {label}
                            </p>

                            <p className="text-sm font-bold text-slate-800 mt-1">
                              S/ {(Number(value) || 0).toFixed(2)}
                            </p>

                          </div>

                        ))}

                      </div>
                    </div>

                    {/* DETALLE PRESUPUESTO */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Detalle de presupuesto
                      </h4>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">

                        <table className="w-full">

                          <thead className="bg-slate-50">

                            <tr>

                              {[
                                "Categoría",
                                "Recurso",
                                "Descripción",
                                "Unidad",
                                "Cantidad",
                                "Costo unitario",
                                "Presupuestado",
                                "Ejecutado",
                                "Fuente",
                              ].map((campo) => (

                                <th
                                  key={campo}
                                  className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                                >
                                  {campo}
                                </th>

                              ))}

                            </tr>

                          </thead>

                          <tbody>

                            {(proyectoDetalle.detalle_presupuesto || []).map(
                              (item, index) => (

                                <tr
                                  key={index}
                                  className="border-t border-slate-100"
                                >

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.categoria || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.tipo_recurso || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.descripcion || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.unidad || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.cantidad ?? "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    S/ {(Number(item.costo_unitario) || 0).toFixed(2)}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    S/ {(Number(item.monto_presupuestado) || 0).toFixed(2)}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    S/ {(Number(item.monto_ejecutado) || 0).toFixed(2)}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {item.fuente || "—"}
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>
                    </div>

                    {/* FUENTES */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Fuentes de financiamiento
                      </h4>

                      <div className="space-y-2">

                        {(proyectoDetalle.detalle_fuentes || []).map(
                          (fuente, index) => (

                            <div
                              key={index}
                              className="border border-slate-200 rounded-lg p-3 flex items-center justify-between"
                            >

                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {fuente.fuente || "—"}
                                </p>

                                <p className="text-xs text-slate-400 mt-1">
                                  {fuente.descripcion || "Sin descripción"}
                                </p>
                              </div>

                              <p className="text-sm font-bold text-slate-800">
                                S/ {(Number(fuente.monto) || 0).toFixed(2)}
                              </p>

                            </div>

                          )
                        )}

                      </div>
                    </div>

                    {/* METAS */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Metas e indicadores
                      </h4>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">

                        <table className="w-full">

                          <thead className="bg-slate-50">

                            <tr>

                              {[
                                "Meta",
                                "Indicador",
                                "Unidad",
                                "Línea base",
                                "Valor meta",
                                "Valor alcanzado",
                                "% avance",
                                "Método de verificación",
                                "Fuente de verificación",
                              ].map((campo) => (

                                <th
                                  key={campo}
                                  className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                                >
                                  {campo}
                                </th>

                              ))}

                            </tr>

                          </thead>

                          <tbody>

                            {(proyectoDetalle.detalle_metas || []).map(
                              (meta, index) => (

                                <tr
                                  key={index}
                                  className="border-t border-slate-100"
                                >

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.meta || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.indicador || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.unidad_medida || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.linea_base ?? "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.valor_meta ?? "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.valor_alcanzado ?? "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs font-bold text-slate-700">
                                    {meta.porcentaje_avance ?? 0}%
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.metodo_verificacion || "—"}
                                  </td>

                                  <td className="px-3 py-2 text-xs text-slate-600">
                                    {meta.fuente_verificacion || "—"}
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>
                    </div>

                    {/* AVANCES */}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
                        Avances
                      </h4>

                      <div className="space-y-3">

                        {(proyectoDetalle.detalle_avances || []).map(
                          (avance) => (

                            <div
                              key={avance.id}
                              className="border border-slate-200 rounded-lg p-4"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <div>

                                  <p className="text-sm font-bold text-slate-700">
                                    {avance.actividad || "Sin actividad"}
                                  </p>

                                  <p className="text-xs text-slate-500 mt-1">
                                    {avance.descripcion || "Sin descripción"}
                                  </p>

                                </div>

                                <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {avance.estado_actividad || "—"}
                                </span>

                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">

                                <div>
                                  <p className="text-[9px] text-slate-400">
                                    Revisión
                                  </p>

                                  <p className="text-xs font-semibold text-slate-600">
                                    {avance.estado_revision || "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] text-slate-400">
                                    Autor
                                  </p>

                                  <p className="text-xs font-semibold text-slate-600">
                                    {avance.autor || "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] text-slate-400">
                                    Fecha
                                  </p>

                                  <p className="text-xs font-semibold text-slate-600">
                                    {avance.created_at
                                      ? new Date(
                                          avance.created_at
                                        ).toLocaleDateString("es-PE")
                                      : "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[9px] text-slate-400">
                                    Evidencias
                                  </p>

                                  <p className="text-xs font-semibold text-slate-600">
                                    {Array.isArray(avance.evidencias)
                                      ? avance.evidencias.length
                                      : 0}
                                  </p>
                                </div>

                              </div>

                            </div>

                          )
                        )}

                      </div>
                    </div>

                  </div>

                ) : (

                  <div className="py-10 text-center text-xs text-slate-400">
                    No se encontró información.
                  </div>

                )}

              </div>

            </div>

          </div>

        )}

      </div>
    </Layout>
  );
};

export default InformeConsolidado;