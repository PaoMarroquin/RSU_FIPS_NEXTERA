import React from 'react';

export default function Resultados({ data, updateData }) {
  
  // Manejador para primera pregunta (campo exacto del backend: resultado_beneficiario)
  const handleChangeResultadoBeneficiario = (e) => {
    updateData('resultado_beneficiario', e.target.value);
  };

  // Manejador para segunda pregunta (campo exacto del backend: resultado_curricular)
  const handleChangeResultadoCurricular = (e) => {
    updateData('resultado_curricular', e.target.value);
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">V.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Resultados</h2>
          <span className="text-xs text-slate-500 block mt-0.5">
            Sección 5 de 9
          </span>
        </div>
      </div>

      {/* 1. RESULTADOS EN EL GRUPO BENEFICIARIO */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700 leading-relaxed">
          ¿Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas dentro del proceso enseñanza-aprendizaje, qué logros o cambios se espera obtener en el grupo beneficiario? <span className="text-red-500">*</span>
        </label>

        <textarea
          className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b] transition-all resize-y"
          name="resultado_beneficiario"
          placeholder="Describa de forma detallada los logros o cambios esperados en el grupo beneficiario..."
          value={data.resultado_beneficiario || ''}
          onChange={handleChangeResultadoBeneficiario}
        />
      </div>

      {/* 2. RESULTADOS EN EL DESARROLLO CURRICULAR */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700 leading-relaxed">
          ¿Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas dentro del proceso enseñanza-aprendizaje, qué logros o cambios se espera obtener en el desarrollo curricular? <span className="text-red-500">*</span>
        </label>

        <textarea
          className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b] transition-all resize-y"
          name="resultado_curricular"
          placeholder="Describa de forma detallada los logros o cambios en el desarrollo curricular..."
          value={data.resultado_curricular || ''}
          onChange={handleChangeResultadoCurricular}
        />
      </div>

    </div>
  );
}