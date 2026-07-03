import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FiCheckCircle, FiAlertCircle, FiClock, FiUpload, 
  FiFilter, FiFileText, FiEye, FiCheck, FiX 
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { authService } from "../api/authService";

export default function Actividades() {
  const { proyectoId } = useParams(); // {proyecto_pk} de tu URL
  
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Estados para los Filtros de la UI
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos, cumplidos, pendientes
  const [filtroTiempo, setFiltroTiempo] = useState("todos"); // todos, vencidos, proximos

  const mostrarAlerta = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
  };

  // 1. CARGA INICIAL (GET /api/v1/proyectos/{proyecto_pk}/actividades/)
  useEffect(() => {
    const cargarActividades = async () => {
      if (!proyectoId) return;
      try {
        setLoading(true);
        const data = await authService.getActividades(proyectoId);
        setActividades(data || []);
      } catch (error) {
        console.error(error);
        mostrarAlerta("error", "No se pudieron obtener las actividades aprobadas del servidor.");
      } finally {
        setLoading(false);
      }
    };
    cargarActividades();
  }, [proyectoId]);

  // 2. MARCAR COMO CUMPLIDO (PATCH /api/v1/proyectos/{proyecto_pk}/actividades/{id}/)
  const handleToggleCumplido = async (actividadId, estadoActual) => {
    try {
      const payload = { cumplido: !estadoActual };
      const dataActualizada = await authService.patchActividad(proyectoId, actividadId, payload);
      
      setActividades(prev => prev.map(act => act.id === actividadId ? dataActualizada : act));
      mostrarAlerta("success", `Actividad marcada como ${!estadoActual ? 'Cumplida' : 'Pendiente'}.`);
    } catch (error) {
      console.error(error);
      mostrarAlerta("error", "No se pudo actualizar el estado de cumplimiento en Django.");
    }
  };

  // 3. SUBIR ARCHIVO DE EVIDENCIA (PATCH con FormData por archivo binario)
  const handleSubirEvidencia = async (actividadId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataPayload = new FormData();
      dataPayload.append("archivo_evidencia", file); // Asegúrate de que coincida con tu campo en Django

      const dataActualizada = await authService.patchActividadFormData(proyectoId, actividadId, dataPayload);
      
      setActividades(prev => prev.map(act => act.id === actividadId ? dataActualizada : act));
      mostrarAlerta("success", `¡Evidencia "${file.name}" cargada correctamente!`);
    } catch (error) {
      console.error(error);
      mostrarAlerta("error", "Hubo un error al subir el archivo de evidencia al servidor.");
    }
  };

  // 4. LÓGICA DE PRIORIDAD POR TIEMPO Y FILTRADO IN-MEMORY
  const calcularPrioridad = (fechaLimite, cumplido) => {
    if (cumplido) return { texto: "Cumplido", clase: "bg-green-100 text-green-800 border-green-200" };
    
    const hoy = new Date();
    const fechaAct = new Date(fechaLimite);
    
    // Resetear horas para comparación exacta de días
    hoy.setHours(0,0,0,0);
    fechaAct.setHours(0,0,0,0);

    if (fechaAct < hoy) {
      return { texto: "Vencido / Urgente", clase: "bg-red-100 text-red-800 border-red-200 animate-pulse" };
    } else if ((fechaAct - hoy) / (1000 * 60 * 60 * 24) <= 7) {
      return { texto: "Prioridad Alta (Esta semana)", clase: "bg-amber-100 text-amber-800 border-amber-200" };
    }
    return { texto: "A tiempo", clase: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const actividadesFiltradas = actividades.filter(act => {
    // Filtro por Estado
    if (filtroEstado === "cumplidos" && !act.cumplido) return false;
    if (filtroEstado === "pendientes" && act.cumplido) return false;

    // Filtro por Tiempo
    if (filtroTiempo !== "todos") {
      const hoy = new Date().setHours(0,0,0,0);
      const fechaAct = new Date(act.fecha).setHours(0,0,0,0);
      if (filtroTiempo === "vencidos" && (fechaAct >= hoy || act.cumplido)) return false;
      if (filtroTiempo === "proximos" && (fechaAct < hoy || act.cumplido)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen overflow-hidden">
        <Topbar />

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] gap-2 text-center">
              <div className="w-9 h-9 border-4 border-[#b1122b] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Cargando ejecución de cronograma aprobado...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              
              {/* ENCABEZADO VISTA CONTROL */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white border border-slate-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-xl text-emerald-400 border border-emerald-500/20">
                    <FiCheckCircle />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Seguimiento de Actividades Aprobadas</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Proyecto ID: #{proyectoId} — Control de Hitos y Carga de Evidencias</p>
                  </div>
                </div>
              </div>

              {/* ALERTAS */}
              {statusMsg.text && (
                <div className={`p-4 rounded-lg flex items-center gap-3 border text-sm transition-all ${
                  statusMsg.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {statusMsg.type === "success" ? <FiCheckCircle className="text-lg shrink-0" /> : <FiAlertCircle className="text-lg shrink-0" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* BARRA DE FILTROS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <FiFilter className="text-slate-400 text-sm" /> Filtros de Monitoreo:
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Filtro Cumplimiento */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Estado:</span>
                    <select 
                      value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 outline-none font-medium text-slate-800 focus:border-[#b1122b]"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="cumplidos">✓ Hechos / Cumplidos</option>
                      <option value="pendientes">⚠ Restantes / Pendientes</option>
                    </select>
                  </div>

                  {/* Filtro Temporal */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Plazos:</span>
                    <select 
                      value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 outline-none font-medium text-slate-800 focus:border-[#b1122b]"
                    >
                      <option value="todos">Cualquier fecha</option>
                      <option value="vencidos">📅 Tareas Vencidas</option>
                      <option value="proximos">⏳ Próximas a vencer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LISTADO DE ACTIVIDADES EN FORMATO TABLA DE CONTROL */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Plan de Trabajo Sincronizado ({actividadesFiltradas.length} visibles)
                </div>

                {actividadesFiltradas.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-xs">
                    Ninguna actividad coincide con los criterios de filtrado seleccionados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {actividadesFiltradas.map((act) => {
                      const prioridad = calcularPrioridad(act.fecha, act.cumplido);
                      
                      return (
                        <div key={act.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${act.cumplido ? 'bg-emerald-50/20' : ''}`}>
                          
                          {/* Información Base */}
                          <div className="space-y-1.5 flex-1 max-w-xl">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                                Orden #{act.orden}
                              </span>
                              <h4 className={`text-sm font-bold text-slate-800 tracking-tight ${act.cumplido ? 'line-through text-slate-400' : ''}`}>
                                {act.nombre}
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${prioridad.clase}`}>
                                {prioridad.texto}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 m-0 line-clamp-2">{act.descripcion || "Sin descripción detallada."}</p>
                            
                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                              <span className="flex items-center gap-1"><FiClock /> Límite: {act.fecha}</span>
                              <span className="flex items-center gap-1"><FiBookOpen /> Resp: {act.responsable}</span>
                            </div>
                          </div>

                          {/* Sección Control Acciones (Evidencia y Check) */}
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                            
                            {/* Input de Carga de Evidencia */}
                            <div className="relative">
                              <input 
                                type="file" 
                                onChange={(e) => handleSubirEvidencia(act.id, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                title="Subir archivo de evidencia"
                              />
                              <button type="button" className={`px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-md border flex items-center gap-1.5 transition-colors ${
                                act.archivo_evidencia 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}>
                                <FiUpload /> {act.archivo_evidencia ? "Evidencia Guardada" : "Subir Evidencia"}
                              </button>
                            </div>

                            {/* Botón Switch de Cumplido */}
                            <button
                              type="button"
                              onClick={() => handleToggleCumplido(act.id, act.cumplido)}
                              className={`p-2 rounded-md border text-base transition-colors ${
                                act.cumplido
                                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white border-slate-300 text-slate-400 hover:border-red-600 hover:text-[#b1122b]'
                              }`}
                              title={act.cumplido ? "Marcar como pendiente" : "Marcar como completado"}
                            >
                              {act.cumplido ? <FiCheck /> : <FiX />}
                            </button>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}