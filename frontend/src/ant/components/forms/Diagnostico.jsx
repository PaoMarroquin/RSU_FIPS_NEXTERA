import React from 'react';

export default function Diagnostico({ data, updateData }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData(name, value);
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">III.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Diagnóstico</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 3 de 9</span>
        </div>
      </div>

      {/* CAMPOS DE TEXTO */}
      <div className="space-y-5">
        
        {/* Pregunta 1 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Estado actual del grupo beneficiario <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="diag_estadoActual" 
            placeholder="Describa la situación actual del grupo objetivo..." 
            value={data.diag_estadoActual} 
            onChange={handleChange} 
          />
        </div>

        {/* Pregunta 2 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Problemas detectados <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="diag_problemas" 
            placeholder="Liste y describa los problemas identificados..." 
            value={data.diag_problemas} 
            onChange={handleChange} 
          />
        </div>

        {/* Pregunta 3 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Aportes desde la formación profesional <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="diag_aportes" 
            placeholder="Describa cómo aportará la formación profesional al proyecto..." 
            value={data.diag_aportes} 
            onChange={handleChange} 
          />
        </div>

        {/* Pregunta 4 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Justificación de la intervención <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="diag_justificacion" 
            placeholder="Sustente la pertinencia y necesidad de la intervención..." 
            value={data.diag_justificacion} 
            onChange={handleChange} 
          />
        </div>

      </div>
    </div>
  );
}