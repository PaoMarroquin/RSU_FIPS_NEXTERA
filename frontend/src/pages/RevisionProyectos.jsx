import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { 
  FiCheckCircle, FiXCircle, FiInbox, FiTarget, 
  FiCalendar, FiDollarSign, FiFileText, FiEye, FiX, FiAlertCircle,
  FiMapPin, FiTrendingUp
} from "react-icons/fi";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "../context/ToastContext";
import ReporteExpediente from "../components/reports/ReporteExpediente";

export default function RevisionProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Estados del Modal de Evaluación y Detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null); 
  
  // Diccionario dinámico exhaustivo para mapear observaciones por cada campo
  const [observacionesCampos, setObservacionesCampos] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'aprobar' or 'observar'

  // Pestañas organizadas para albergar todos los campos
  const [activeTab, setActiveTab] = useState("general"); 
  const [metas, setMetas] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [presupuestoCompleto, setPresupuestoCompleto] = useState([]);
  const [loadingSubRecursos, setLoadingSubRecursos] = useState(false);

  // Estados del Modal de Visualización
  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/proyectos/");
      const todosLosProyectos = res.data?.results || res.data || [];
      
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
      showToast("error", "No se pudo conectar con el servidor de proyectos.");
    } finally {
      setLoading(false);
    }
  };

  const openModalVisualizacion = async (proyecto) => {
    setProyectoDetalle(null);
    setModalVistaOpen(true);
    try {
      setLoadingDetalle(true);
      const res = await api.get(`/api/v1/proyectos/${proyecto.id}/`);
      setProyectoDetalle(res.data);
    } catch (error) {
      console.error("Error cargando detalle del proyecto:", error);
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
      titulo: "",
      codigo: "",
      linea_investigacion: "",
      ods_vinculados: "",
      resumen: "",
      justificacion: "",
      planteamiento_problema: "",
      objetivo_general: "",
      objetivos_especificos: "",
      localizacion: "",
      distrito_provincia: "",
      beneficiarios_directos: "",
      beneficiarios_indirectos: "",
      docentes_participantes: "",
      estudiantes_participantes: "",
      entities_aliadas: "",
      metas_globales: "",
      cronograma_global: "",
      monto_financiamiento: "",
      partidas_bienes: "",
      partidas_servicios: "",
      observacion_general: ""
    });
    
    try {
      const [resProyectoFull, resMetas, resCronograma, resPresupuesto] = await Promise.all([
        api.get(`/api/v1/proyectos/${proyecto.id}/`),
        api.get(`/api/v1/proyectos/${proyecto.id}/metas-indicadores/`),
        api.get(`/api/v1/proyectos/${proyecto.id}/cronograma/`),
        api.get(`/api/v1/proyectos/${proyecto.id}/presupuesto/partidas/`).catch(() => ({ data: [] }))
      ]);

      setSelectedProyecto(resProyectoFull.data);
      setMetas(resMetas.data?.results || resMetas.data || []);
      setCronograma(resCronograma.data?.results || resCronograma.data || []);
      setPresupuestoCompleto(resPresupuesto.data?.results || resPresupuesto.data || []);
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
      const endpoint = `/api/v1/proyectos/${selectedProyecto.id}/${actionType}/`;
      const payload = {};

      if (actionType === "aprobar") {
        payload.comentario = "El proyecto cumple con los requisitos normativos.";
      } else if (actionType === "observar") {
        let textoEstructurado = "";

        if (observacionesCampos.observacion_general?.trim()) {
          textoEstructurado += `RESUMEN GENERAL:\n${observacionesCampos.observacion_general.trim()}\n\n`;
        }

        textoEstructurado += "DETALLE DE OBSERVACIONES POR CAMPO:\n";
        
        Object.entries(camposConObservacion).forEach(([campo, textoObs]) => {
          const nombreFormateado = campo.replace("_", " ").toUpperCase();
          textoEstructurado += `- En [${nombreFormateado}]: ${textoObs}\n`;
        });

        payload.comentario_tecnico = textoEstructurado;
      }

      await api.post(endpoint, payload);
      
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

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    try { return format(parseISO(fechaString), "dd/MM/yyyy HH:mm", { locale: es }); } catch { return "-"; }
  };

  // Renderizador estructural optimizado en dos columnas (Izquierda: Original, Derecha: Caja de Observación)
  const renderFilaDeEvaluacion = (tituloCampo, valorOriginal, campoKey, placeholder = "Describa la observación...") => {
    const esObservar = actionType === "observar";

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {/* Encabezado del Bloque */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{tituloCampo}</span>
          {esObservar && observacionesCampos[campoKey]?.trim() && (
            <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5">
              <FiAlertCircle /> Con Observación
            </span>
          )}
        </div>

        {/* Cuerpo Dinámico: 2 Columnas si es observación, 1 Columna si es aprobación */}
        <div className={`p-3 grid ${esObservar ? "grid-cols-1 md:grid-cols-2 gap-4" : "grid-cols-1"}`}>
          {/* Columna Izquierda: Datos del Docente */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 block">Datos enviados por el docente:</span>
            <div className="text-slate-800 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-medium whitespace-pre-line leading-relaxed text-xs">
              {valorOriginal || <span className="text-slate-400 italic font-normal">No registrado por el autor</span>}
            </div>
          </div>

          {/* Columna Derecha: Entrada para la Observación (Solo si se va a observar) */}
          {esObservar && (
            <div className="flex flex-col justify-between bg-red-50/30 p-2.5 rounded-lg border border-red-100/70">
              <label className="text-[10px] uppercase tracking-wider font-bold text-red-700 flex items-center gap-1 mb-1.5">
                <FiAlertCircle /> Redactar observación específica
              </label>
              <textarea
                className="w-full flex-1 text-xs px-2.5 py-1.5 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] bg-white text-slate-700 resize-none min-h-[60px]"
                rows="3"
                placeholder={placeholder}
                value={observacionesCampos[campoKey] || ""}
                onChange={(e) => handleInputChange(campoKey, e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[230px]">
        <Topbar />
        
        <main className="p-8 max-w-5xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Panel de Departamento: Revisión Integral RSU</h1>
            <p className="text-xs text-slate-500 mt-0.5">Módulo de fiscalización granular para todos los campos declarados del plan de trabajo.</p>
          </div>

          {/* TABLA PRINCIPAL DE ENTRADA */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <div className="w-6 h-6 border-2 border-[#b1122b] border-t-transparent rounded-full animate-spin"></div>
                Cargando bandeja de revisión...
              </div>
            ) : proyectos.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-lg"><FiInbox /></div>
                <p className="font-bold text-sm text-slate-700 m-0">No hay proyectos pendientes de revisión</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6 font-bold">Proyecto</th>
                    <th className="py-4 px-6 font-bold">Coordinador</th>
                    <th className="py-4 px-6 font-bold">Fecha Envío</th>
                    <th className="py-4 px-6 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {proyectos.map((proyecto) => (
                    <tr key={proyecto.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 max-w-sm">
                        <div className="font-mono font-bold text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-max mb-1">{proyecto.codigo || 'S/C'}</div>
                        <div className="text-slate-800 font-semibold line-clamp-1">{proyecto.titulo}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{proyecto.docente_responsable_nombre || "Docente"}</td>
                      <td className="py-4 px-6 text-slate-500">{formatearFecha(proyecto.fecha_envio_revision)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button className="px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-lg flex items-center gap-1" onClick={() => openModalVisualizacion(proyecto)}><FiEye /> Ver</button>
                          <button className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg flex items-center gap-1" onClick={() => openModalRevision(proyecto, 'aprobar')}><FiCheckCircle /> Aprobar</button>
                          <button className="px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg flex items-center gap-1" onClick={() => openModalRevision(proyecto, 'observar')}><FiXCircle /> Observar</button>
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

      {/* MODAL DE VISUALIZACIÓN COMPLETA */}
      {modalVistaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><FiEye /> Informe Completo del Expediente</h2>
              <button onClick={() => setModalVistaOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><FiX /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetalle ? <div className="text-center py-10 animate-pulse">Cargando expediente...</div> : <ReporteExpediente matrizSeleccionada={proyectoDetalle} showPrintButton={false} />}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DICTAMEN INTEGRAL CON VISTA PARALELA (ORIGINAL VS OBSERVACIÓN) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl p-6 shadow-2xl border border-slate-100 h-[92vh] flex flex-col transform transition-all">
            
            <div className="mb-3 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {actionType === 'aprobar' ? <><FiCheckCircle className="text-emerald-600" /> Aprobar Plan de Trabajo</> : <><FiXCircle className="text-[#b1122b]" /> Formulario de Observaciones por Campo</>}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Analice los datos declarados a la izquierda y, si es necesario, redacte la objeción específica en la derecha.</p>
            </div>

            {/* CONTROLADORES DE PESTAÑAS */}
            <div className="flex border-b border-slate-200 gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
              <button onClick={() => setActiveTab("general")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'general' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiFileText /> 1. Identificación</button>
              <button onClick={() => setActiveTab("estructura")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'estructura' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiTrendingUp /> 2. Cuerpo y Objetivos</button>
              <button onClick={() => setActiveTab("poblacion")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'poblacion' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiMapPin /> 3. Ubicación y Actores</button>
              <button onClick={() => setActiveTab("metas")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'metas' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiTarget /> 4. Indicadores</button>
              <button onClick={() => setActiveTab("cronograma")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'cronograma' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiCalendar /> 5. Hitos</button>
              <button onClick={() => setActiveTab("presupuesto")} className={`pb-2 px-2 font-bold text-xs flex items-center gap-1 border-b-2 whitespace-nowrap ${activeTab === 'presupuesto' ? 'border-[#b1122b] text-[#b1122b]' : 'border-transparent text-slate-400'}`}><FiDollarSign /> 6. Finanzas</button>
            </div>

            {/* CONTENIDO INTERACTIVO DE DOBLE COLUMNA */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 space-y-4">
              {loadingSubRecursos || !selectedProyecto ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-slate-400 font-medium">
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Sincronizando expediente completo desde la Base de Datos...
                </div>
              ) : (
                <>
                  {/* PESTAÑA 1: IDENTIFICACIÓN Y DATOS GENERALES */}
                  {activeTab === "general" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion("Título Oficial del Proyecto", selectedProyecto.titulo, "titulo", "Ej: El título es confuso o no refleja las actividades de RSU...")}
                      {renderFilaDeEvaluacion("Código Interno", selectedProyecto.codigo, "codigo", "Ej: El formato del código no corresponde con el periodo actual...")}
                      {renderFilaDeEvaluacion("Línea de Investigación Universitaria", selectedProyecto.linea_investigacion, "linea_investigacion", "Ej: La línea de investigación seleccionada no guarda coherencia con el problema...")}
                      {renderFilaDeEvaluacion("Objetivos de Desarrollo Sostenible (ODS)", selectedProyecto.ods_vinculados, "ods_vinculados", "Ej: No se justifica la vinculación directa con la ODS marcada...")}
                    </div>
                  )}

                  {/* PESTAÑA 2: CUERPO, JUSTIFICACIÓN Y OBJETIVOS */}
                  {activeTab === "estructura" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion("Resumen Ejecutivo", selectedProyecto.resumen, "resumen", "Ej: El resumen carece de la metodología y duración estimada...")}
                      {renderFilaDeEvaluacion("Planteamiento del Problema Social", selectedProyecto.planteamiento_problema, "planteamiento_problema", "Ej: No se adjuntan estadísticas ni diagnóstico real de la problemática...")}
                      {renderFilaDeEvaluacion("Justificación del Impacto", selectedProyecto.justificacion, "justificacion", "Ej: Explicar mejor cómo se sostendrá el impacto después del término del proyecto...")}
                      {renderFilaDeEvaluacion("Objetivo General", selectedProyecto.objetivo_general, "objetivo_general", "Ej: El objetivo no está redactado con un verbo en infinitivo medible...")}
                      {renderFilaDeEvaluacion("Objetivos Específicos", selectedProyecto.objetivos_especificos, "objetivos_especificos", "Ej: Los objetivos específicos no cubren los pasos necesarios para el general...")}
                    </div>
                  )}

                  {/* PESTAÑA 3: UBICACIÓN, ACTORES Y EQUIPO */}
                  {activeTab === "poblacion" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion(
                        "Ámbito Geográfico (Localización y Distrito)", 
                        `Ubicación: ${selectedProyecto.localizacion || "-"} \nDistrito/Provincia: ${selectedProyecto.distrito_provincia || "-"}`, 
                        "localizacion", 
                        "Ej: La zona de intervención está fuera de la cobertura autorizada..."
                      )}
                      {renderFilaDeEvaluacion(
                        "Población Beneficiaria Estimada", 
                        `Directos: ${selectedProyecto.beneficiarios_directos || "0"} personas \nIndirectos: ${selectedProyecto.beneficiarios_indirectos || "0"} personas`, 
                        "beneficiarios_directos", 
                        "Ej: El número de beneficiarios directos no se condice con los talleres propuestos..."
                      )}
                      {renderFilaDeEvaluacion("Plana Docente / Comité Técnico", selectedProyecto.docentes_participantes, "docentes_participantes", "Ej: Las horas asignadas a los docentes exceden el máximo por reglamento...")}
                      {renderFilaDeEvaluacion("Estudiantes Vinculados", selectedProyecto.estudiantes_participantes, "estudiantes_participantes", "Ej: Falta anexar los códigos de matrícula o las facultades de los alumnos...")}
                      {renderFilaDeEvaluacion("Cooperación y Alianzas (Entidades Aliadas)", selectedProyecto.entidades_aliadas, "entidades_aliadas", "Ej: Se requiere adjuntar la carta de compromiso o convenio con la institución...")}
                    </div>
                  )}

                  {/* PESTAÑA 4: METAS E INDICADORES DE LOGRO */}
                  {activeTab === "metas" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion(
                        "Metas e Indicadores de Logro Declarados", 
                        metas.length === 0 ? "Sin registros cargados." : metas.map(m => `• ${m.meta_descripcion}\n  Indicador: ${m.indicador_nombre} [Meta: ${m.valor_meta} ${m.unidad_medida}]`).join("\n\n"), 
                        "metas_globales", 
                        "Ej: Las metas planteadas son insuficientes para medir el impacto de los objetivos..."
                      )}
                    </div>
                  )}

                  {/* PESTAÑA 5: CRONOGRAMA DE HITOS */}
                  {activeTab === "cronograma" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion(
                        "Cronograma de Actividades", 
                        cronograma.length === 0 ? "Cronograma vacío." : cronograma.map(c => `• Actividad: ${c.nombre || c.descripcion}\n  Plazo: ${c.fecha_inicio} al ${c.fecha_fin}`).join("\n\n"), 
                        "cronograma_global", 
                        "Ej: El orden de los hitos es inconsistente o se cruza con periodos vacacionales..."
                      )}
                    </div>
                  )}

                  {/* PESTAÑA 6: PRESUPUESTO COMPLETO ANALÍTICO */}
                  {activeTab === "presupuesto" && (
                    <div className="space-y-4">
                      {renderFilaDeEvaluacion(
                        "Montos Totales y Financiamiento", 
                        `Monto Solicitado: S/. ${selectedProyecto.monto_financiamiento || "0.00"}\nFuente: ${selectedProyecto.fuente_financiamiento || "Recursos RSU Ordinarios"}`, 
                        "monto_financiamiento", 
                        "Ej: El monto solicitado supera el tope presupuestal para proyectos de esta categoría..."
                      )}
                      {renderFilaDeEvaluacion(
                        "Partidas: Bienes", 
                        presupuestoCompleto.filter(p => p.tipo === "BIEN" || p.tipo_item === "BIEN").length === 0 ? "Ninguno" : presupuestoCompleto.filter(p => p.tipo === "BIEN" || p.tipo_item === "BIEN").map(p => `• ${p.descripcion} [Cant: ${p.cantidad}] -> S/. ${p.total || p.precio_total}`).join("\n"), 
                        "partidas_bienes", 
                        "Ej: Hay bienes de capital no permitidos en esta convocatoria..."
                      )}
                      {renderFilaDeEvaluacion(
                        "Partidas: Servicios", 
                        presupuestoCompleto.filter(p => p.tipo === "SERVICIO" || p.tipo_item === "SERVICIO").length === 0 ? "Ninguno" : presupuestoCompleto.filter(p => p.tipo === "SERVICIO" || p.tipo_item === "SERVICIO").map(p => `• ${p.descripcion} -> S/. ${p.total || p.precio_total}`).join("\n"), 
                        "partidas_servicios", 
                        "Ej: Los montos por consultoría/servicios externos no están debidamente cotizados..."
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* COMENTARIO TÉCNICO DE CIERRE */}
            {actionType === 'observar' && selectedProyecto && (
              <div className="mb-3 space-y-1 border-t pt-2 shrink-0">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Observación General Adicional / Conclusión del Dictamen
                </label>
                <textarea
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] bg-white text-slate-700 resize-none"
                  rows="2"
                  placeholder="Escriba un dictamen de cierre o resumen de las correcciones que se le solicitan al docente..."
                  value={observacionesCampos.observacion_general || ""}
                  onChange={(e) => handleInputChange("observacion_general", e.target.value)}
                />
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                disabled={evaluating}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEvaluate}
                disabled={evaluating || !selectedProyecto}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${actionType === 'aprobar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#b1122b] hover:bg-[#960f24]'} disabled:opacity-50`}
              >
                {evaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : actionType === 'aprobar' ? (
                  <>
                    <FiCheckCircle /> Confirmar Aprobación
                  </>
                ) : (
                  <>
                    <FiXCircle /> Emitir Observaciones
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}