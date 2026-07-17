import React, { useState, useEffect } from 'react';
import {
  FiClock, FiUpload,
  FiFilter, FiBookOpen, FiCheck, FiTarget, FiTrendingUp,
  FiFolder, FiChevronRight, FiInbox
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { authService } from "../api/authService"; // Asegúrate de que apunte a tu Axios instance
import { useToast } from "../context/ToastContext";

export default function Actividades() {
  // 1. ESTADOS REALES
  const [proyectos, setProyectos] = useState([]); 
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null); 
  const [actividades, setActividades] = useState([]);
  const [metasIndicadores, setMetasIndicadores] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { showToast } = useToast();

  // Estados de Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTiempo, setFiltroTiempo] = useState("todos");

  // 2. CARGA INICIAL DESDE BACKEND: Lista de Proyectos del Docente
  useEffect(() => {
    const cargarProyectosDocente = async () => {
      try {
        setLoading(true);
        // LLAMADA REAL: Ajusta el método según tu API, por ejemplo pasándole el estado aprobado
        const response = await authService.getProyectos(); 
        
        // Filtramos en el cliente solo los aprobados por si las dudas
        const aprobados = (response || []).filter(p => p.estado?.toLowerCase() === "aprobado");
        setProyectos(aprobados);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
        showToast("error", "No se pudo sincronizar la lista de proyectos desde el servidor.");
      } finally {
        setLoading(false);
      }
    };
    cargarProyectosDocente();
  }, []);

  // 3. CARGA DINÁMICA SEGÚN PROYECTO SELECCIONADO (Metas + Actividades)
  const handleSeleccionarProyecto = async (proyecto) => {
    try {
      setLoadingDetalle(true);
      setProyectoSeleccionado(proyecto);

      // Llamadas concurrentes al backend de Django
      const [dataActividades, dataProyectoFull] = await Promise.all([
        authService.getActividades(proyecto.id), // GET /api/v1/proyectos/{id}/actividades/
        authService.getProyectoDetalle(proyecto.id) // GET /api/v1/proyectos/{id}/ (Trae los serializadores internos)
      ]);

      setActividades(dataActividades || []);
      
      // Mapeamos las metas directamente desde tu 'MetaIndicadorProyectoSerializer' anidado
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);
      
    } catch (error) {
      console.error("Error al abrir proyecto:", error);
      showToast("error", "Ocurrió un problema al descargar los indicadores y el plan de trabajo.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // 4. PERSISTENCIA DE CAMBIOS (PATCH) EN EL BACKEND
  const handleToggleCumplido = async (actividadId, estadoActual) => {
    try {
      const payload = { cumplido: !estadoActual };
      const dataActualizada = await authService.patchActividad(proyectoSeleccionado.id, actividadId, payload);
      
      setActividades(prev => prev.map(act => act.id === actividadId ? dataActualizada : act));
      showToast("success", `Actividad actualizada correctamente en el sistema.`);
      
      // Opcional: Si el cumplimiento altera los indicadores automáticamente en el back, refrescamos el detalle
      const dataProyectoFull = await authService.getProyectoDetalle(proyectoSeleccionado.id);
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);
    } catch (error) {
      showToast("error", "No se pudo guardar el cambio de estado en Django.");
    }
  };

  const handleSubirEvidencia = async (actividadId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataPayload = new FormData();
      dataPayload.append("archivo_evidencia", file); // Debe coincidir con el FileField de tu modelo Django

      const dataActualizada = await authService.patchActividadFormData(proyectoSeleccionado.id, actividadId, dataPayload);
      setActividades(prev => prev.map(act => act.id === actividadId ? dataActualizada : act));
      showToast("success", `Evidencia adjuntada con éxito.`);
    } catch (error) {
      showToast("error", "Error crítico al transferir el archivo al servidor.");
    }
  };

  // Filtrado In-Memory rápido
  const actividadesFiltradas = actividades.filter(act => {
    if (filtroEstado === "cumplidos" && !act.cumplido) return false;
    if (filtroEstado === "pendientes" && act.cumplido) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 flex-1 max-w-4xl w-full mx-auto space-y-6">

          {/* VISTA 1: LISTA DE PROYECTOS */}
          {!proyectoSeleccionado && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FiFolder className="text-[#7B1E3A]" /> Mis Proyectos Aprobados (Ejecución RSU)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Selecciona un proyecto para registrar el cumplimiento de indicadores y subir evidencias.</p>
              </div>

              {loading ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <div className="w-6 h-6 border-2 border-[#7B1E3A] border-t-transparent rounded-full animate-spin"></div>
                  Consultando registros en Django...
                </div>
              ) : proyectos.length === 0 ? (
                /* CASO: SI NO HAY PROYECTOS REGISTRADOS/APROBADOS */
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-lg">
                    <FiInbox />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 m-0">No registras proyectos aprobados</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Actualmente no cuentas con planes de trabajo en estado "Aprobado" para este periodo académico.</p>
                  </div>
                </div>
              ) : (
                /* CASO: SÍ HAY PROYECTOS */
                <div className="grid grid-cols-1 gap-3">
                  {proyectos.map((proy) => (
                    <div 
                      key={proy.id}
                      onClick={() => handleSeleccionarProyecto(proy)}
                      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#7B1E3A] shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {proy.codigo || `ID #${proy.id}`}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#7B1E3A] transition-colors">
                          {proy.titulo}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {proy.escuela_nombre} — <span className="text-slate-500">{proy.periodo_nombre}</span>
                        </p>
                      </div>
                      <FiChevronRight className="text-slate-400 group-hover:transform group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: METAS E INDICADORES (DETALLE) */}
          {proyectoSeleccionado && (
            <div className="space-y-6">
              <button 
                onClick={() => setProyectoSeleccionado(null)}
                className="text-xs font-bold text-[#7B1E3A] bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1"
              >
                ← Volver a mis proyectos
              </button>

              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white border border-slate-700 shadow-md">
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  {proyectoSeleccionado.codigo || `ID #${proyectoSeleccionado.id}`}
                </span>
                <h2 className="text-base font-bold tracking-tight mt-1">{proyectoSeleccionado.titulo}</h2>
              </div>

              {loadingDetalle ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium">Sincronizando cronograma con Django...</div>
              ) : (
                <>
                  {/* SECCIÓN METAS E INDICADORES (Si no trae nada el backend, no renderiza las cajas) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <FiTarget className="text-slate-500 text-sm" /> Indicadores de Impacto del Proyecto
                    </div>
                    
                    {metasIndicadores.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 italic text-xs">Este proyecto no tiene metas parametrizadas en su indicador.</div>
                    ) : (
                      <div className="p-5 space-y-4">
                        {metasIndicadores.map((meta) => (
                          <div key={meta.id} className="bg-slate-50 border border-slate-100 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="text-xs font-bold text-slate-700">{meta.meta_descripcion}</h5>
                                <p className="text-[11px] text-slate-500">
                                  <span className="font-semibold">Indicador:</span> {meta.indicador_nombre}
                                </p>
                              </div>
                              <span className="text-xs font-mono font-bold bg-[#7B1E3A]/10 text-[#7B1E3A] px-2 py-0.5 rounded">
                                {meta.valor_alcanzado} / {meta.valor_meta} {meta.unidad_medida}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(meta.porcentaje_avance || 0, 100)}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN ACTIVIDADES DEL PLAN DE TRABAJO */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
                      Actividades del Plan de Trabajo ({actividadesFiltradas.length})
                    </div>
                    
                    {actividadesFiltradas.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-xs">No se encontraron actividades asignadas a este cronograma.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {actividadesFiltradas.map((act) => (
                          <div key={act.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${act.cumplido ? 'bg-emerald-50/10' : ''}`}>
                            <div className="space-y-1">
                              <h4 className={`text-xs font-bold text-slate-800 ${act.cumplido ? 'line-through text-slate-400' : ''}`}>{act.nombre}</h4>
                              <p className="text-[11px] text-slate-500">{act.descripcion || "Sin descripción."}</p>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                                <span>📅 Límite: {act.fecha}</span>
                                {act.responsable && <span>• 👤 Resp: {act.responsable}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <input type="file" onChange={(e) => handleSubirEvidencia(act.id, e)} className="hidden" id={`file-${act.id}`} />
                              <label htmlFor={`file-${act.id}`} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
                                <FiUpload className="inline mr-1 text-slate-400" /> {act.archivo_evidencia ? "Modificar" : "Evidencia"}
                              </label>
                              <button 
                                onClick={() => handleToggleCumplido(act.id, act.cumplido)} 
                                className={`p-1.5 rounded border transition-colors ${act.cumplido ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-300 hover:border-emerald-500 hover:text-emerald-500'}`}
                              >
                                <FiCheck />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}