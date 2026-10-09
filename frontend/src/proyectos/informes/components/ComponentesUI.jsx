import React from "react";

export const SectionCard = ({ numero, titulo, descripcion, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
    <div className="px-7 py-5 border-b border-slate-100">
      <p className="text-[10px] font-bold text-[#b1122b] uppercase tracking-wide">Sección {numero}</p>
      <h3 className="text-xl font-bold text-slate-800 mt-1">{titulo}</h3>
      <p className="text-xs text-slate-400 mt-1">{descripcion}</p>
    </div>
    <div className="p-7">{children}</div>
  </div>
);

export const CampoLectura = ({ label, value }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-2">{label}</label>
    <div className="min-h-[42px] px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-600">
      {value || "—"}
    </div>
  </div>
);

export const CampoTexto = ({ label, obligatorio = false, disabled = false, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-2">
      {label} {obligatorio && <span className="text-red-500">*</span>}
    </label>
    <textarea 
      value={value} 
      disabled={disabled} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full min-h-[150px] p-3 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#b1122b] disabled:bg-slate-50" 
    />
  </div>
);

export const Indicador = ({ icon, titulo, valor }) => (
  <div className="border border-slate-200 rounded-xl p-4 bg-white">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#b1122b] mb-3">
      {icon}
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{titulo}</p>
    <p className="text-xl font-bold text-slate-800 mt-1">{valor}</p>
  </div>
);