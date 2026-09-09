import React from 'react';
import { 
  FiTarget, FiTrendingUp, FiFilter, FiUpload, 
  FiFile, FiLink, FiExternalLink, FiPlayCircle, FiCheck, FiRotateCcw 
} from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const construirUrlArchivo = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const obtenerNombreArchivo = (path) => {
  if (!path) return 'Ver archivo';
  const partes = path.split('/');
  return partes[partes.length - 1] || 'Ver archivo';
};

const obtenerBadgeEstado = (estado) => {
  switch (estado) {
    case 'en_ejecucion':
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/50">En Ejecución</span>;
    case 'completada':
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/50">Completada</span>;
    default:
      return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200/50">Pendiente</span>;
  }
};

const obtenerBotonAccion = (act, onCambiarEstado) => {
  switch (act.estado) {
    case 'pendiente':
      return (
        <button onClick={() => onCambiarEstado(act.id, act.estado)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all shadow-sm">
          <FiPlayCircle className="text-sm" /> Iniciar
        </button>
      );
    case 'en_ejecucion':
      return (
        <button onClick={() => onCambiarEstado(act.id, act.estado)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 text-xs font-bold transition-all shadow-sm">
          <FiCheck className="text-sm" /> Completar
        </button>
      );
    case 'completada':
      return (
        <button onClick={() => onCambiarEstado(act.id, act.estado)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm">
          <FiRotateCcw className="text-sm" /> Reiniciar
        </button>
      );
    default: return null;
  }
};

export default function TableroProyecto({
  proyecto, metasIndicadores, actividadesFiltradas, loadingDetalle,
  filtroEstado, setFiltroEstado, urlInputs,
  totalActividades, actividadesCompletadas, porcentajeProgreso,
  onBack, onCambiarEstado, onSubirEvidencia, onGuardarUrl, onUpdateUrl
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-xs font-bold text-[#7B1E3A] bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1"
      >
        ← Volver a mis proyectos
      </button>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white border border-slate-700 shadow-md">
        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
          {proyecto.codigo || `ID #${proyecto.id}`}
        </span>
        <h2 className="text-base font-bold tracking-tight mt-1">{proyecto.titulo}</h2>
      </div>

      {loadingDetalle ? (
        <div className="text-center py-12 text-xs text-slate-400 font-medium">Sincronizando cronograma con Django...</div>
      ) : (
        <>
          {/* METAS E INDICADORES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <FiTarget className="text-slate-500 text-sm" /> Indicadores de Impacto del Proyecto
            </div>
            {metasIndicadores.length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic text-xs">Este proyecto no tiene metas parametrizadas.</div>
            ) : (
              <div className="p-5 space-y-4">
                {metasIndicadores.map((meta) => (
                  <div key={meta.id} className="bg-slate-50 border border-slate-100 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-700">{meta.meta_descripcion}</h5>
                        <p className="text-[11px] text-slate-500"><span className="font-semibold">Indicador:</span> {meta.indicador_nombre}</p>
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

          {/* PROGRESO GLOBAL */}
          {totalActividades > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FiTrendingUp className={porcentajeProgreso === 100 ? 'text-emerald-500' : 'text-[#7B1E3A]'} />
                  Progreso General de Actividades
                </span>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${porcentajeProgreso === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#7B1E3A]/10 text-[#7B1E3A]'}`}>
                  {actividadesCompletadas} de {totalActividades} — {porcentajeProgreso}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${porcentajeProgreso === 100 ? 'bg-emerald-500' : 'bg-[#7B1E3A]'}`} style={{ width: `${porcentajeProgreso}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400">
                {porcentajeProgreso === 100 ? '🎉 ¡Todas las actividades completadas!' : `${totalActividades - actividadesCompletadas} actividad(es) pendientes.`}
              </p>
            </div>
          )}

          {/* FILTROS */}
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-slate-400 flex items-center gap-1"><FiFilter /> Filtrar:</span>
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

          {/* LISTA DE ACTIVIDADES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
              Actividades ({actividadesFiltradas.length})
            </div>

            {actividadesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-xs">No se encontraron actividades.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {actividadesFiltradas.map((act) => (
                  <div key={act.id} className={`p-4 flex flex-col gap-3 transition-colors ${act.estado === 'completada' ? 'bg-emerald-50/10' : act.estado === 'en_ejecucion' ? 'bg-blue-50/10' : ''}`}>
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
                        <input type="file" onChange={(e) => onSubirEvidencia(act.id, e)} className="hidden" id={`file-${act.id}`} />
                        <label htmlFor={`file-${act.id}`} className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1">
                          <FiUpload className="text-slate-400" /> {act.archivo_evidencia ? "Modificar" : "Evidencia"}
                        </label>
                        {obtenerBotonAccion(act, onCambiarEstado)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 border-t border-slate-100/80">
                      {act.archivo_evidencia ? (
                        <a href={construirUrlArchivo(act.archivo_evidencia)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#7B1E3A] font-medium transition-colors group">
                          <FiFile className="text-slate-400 group-hover:text-[#7B1E3A] transition-colors" />
                          <span className="underline underline-offset-2 truncate max-w-[160px]">{obtenerNombreArchivo(act.archivo_evidencia)}</span>
                          <FiExternalLink className="text-slate-400 text-[10px]" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic flex items-center gap-1"><FiFile className="text-slate-300" /> Sin archivo subido</span>
                      )}

                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FiLink className="text-slate-400 text-xs shrink-0" />
                        {act.url_evidencia && urlInputs[act.id] === act.url_evidencia ? (
                          <a href={act.url_evidencia} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 underline underline-offset-2 truncate max-w-[200px] font-medium flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="truncate">{act.url_evidencia}</span>
                            <FiExternalLink className="text-[10px] shrink-0" />
                          </a>
                        ) : null}
                        <input
                          type="url"
                          placeholder="URL de evidencia (Drive, etc.)"
                          value={urlInputs[act.id] || ''}
                          onChange={(e) => onUpdateUrl(act.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onGuardarUrl(act.id); } }}
                          onBlur={() => onGuardarUrl(act.id)}
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
  );
}