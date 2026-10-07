import React from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

export const BuscadorProyectos = ({ 
  busquedaProyecto, 
  setBusquedaProyecto, 
  setSearchTerm, 
  mostrarProyectos, 
  setMostrarProyectos, 
  loading, 
  proyectos, 
  seleccionarProyecto 
}) => (
  <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-800">Informe de Finalización</h2>
      <p className="text-sm text-slate-500 mt-1">Selecciona un proyecto finalizado para generar su informe.</p>
    </div>

    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 max-w-2xl">
      <div className="relative">
        <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5">
          <FiSearch className="text-slate-400 mr-2" />
          <input
            type="text"
            value={busquedaProyecto}
            onFocus={() => setMostrarProyectos(true)}
            onChange={(e) => {
              setBusquedaProyecto(e.target.value);
              setSearchTerm(e.target.value);
              setMostrarProyectos(true);
            }}
            placeholder="Buscar proyectos finalizados..."
            className="w-full outline-none text-sm text-slate-700"
          />
        </div>

        {mostrarProyectos && (
          <div className="absolute z-40 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <FiRefreshCw className="animate-spin text-[#b1122b]" /> Buscando...
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {proyectos.length === 0 ? (
                  <p className="p-5 text-center text-xs text-slate-400">No se encontraron proyectos.</p>
                ) : (
                  proyectos.map((proyecto) => (
                    <button
                      key={proyecto.id}
                      onClick={() => seleccionarProyecto(proyecto)}
                      className="w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-xs font-bold text-[#b1122b]">{proyecto.codigo}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{proyecto.titulo}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);