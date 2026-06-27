import React from 'react';

export default function Objetivos({ data, updateData }) {
  
  const handleChange = (e) => {
    updateData(e.target.name, e.target.value);
  };

  return (
    <div className="space-y-8 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IV.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Objetivos</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 4 de 9</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* PREGUNTA 1 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 leading-snug">
            ¿Qué queremos lograr con nuestra intervención en el grupo beneficiario? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[120px] w-full rounded-lg border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y shadow-inner" 
            name="obj_lograrBeneficiario" 
            placeholder="Describa el impacto esperado en el grupo beneficiario..." 
            value={data.obj_lograrBeneficiario || ''} 
            onChange={handleChange} 
          />
        </div>

        {/* PREGUNTA 2 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 leading-snug">
            ¿Qué queremos mejorar en el proceso curricular? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[120px] w-full rounded-lg border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y shadow-inner" 
            name="obj_mejorarCurricular" 
            placeholder="Describa los aportes y mejoras desde el punto de vista académico..." 
            value={data.obj_mejorarCurricular || ''} 
            onChange={handleChange} 
          />
        </div>
      </div>

    </div>
  );
}