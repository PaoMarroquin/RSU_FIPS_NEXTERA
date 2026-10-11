import React from "react";
import { FiEye, FiRefreshCw, FiFileText, FiX } from "react-icons/fi";
import ReporteExpediente from "../../../shared/components/ReporteExpediente";

export const DocumentoCard = ({ icon, titulo, descripcion, estado, disponible, loading, onView, ultimo = false }) => (
  <div className={`bg-white border border-slate-200 rounded-xl ${ultimo ? "" : "mb-3"}`}>
    <div className="min-h-[82px] px-4 py-4 flex flex-row items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${disponible ? "bg-[#f5e9eb] text-[#6f1825]" : "bg-slate-50 text-slate-300"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-700 truncate">{titulo}</h3>
          <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${disponible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {estado}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{descripcion}</p>
      </div>
      <button
        type="button" disabled={!disponible || loading} onClick={onView} title={disponible ? "Ver documento" : "Documento no disponible"}
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
          disponible ? "border-slate-200 text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b] hover:bg-[#fdf7f8]" : "border-transparent text-slate-300 cursor-not-allowed"
        }`}
      >
        {loading ? <FiRefreshCw className="animate-spin" /> : <FiEye />}
      </button>
    </div>
  </div>
);

export const ModalDocumento = ({ tipo, proyecto, cerrar }) => {
  const tipoReal = typeof tipo === "string" ? tipo : tipo?.tipo;
  const urlPDF = typeof tipo === "object" ? tipo?.url : null;

  const titulo = tipoReal === "planificacion" ? "Informe de planificación" : tipoReal === "finalizacion" ? "Informe de finalización" : "Constancia de ejecución";
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="bg-white w-full max-w-6xl h-[95vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-[#b1122b]" />
              <h2 className="text-sm font-bold text-slate-800">{titulo}</h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{proyecto?.codigo || "—"} · {proyecto?.titulo || "Proyecto"}</p>
          </div>
          <button type="button" onClick={cerrar} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#b1122b] hover:bg-slate-50">
            <FiX className="text-lg" />
          </button>
        </div>
        <div className="flex-1 w-full bg-slate-100 relative">
          {tipoReal === "planificacion" ? (
            <div className="p-2 sm:p-5 w-full h-full overflow-y-auto">
              <ReporteExpediente matrizSeleccionada={proyecto} showPrintButton={true} />
            </div>
          ) : (
            <iframe 
              src={urlPDF} 
              className="w-full h-full border-none absolute inset-0"
              title={`PDF - ${titulo}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};