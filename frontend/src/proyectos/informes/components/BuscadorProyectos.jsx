import React from "react";
import { FiSearch, FiRefreshCw, FiFilter } from "react-icons/fi";

export const BuscadorProyectos = ({ 
  busquedaProyecto, 
  setBusquedaProyecto, 
  setSearchTerm, 
  loading, 
  proyectos, 
  seleccionarProyecto 
}) => (
  <div className="flex-1 flex flex-col gap-6 w-full max-w-2xl">
    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <FiFilter /> Búsqueda de Proyectos
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
        <FiSearch className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={busquedaProyecto}
          onChange={(e) => {
            setBusquedaProyecto(e.target.value);
            setSearchTerm(e.target.value);
          }}
          placeholder="Buscar proyectos finalizados..."
          className="w-full outline-none text-sm text-slate-700 bg-transparent"
        />
      </div>
    </div>

    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 shadow-sm">
          <FiRefreshCw className="animate-spin text-[#b1122b] text-lg" /> 
          <span>Buscando proyectos...</span>
        </div>
      ) : proyectos.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center shadow-sm italic">
          No se encontraron proyectos finalizados.
        </div>
      ) : (
        proyectos.map((proyecto) => (
          <div
            key={proyecto.id}
            onClick={() => seleccionarProyecto(proyecto)}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {proyecto.codigo}
                </span>
                <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                  FINALIZADO
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">
                {proyecto.titulo}
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Semestre: <b className="text-slate-600">S/A</b></span>
              <span className="text-slate-400 font-semibold text-[10px]">
                Seleccionar →
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);