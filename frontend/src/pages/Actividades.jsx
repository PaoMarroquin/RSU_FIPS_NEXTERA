import React, { useState, useEffect } from 'react';
import {
  FiClock, FiUpload, FiFilter, FiBookOpen, FiCheck, FiTarget,
  FiTrendingUp, FiFolder, FiChevronRight, FiInbox, FiPlayCircle, FiRotateCcw,
  FiLink, FiExternalLink, FiFile
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { actividadesService } from "../api/actividadesService"; // Importando el nuevo servicio independiente
import { useToast } from "../context/ToastContext";

// URL base del backend para construir rutas relativas de archivos
const BACKEND_URL = "http://localhost:8000";

// Definición de transiciones cíclicas y unidireccionales de estado (Máquina de Estados)
const SIGUIENTE_ESTADO = {
  'pendiente': 'en_ejecucion',
  'en_ejecucion': 'completada',
  'completada': 'pendiente'
};

export default function Actividades() {
  // 1. ESTADOS REALES DEL COMPONENTE
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [metasIndicadores, setMetasIndicadores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { showToast } = useToast();

  // Estado del Filtro de Actividades
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Estado local para los inputs de URL de evidencia (por actividad)
  const [urlInputs, setUrlInputs] = useState({});

  // 2. CARGA INICIAL DESDE BACKEND: Lista de Proyectos Aprobados del Docente
  useEffect(() => {
    const cargarProyectosDocente = async () => {
      try {
        setLoading(true);
        const response = await actividadesService.getProyectos();
        
        // Conversión y filtrado seguro
        const listaProyectos = Array.isArray(response) ? response : [];
        const aprobados = listaProyectos.filter(p => p.estado?.toLowerCase() === "aprobado");
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

      // Llamadas concurrentes al backend
      const [dataActividades, dataProyectoFull] = await Promise.all([
        actividadesService.getActividades(proyecto.id),
        actividadesService.getProyectoDetalle(proyecto.id)
      ]);

      // Controlamos de forma defensiva que actividades siempre sea un array plano
      const listaActividades = Array.isArray(dataActividades) 
        ? dataActividades 
        : (dataActividades?.results || dataActividades?.data || []);

      setActividades(listaActividades);
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);

      // Inicializar los inputs de URL con las URLs ya guardadas
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

  // 4. PERSISTENCIA EN BACKEND: CAMBIAR ESTADO SECUENCIALMENTE
  const handleCambiarEstado = async (actividadId, estadoActual) => {
    // NUEVO: Confirmación antes de reiniciar
    if (estadoActual === 'completada') {
      const confirmar = window.confirm(
        "¿Estás seguro de reiniciar esta actividad a estado Pendiente?\nSe perderá el avance registrado."
      );
      if (!confirmar) return;
    }

    try {
      const proximoEstado = SIGUIENTE_ESTADO[estadoActual] || 'pendiente';
      const payload = { estado: proximoEstado };

      const dataActualizada = await actividadesService.patchActividad(proyectoSeleccionado.id, actividadId, payload);

      // Actualizamos el estado localmente de manera segura
      setActividades(prev => {
        const actual = Array.isArray(prev) ? prev : [];
        return actual.map(act => act.id === actividadId ? dataActualizada : act);
      });
      
      showToast("success", `Actividad actualizada a: ${proximoEstado.replace('_', ' ').toUpperCase()}`);

      // Opcional: Refrescar el detalle para reflejar los avances de metas automatizados en el backend
      const dataProyectoFull = await actividadesService.getProyectoDetalle(proyectoSeleccionado.id);
      setMetasIndicadores(dataProyectoFull?.metas_indicadores || []);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showToast("error", "No se pudo actualizar el estado de la actividad en Django.");
    }
  };

  // 5. PERSISTENCIA EN BACKEND: ADJUNTAR EVIDENCIA (multipart/form-data)
  const handleSubirEvidencia = async (actividadId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataPayload = new FormData();
      dataPayload.append("archivo_evidencia", file);

      const dataActualizada = await actividadesService.patchActividadFormData(proyectoSeleccionado.id, actividadId, dataPayload);
      
      setActividades(prev => {
        const actual = Array.isArray(prev) ? prev : [];
        return actual.map(act => act.id === actividadId ? dataActualizada : act);
      });
      showToast("success", `Evidencia adjuntada con éxito.`);
    } catch (error) {
      console.error("Error al subir evidencia:", error);
      showToast("error", "Error crítico al transferir el archivo al servidor.");
    }
  };

  // 6. NUEVO: GUARDAR URL DE EVIDENCIA
  const handleGuardarUrl = async (actividadId) => {
    const url = urlInputs[actividadId]?.trim();
    if (!url) return;
    try {
      const dataActualizada = await actividadesService.patchActividad(
        proyectoSeleccionado.id,
        actividadId,
        { url_evidencia: url }
      );
      setActividades(prev => {
        const actual = Array.isArray(prev) ? prev : [];
        return actual.map(act => act.id === actividadId ? { ...act, ...dataActualizada } : act);
      });
      showToast("success", "URL de evidencia guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar URL:", error);
      showToast("error", "No se pudo guardar la URL de evidencia. El campo puede no estar disponible en el backend.");
    }
  };

  // Filtrado In-Memory con protección total anti-crashing
  const actividadesFiltradas = Array.isArray(actividades)
    ? actividades.filter(act => {
        if (filtroEstado !== "todos" && act.estado !== filtroEstado) return false;
        return true;
      })
    : [];

  // NUEVO: Cálculo de progreso global de actividades
  const totalActividades = Array.isArray(actividades) ? actividades.length : 0;
  const actividadesCompletadas = Array.isArray(actividades)
    ? actividades.filter(act => act.estado === 'completada').length
    : 0;
  const porcentajeProgreso = totalActividades > 0
    ? Math.round((actividadesCompletadas / totalActividades) * 100)
    : 0;

  // Helper: construir URL absoluta para archivos de evidencia
  const construirUrlArchivo = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Helper: obtener nombre del archivo desde una URL o path
  const obtenerNombreArchivo = (path) => {
    if (!path) return 'Ver archivo';
    const partes = path.split('/');
    return partes[partes.length - 1] || 'Ver archivo';
  };

  // Helper de estilos: Badges de Estado
  const obtenerBadgeEstado = (estado) => {
    switch (estado) {
      case 'en_ejecucion':
        return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/50">En Ejecución</span>;
      case 'completada':
        return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/50">Completada</span>;
      default: // 'pendiente'
        return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200/50">Pendiente</span>;
    }
  };

  // Helper de acciones: Botón Inteligente de Siguiente Estado
  const obtenerBotonAccion = (act) => {
    switch (act.estado) {
      case 'pendiente':
        return (
          <button
            onClick={() => handleCambiarEstado(act.id, act.estado)}
            title="Mover a En Ejecución"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all shadow-sm"
          >
            <FiPlayCircle className="text-sm" /> Iniciar
          </button>
        );
      case 'en_ejecucion':
        return (
          <button
            onClick={() => handleCambiarEstado(act.id, act.estado)}
            title="Mover a Completada"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition-all shadow-sm"
          >
            <FiCheck className="text-sm" /> Completar
          </button>
        );
      case 'completada':
        return (
          <button
            onClick={() => handleCambiarEstado(act.id, act.estado)}
            title="Mover de nuevo a Pendiente"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm"
          >
            <FiRotateCcw className="text-sm" /> Reiniciar
          </button>
        );
      default:
        return null;
    }
  };

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

          {/* VISTA 2: METAS E INDICADORES (DETALLE DEL PROYECTO SELECCIONADO) */}
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
                  {/* SECCIÓN METAS E INDICADORES */}
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

                  {/* NUEVO: BARRA DE PROGRESO GLOBAL DE ACTIVIDADES */}
                  {totalActividades > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FiTrendingUp className={porcentajeProgreso === 100 ? 'text-emerald-500' : 'text-[#7B1E3A]'} />
                          Progreso General de Actividades
                        </span>
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          porcentajeProgreso === 100
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-[#7B1E3A]/10 text-[#7B1E3A]'
                        }`}>
                          {actividadesCompletadas} de {totalActividades} — {porcentajeProgreso}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            porcentajeProgreso === 100 ? 'bg-emerald-500' : 'bg-[#7B1E3A]'
                          }`}
                          style={{ width: `${porcentajeProgreso}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {porcentajeProgreso === 100
                          ? '🎉 ¡Todas las actividades han sido completadas!'
                          : `${totalActividades - actividadesCompletadas} actividad(es) pendientes de completar.`}
                      </p>
                    </div>
                  )}

                  {/* BARRA DE FILTROS */}
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><FiFilter /> Filtrar por estado:</span>
                    <select 
                      value={filtroEstado} 
                      onChange={(e) => setFiltroEstado(e.target.value)} 
                      className="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 focus:outline-[#7B1E3A] font-medium shadow-sm"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="en_ejecucion">En Ejecución</option>
                      <option value="completada">Completadas</option>
                    </select>
                  </div>

                  {/* SECCIÓN ACTIVIDADES DEL PLAN DE TRABAJO */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
                      Actividades del Plan de Trabajo ({actividadesFiltradas.length})
                    </div>

                    {actividadesFiltradas.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-xs">No se encontraron actividades con el filtro actual.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {actividadesFiltradas.map((act) => (
                          <div 
                            key={act.id} 
                            className={`p-4 flex flex-col gap-3 transition-colors ${
                              act.estado === 'completada' ? 'bg-emerald-50/10' : act.estado === 'en_ejecucion' ? 'bg-blue-50/10' : ''
                            }`}
                          >
                            {/* Fila superior: info + botones de acción */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-xs font-bold text-slate-800 ${act.estado === 'completada' ? 'line-through text-slate-400' : ''}`}>
                                    {act.nombre}
                                  </h4>
                                  {obtenerBadgeEstado(act.estado)}
                                </div>
                                <p className="text-[11px] text-slate-500">{act.descripcion || "Sin descripción."}</p>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                                  <span>📅 Límite: {act.fecha}</span>
                                  {act.responsable && <span>• 👤 Resp: {act.responsable}</span>}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {/* Subida de Evidencias */}
                                <input type="file" onChange={(e) => handleSubirEvidencia(act.id, e)} className="hidden" id={`file-${act.id}`} />
                                <label htmlFor={`file-${act.id}`} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1">
                                  <FiUpload className="text-slate-400" /> {act.archivo_evidencia ? "Modificar" : "Evidencia"}
                                </label>
                                
                                {/* Botón de acción secuencial */}
                                {obtenerBotonAccion(act)}
                              </div>
                            </div>

                            {/* Fila inferior: archivo subido + URL de evidencia */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-slate-100/80">
                              
                              {/* NUEVO: Link al archivo ya subido */}
                              {act.archivo_evidencia ? (
                                <a
                                  href={construirUrlArchivo(act.archivo_evidencia)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#7B1E3A] font-medium transition-colors group"
                                  title="Ver archivo de evidencia"
                                >
                                  <FiFile className="text-slate-400 group-hover:text-[#7B1E3A] transition-colors" />
                                  <span className="underline underline-offset-2 truncate max-w-[160px]">
                                    {obtenerNombreArchivo(act.archivo_evidencia)}
                                  </span>
                                  <FiExternalLink className="text-slate-400 text-[10px]" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-300 italic flex items-center gap-1">
                                  <FiFile className="text-slate-300" /> Sin archivo subido
                                </span>
                              )}

                              {/* NUEVO: Input de URL de evidencia (Drive, etc.) */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FiLink className="text-slate-400 text-xs shrink-0" />
                                {act.url_evidencia && urlInputs[act.id] === act.url_evidencia ? (
                                  // Mostrar como link clickeable cuando ya está guardada y no se editó
                                  <a
                                    href={act.url_evidencia}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:text-blue-800 underline underline-offset-2 truncate max-w-[200px] font-medium flex items-center gap-1"
                                    title={act.url_evidencia}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="truncate">{act.url_evidencia}</span>
                                    <FiExternalLink className="text-[10px] shrink-0" />
                                  </a>
                                ) : null}
                                <input
                                  type="url"
                                  placeholder="URL de evidencia (Drive, etc.)"
                                  value={urlInputs[act.id] || ''}
                                  onChange={(e) => setUrlInputs(prev => ({ ...prev, [act.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleGuardarUrl(act.id);
                                    }
                                  }}
                                  onBlur={() => handleGuardarUrl(act.id)}
                                  className="flex-1 min-w-0 text-[11px] border border-slate-200 rounded-md px-2 py-1 text-slate-600 placeholder-slate-300 focus:outline-none focus:border-[#7B1E3A] focus:ring-1 focus:ring-[#7B1E3A]/20 transition-all bg-slate-50"
                                />
                              </div>
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