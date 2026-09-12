import React from 'react';
import { FiFolder, FiInbox, FiChevronRight } from "react-icons/fi";

export default function ListaProyectos({ proyectos, loading, onSelect }) {
  return (
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
            <h4 className="text-sm font-bold text-slate-700 m-0">No registras proyectos en ejecución</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Actualmente no cuentas con planes de trabajo en estado "Aprobado" o "En Ejecución".</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {proyectos.map((proy) => (
            <div
              key={proy.id}
              onClick={() => onSelect(proy)}
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
  );
}