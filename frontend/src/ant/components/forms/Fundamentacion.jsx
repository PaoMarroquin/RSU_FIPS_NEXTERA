import React from 'react';

export default function Fundamentacion({ data, updateData }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData(name, value);
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">II.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Fundamentación</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 2 de 9</span>
        </div>
      </div>

      {/* CUADRO DE PREGUNTAS GUÍA */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
        <h3 className="text-sm font-bold text-blue-800 mb-2.5">
          Preguntas guía para la fundamentación:
        </h3>
        <ul className="list-disc list-inside text-xs text-blue-700 space-y-1.5 ml-1">
          <li>¿Por qué se eligió el grupo beneficiario?</li>
          <li>¿Para qué servirá el proyecto?</li>
          <li>¿Cuál será el mecanismo de enseñanza-aprendizaje?</li>
        </ul>
      </div>

      {/* CAMPOS DE TEXTO */}
      <div className="space-y-5">
        
        {/* Pregunta 1 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            ¿Por qué se eligió el grupo beneficiario? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="fund_razonGrupo" 
            placeholder="Describa las razones de la elección del grupo beneficiario..." 
            value={data.fund_razonGrupo} 
            onChange={handleChange} 
          />
        </div>

        {/* Pregunta 2 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            ¿Para qué servirá el proyecto? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="fund_proposito" 
            placeholder="Explique la utilidad y propósito del proyecto..." 
            value={data.fund_proposito} 
            onChange={handleChange} 
          />
        </div>

        {/* Pregunta 3 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">
            ¿Cuál será el mecanismo de enseñanza-aprendizaje? <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
            name="fund_metodologia" 
            placeholder="Detalle la metodología de enseñanza-aprendizaje a aplicar..." 
            value={data.fund_metodologia} 
            onChange={handleChange} 
          />
        </div>

      </div>
    </div>
  );
}