import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { 
  FiCheckCircle, FiXCircle, FiInbox, FiTarget, 
  FiCalendar, FiDollarSign, FiInfo, FiFileText 
} from "react-icons/fi";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function RevisionProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Estados del Modal de Evaluación y Detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [comentario, setComentario] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'aprobar' or 'observar'

  // Pestañas dentro del modal para que el departamento revise todo
  const [activeTab, setActiveTab] = useState("metas"); 
  const [metas, setMetas] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [presupuesto, setPresupuesto] = useState(null);
  const [loadingSubRecursos, setLoadingSubRecursos] = useState(false);

  useEffect(() => {
    fetchProyectos();
  }, []);

  const mostrarAlerta = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
  };

  // 1. CARGA DE PROYECTOS PARA REVISAR (Consumo general + Filtro exhaustivo)
  const fetchProyectos = async () => {
    try {
      setLoading(true);
      
      // Consultamos el listado general para evitar bloqueos por departamento del backend
      const res = await api.get("/api/v1/proyectos/");
      const todosLosProyectos = res.data?.results || res.data || [];
      
      // Filtramos en el cliente abarcando todas las variantes posibles del estado
      const pendientesDeRevision = todosLosProyectos.filter(proyecto => {
        const estadoLimpio = proyecto.estado?.toLowerCase().trim() || "";
        return (
          estadoLimpio === "en_revision" || 
          estadoLimpio === "en revision" || 
          estadoLimpio === "en revisión" ||
          estadoLimpio.includes("revis")
        );
      });

      setProyectos(pendientesDeRevision);
    } catch (error) {
      console.error("Error fetching revisiones:", error);
      mostrarAlerta("error", "No se pudo conectar con el servidor de proyectos.");
    } finally {
      setLoading(false);
    }
  };

  // 2. ABRIR DICTAMEN Y CARGAR SUS SUB-RECURSOS REALES EN PARALELO
  const openModalRevision = async (proyecto, action) => {
    setSelectedProyecto(proyecto);
    setActionType(action);
    setComentario("");
    setActiveTab("metas");
    setModalOpen(true);
    
    try {
      setLoadingSubRecursos(true);
      // Peticiones usando {proyecto_pk} estructurado en tu API
      const [resMetas, resCronograma, resPresupuesto] = await Promise.all([
        api.get(`/api/v1/proyectos/${proyecto.id}/metas-indicadores/`),
        api.get(`/api/v1/proyectos/${proyecto.id}/cronograma/`),
        api.get(`/api/v1/proyectos/${proyecto.id}/presupuesto/resumen/`).catch(() => ({ data: null }))
      ]);

      setMetas(resMetas.data?.results || resMetas.data || []);
      setCronograma(resCronograma.data?.results || resCronograma.data || []);
      setPresupuesto(resPresupuesto.data);
    } catch (error) {
      console.error("Error cargando detalles del expediente:", error);
    } finally {
      setLoadingSubRecursos(false);
    }
  };

  // 3. ENVIAR DICTAMEN (APROBAR / OBSERVACIÓN)
  const handleEvaluate = async () => {
    if (actionType === "observar" && !comentario.trim()) {
      mostrarAlerta("error", "El comentario técnico es obligatorio para poder observar el proyecto.");
      return;
    }

    try {
      setEvaluating(true);
      const endpoint = `/api/v1/proyectos/${selectedProyecto.id}/${actionType}/`;
      
      const payload = {};
      if (actionType === "observar") {
        payload.comentario_tecnico = comentario;
      }

      await api.post(endpoint, payload);
      
      mostrarAlerta("success", `El proyecto ha sido ${actionType === 'aprobar' ? 'Aprobado' : 'Observado'} con éxito.`);
      setModalOpen(false);
      fetchProyectos();
    } catch (error) {
      console.error("Error al evaluar:", error);
      const msg = error.response?.data?.comentario_tecnico?.[0] || 
                  error.response?.data?.detail || 
                  "Error al procesar el dictamen en el servidor.";
      mostrarAlerta("error", msg);
    } finally {
      setEvaluating(false);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    try {
      return format(parseISO(fechaString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch { return "-"; }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[230px]">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel de Departamento: Revisión RSU</h1>
            <p className="text-xs text-slate-500 mt-0.5">Evalúa, fiscaliza los sub-recursos y emite dictámenes para los planes de trabajo enviados.</p>
          </div>

          {statusMsg.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm shadow-sm transition-all ${
              statusMsg.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {statusMsg.type === "success" ? <FiCheckCircle className="text-lg" /> : <FiXCircle className="text-lg" />}
              <span className="font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* TABLA PRINCIPAL DE PROYECTOS PARA REVISAR */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <div className="w-6 h-6 border-2 border-[#b1122b] border-t-transparent rounded-full animate-spin"></div>
                Buscando proyectos enviados por los docentes...
              </div>
            ) : proyectos.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-lg">
                  <FiInbox />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700 m-0">No tienes proyectos pendientes de revisión</p>
                  <p className="text-xs text-slate-400 mt-1">Buen trabajo. Todos los planes enviados ya fueron evaluados o filtrados.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6 font-bold">Código / Proyecto</th>
                    <th className="py-4 px-6 font-bold">Docente Coordinador</th>
                    <th className="py-4 px-6 font-bold">Fecha de Envío</th>
                    <th className="py-4 px-6 font-bold text-center">Evaluar Expediente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {proyectos.map((proyecto) => (
                    <tr key={proyecto.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 max-w-sm">
                        <div className="font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-max mb-1">
                          {proyecto.codigo || 'PENDIENTE ASIGNAR'}
                        </div>
                        <div className="text-slate-800 font-semibold line-clamp-1">{proyecto.titulo}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {proyecto.docente_responsable_nombre || proyecto.docente_responsable || "Docente Responsable"}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {proyecto.fecha_envio_revision ? formatearFecha(proyecto.fecha_envio_revision) : "Reciente"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-lg transition-colors flex items-center gap-1"
                            onClick={() => openModalRevision(proyecto, 'aprobar')}
                          >
                            <FiCheckCircle /> Aprobar
                          </button>
                          <button 
                            className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors flex items-center gap-1"
                            onClick={() => openModalRevision(proyecto, 'observar')}
                          >
                            <FiXCircle /> Observar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* MODAL DETALLADO DE DICTAMEN TÉCNICO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-150">
            
            {/* Cabecera del Modal */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {actionType === 'aprobar' ? (
                  <><FiCheckCircle className="text-emerald-600" /> Aprobar Plan de Trabajo</>
                ) : (
                  <><FiXCircle className="text-[#b1122b]" /> Registrar Observaciones Técnicas</>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Evaluando: <span className="text-slate-800 font-semibold">{selectedProyecto?.titulo}</span>
              </p>
            </div>

            {/* PESTAÑAS DE INSPECCIÓN DE SUB-RECURSOS */}
            <div className="flex border-b border-slate-200 gap-2 mb-4">
              <button 
                onClick={() => setActiveTab("metas")}
                className={`pb-2 px-2 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'metas' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FiTarget /> Metas e Indicadores
              </button>
              <button 
                onClick={() => setActiveTab("cronograma")}
                className={`pb-2 px-2 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'cronograma' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FiCalendar /> Cronograma
              </button>
              <button 
                onClick={() => setActiveTab("presupuesto")}
                className={`pb-2 px-2 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'presupuesto' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FiDollarSign /> Presupuesto
              </button>
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[180px] mb-4 text-xs">
              {loadingSubRecursos ? (
                <div className="text-center py-8 text-slate-400 font-medium animate-pulse">Cargando sub-recursos asignados en Django...</div>
              ) : (
                <>
                  {activeTab === "metas" && (
                    <div className="space-y-3">
                      {metas.length === 0 ? <p className="text-slate-400 italic">No ha registrado metas en este indicador.</p> : 
                        metas.map(m => (
                          <div key={m.id} className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-700">{m.meta_descripcion || "Meta parametrizada"}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Indicador: <span className="text-slate-600 font-medium">{m.indicador_nombre}</span> • Meta: {m.valor_meta} {m.unidad_medida}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {activeTab === "cronograma" && (
                    <div className="space-y-2">
                      {cronograma.length === 0 ? <p className="text-slate-400 italic">No existen actividades mapeadas en el cronograma.</p> : 
                        cronograma.map(c => (
                          <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-700">{c.nombre || c.descripcion || "Acción sin título"}</p>
                              <p className="text-[10px] text-slate-400">Plazo: {c.fecha_inicio || "S/F"} al {c.fecha_fin || "S/F"}</p>
                            </div>
                            <span className="px-2 py-0.5 font-mono text-[10px] bg-slate-100 rounded text-slate-500 font-bold">{c.estado_avance || "Pendiente"}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {activeTab === "presupuesto" && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-700 flex items-center gap-1 text-xs"><FiFileText className="text-slate-400"/> Resumen Financiero del Proyecto</h4>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Monto Solicitado RSU</span>
                          <p className="text-base font-bold text-slate-800 mt-0.5">S/. {presupuesto?.total_rsu || selectedProyecto?.monto_financiamiento || "0.00"}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Fuente</span>
                          <p className="text-base font-bold text-slate-800 mt-0.5">{selectedProyecto?.fuente_financiamiento || "Recursos RSU"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SECCIÓN DE DICTAMEN FINAL (ACCIONES) */}
            {actionType === 'observar' ? (
              <div className="mb-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Comentario Técnico Obligatorio <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] resize-none transition-colors"
                  rows="3"
                  placeholder="Especifica claramente qué metas o presupuestos están mal formulados para que el docente pueda corregirlos..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>
            ) : (
              <div className="mb-4 bg-emerald-50 text-emerald-800 p-3.5 rounded-lg border border-emerald-100 flex gap-2.5 text-xs">
                <FiInfo className="text-base shrink-0 mt-0.5 text-emerald-600" />
                <p className="leading-relaxed">
                  ¿Confirmas que el presupuesto, metas y actividades cumplen con las normativas vigentes de RSU? Al dar el visto bueno, el docente quedará habilitado para iniciar la ejecución física del plan de trabajo.
                </p>
              </div>
            )}

            {/* Botones de acción inferiores */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setModalOpen(false)}
                disabled={evaluating}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${
                  actionType === 'aprobar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#b1122b] hover:bg-[#8e0e22]'
                }`}
                onClick={handleEvaluate}
                disabled={evaluating}
              >
                {evaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  actionType === 'aprobar' ? 'Confirmar Aprobación' : 'Enviar Observación'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}