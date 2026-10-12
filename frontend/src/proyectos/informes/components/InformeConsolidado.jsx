import React, { useEffect, useState } from "react";
import Layout from "../../../shared/layout/Layout";
import {
  FiSearch,
  FiFileText,
  FiRefreshCw,
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
  const { informe, proyectos, proyectoDetalle, loading, loadingProyectos, loadingDetalle, error, obtenerInformeConsolidado, obtenerFiltros, obtenerProyectosConsolidados, obtenerDetalleProyecto, descargarPDF, descargarExcel } = useInformes();

  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    facultad: "", eje_rsu: "", ods: "", periodo: "", escuela: "", departamento: "", estado: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [exportando, setExportando] = useState(null); 

  useEffect(() => {
    obtenerFiltros();
    obtenerInformeConsolidado({ incluir_proyectos: false });
    obtenerProyectosConsolidados();
  }, [obtenerFiltros, obtenerInformeConsolidado, obtenerProyectosConsolidados]);

  const verDetalle = async (id) => {
    try {
      setErrorDetalle(null);
      setMostrarDetalle(true);
      await obtenerDetalleProyecto(id);
    } catch (err) {
      if (err?.response?.status === 404) setErrorDetalle("El proyecto no está disponible en el informe.");
      else setErrorDetalle("No se pudo cargar la ficha del proyecto.");
    }
  };

  const cerrarDetalle = () => {
    setMostrarDetalle(false);
    setErrorDetalle(null);
  };

  const exportarPDF = async () => {
    try { setExportando("pdf"); await descargarPDF(filtrosSeleccionados); } catch (err) { console.error(err); } finally { setExportando(null); }
  };

  const exportarExcel = async () => {
    try { setExportando("excel"); await descargarExcel(filtrosSeleccionados); } catch (err) { console.error(err); } finally { setExportando(null); }
  };

  const proyectosData = Array.isArray(proyectos) ? proyectos : proyectos?.results || [];
  const proyectosFiltrados = proyectosData.filter((proyecto) => {
    const texto = searchTerm.toLowerCase();
    return String(proyecto?.titulo || "").toLowerCase().includes(texto) || String(proyecto?.codigo || "").toLowerCase().includes(texto) || String(proyecto?.docente_responsable || "").toLowerCase().includes(texto);
  });

  const resumen = informe?.resumen || {};
  const presupuesto = informe?.presupuesto || {};
  const metas = informe?.metas || {};
  const distribuciones = informe?.distribuciones || {};

  const mensajeError = (() => {
    if (!error) return null;
    if (typeof error === "string") return error;
    return error?.detail || error?.error || "Ocurrió un error al cargar el informe.";
  })();

  const esAccesoRestringido = error?.response?.status === 403 || (typeof mensajeError === "string" && mensajeError.toLowerCase().includes("permission"));

  const Indicador = ({ icon, titulo, valor, descripcion }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#b1122b]">
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{titulo}</p>
      <p className="text-xl font-bold text-slate-800 mt-1">{valor}</p>
      {descripcion && <p className="text-[10px] text-slate-400 mt-auto pt-2">{descripcion}</p>}
    </div>
  );

  const Distribucion = ({ titulo, datos = [] }) => {
    const maximo = Math.max(...(datos.map((item) => Number(item.total) || 0)), 1);
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="text-[#b1122b]" />
          <h4 className="text-xs font-bold text-slate-700">{titulo}</h4>
        </div>
        {datos.length === 0 ? (
          <p className="text-xs text-slate-400">No hay información disponible.</p>
        ) : (
          <div className="space-y-3 flex-1">
            {datos.map((item, index) => {
              const porcentaje = ((Number(item.total) || 0) / maximo) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs text-slate-500 truncate" title={item.etiqueta}>{item.etiqueta}</span>
                    <span className="text-xs font-bold text-slate-700">{item.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#b1122b] rounded-full" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (esAccesoRestringido) {
    return (
      <Layout>
        <div className="p-4 md:p-8 flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-10 text-center max-w-md mx-4">
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
      <div className="p-4 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)] w-full overflow-x-hidden">

        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Informes Consolidados</h2>
            <p className="text-sm text-slate-500 mt-1">Informe general de proyectos de Responsabilidad Social</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={exportarExcel} disabled={exportando !== null} className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50 flex">
              {exportando === "excel" ? <FiRefreshCw className="animate-spin" /> : <FiDownload />} Excel
            </button>
            <button onClick={exportarPDF} disabled={exportando !== null} className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-2 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21] transition-colors disabled:opacity-50 flex">
              {exportando === "pdf" ? <FiRefreshCw className="animate-spin" /> : <FiFileText />} PDF
            </button>
          </div>
        </div>

        {mensajeError && !esAccesoRestringido && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">No se pudo cargar el informe</p>
              <p className="text-xs text-red-600 mt-0.5">{mensajeError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 mb-6">
            <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" /> Generando informe consolidado...
          </div>
        ) : informe ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Indicador icon={<FiFileText />} titulo="Total proyectos" valor={resumen.total_proyectos ?? 0} descripcion={`${resumen.aprobados ?? 0} aprobados · ${resumen.finalizados ?? 0} finalizados`} />
              <Indicador icon={<FiUsers />} titulo="Docentes responsables" valor={resumen.docentes_responsables ?? 0} descripcion={`${resumen.total_docentes_declarados ?? 0} docentes declarados`} />
              <Indicador icon={<FiActivity />} titulo="Avance promedio" valor={`${resumen.avance_promedio ?? 0}%`} descripcion={`${resumen.actividades_completadas ?? 0} de ${resumen.actividades_total ?? 0} actividades completadas`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Indicador icon={<FiDollarSign />} titulo="Presupuesto ejecutado" valor={`S/ ${(presupuesto.monto_ejecutado ?? 0).toFixed(2)}`} descripcion={`${presupuesto.porcentaje_ejecucion_presupuestal ?? 0}% de ejecución`} />
              <Indicador icon={<FiCheckCircle />} titulo="Cumplimiento de metas" valor={`${metas.porcentaje_cumplimiento ?? 0}%`} descripcion={`${metas.cumplidas ?? 0} de ${metas.total ?? 0} metas cumplidas`} />
              <Indicador icon={<FiActivity />} titulo="Actividades completadas" valor={`${resumen.porcentaje_actividades_completadas ?? 0}%`} descripcion={`${resumen.actividades_completadas ?? 0} completadas`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Distribucion titulo="Por facultad" datos={distribuciones.por_facultad} />
              <Distribucion titulo="Por escuela" datos={distribuciones.por_escuela} />
              <Distribucion titulo="Por eje RSU" datos={distribuciones.por_eje_rsu} />
              <Distribucion titulo="Por periodo" datos={distribuciones.por_periodo} />
              <Distribucion titulo="Por estado" datos={distribuciones.por_estado} />
              <Distribucion titulo="Por ODS" datos={distribuciones.por_ods} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-400 mb-6">
            No hay información disponible.
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 mb-6">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Proyectos consolidados</h3>
              <p className="text-xs text-slate-400 mt-1">Listado de proyectos aprobados y finalizados.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg w-full md:w-72">
              <FiSearch className="text-slate-400 shrink-0" />
              <input type="text" placeholder="Buscar por título o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full text-xs outline-none bg-transparent text-slate-700" />
            </div>
          </div>

          {loadingProyectos ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" /> Cargando proyectos...
            </div>
          ) : proyectosFiltrados.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No se encontraron proyectos consolidados.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Código</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Proyecto</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Facultad</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Responsable</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estado</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectosFiltrados.map((proyecto) => (
                    <tr key={proyecto.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono font-bold text-slate-400">{proyecto.codigo}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{proyecto.titulo}</p>
                        <p className="text-xs text-slate-400 mt-1">{proyecto.escuela || "Sin escuela"}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{proyecto.facultad || "—"}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{proyecto.docente_responsable || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{proyecto.estado_display || proyecto.estado || "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => verDetalle(proyecto.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b] transition-colors whitespace-nowrap"><FiEye /> Ver ficha</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {mostrarDetalle && (
          <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-2 md:p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ficha detallada del proyecto</h3>
                  <p className="text-xs text-slate-400 mt-1">Información completa del proyecto consolidado.</p>
                </div>
                <button onClick={cerrarDetalle} className="p-2 text-slate-400 hover:text-[#b1122b] transition-colors"><FiX className="text-xl" /></button>
              </div>
              
              <div className="p-4 md:p-5 overflow-y-auto flex-1">
                {loadingDetalle ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-xs text-slate-400"><FiRefreshCw className="animate-spin text-lg text-[#b1122b]" /> Cargando ficha...</div>
                ) : errorDetalle ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-center"><FiAlertTriangle className="text-2xl text-red-400" /><p className="text-sm font-semibold text-slate-700">{errorDetalle}</p></div>
                ) : proyectoDetalle ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Información general</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[["Código", proyectoDetalle.codigo], ["Título", proyectoDetalle.titulo], ["Estado", proyectoDetalle.estado_display], ["Facultad", proyectoDetalle.facultad], ["Escuela", proyectoDetalle.escuela], ["Departamento", proyectoDetalle.departamento], ["Periodo", proyectoDetalle.periodo], ["Eje RSU", proyectoDetalle.eje_rsu], ["Responsable", proyectoDetalle.docente_responsable], ["Docentes", proyectoDetalle.nro_docentes], ["Estudiantes", proyectoDetalle.nro_estudiantes], ["Inicio", proyectoDetalle.fecha_inicio], ["Término", proyectoDetalle.fecha_termino]].map(([label, value], index) => (
                          <div key={index} className="border border-slate-200 rounded-lg p-3 break-words">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                            <p className="text-sm text-slate-700 mt-1">{value ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Presupuesto</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {[["Declarado", proyectoDetalle.presupuesto?.monto_declarado], ["Financiado", proyectoDetalle.presupuesto?.monto_financiado], ["Presupuestado", proyectoDetalle.presupuesto?.monto_presupuestado], ["Ejecutado", proyectoDetalle.presupuesto?.monto_ejecutado]].map(([label, value], index) => (
                          <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-bold text-slate-800 mt-1">S/ {(Number(value) || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Detalle de presupuesto</h4>
                      <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
                        <table className="w-full min-w-[750px]">
                          <thead className="bg-slate-50">
                            <tr>{["Categoría", "Recurso", "Descripción", "Unidad", "Cantidad", "Costo unitario", "Presupuestado", "Ejecutado", "Fuente"].map((campo) => (<th key={campo} className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{campo}</th>))}</tr>
                          </thead>
                          <tbody>
                            {(proyectoDetalle.detalle_presupuesto || []).map((item, index) => (
                              <tr key={index} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-xs text-slate-600">{item.categoria || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{item.tipo_recurso || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{item.descripcion || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{item.unidad || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{item.cantidad ?? "—"}</td><td className="px-3 py-2 text-xs text-slate-600">S/ {(Number(item.costo_unitario) || 0).toFixed(2)}</td><td className="px-3 py-2 text-xs text-slate-600">S/ {(Number(item.monto_presupuestado) || 0).toFixed(2)}</td><td className="px-3 py-2 text-xs text-slate-600">S/ {(Number(item.monto_ejecutado) || 0).toFixed(2)}</td><td className="px-3 py-2 text-xs text-slate-600">{item.fuente || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">Metas e indicadores</h4>
                      <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
                        <table className="w-full min-w-[700px]">
                          <thead className="bg-slate-50">
                            <tr>{["Meta", "Indicador", "Unidad", "Línea base", "Valor meta", "Valor alcanzado", "% avance", "Método de verificación", "Fuente de verificación"].map((campo) => (<th key={campo} className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{campo}</th>))}</tr>
                          </thead>
                          <tbody>
                            {(proyectoDetalle.detalle_metas || []).map((meta, index) => (
                              <tr key={index} className="border-t border-slate-100">
                                <td className="px-3 py-2 text-xs text-slate-600">{meta.meta || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.indicador || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.unidad_medida || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.linea_base ?? "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.valor_meta ?? "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.valor_alcanzado ?? "—"}</td><td className="px-3 py-2 text-xs font-bold text-slate-700">{meta.porcentaje_avance ?? 0}%</td><td className="px-3 py-2 text-xs text-slate-600">{meta.metodo_verificacion || "—"}</td><td className="px-3 py-2 text-xs text-slate-600">{meta.fuente_verificacion || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400">No se encontró información.</div>
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