import React from 'react';

export default function Objetivos({ data, updateData }) {
  
  // Manejador para el Objetivo General (texto simple)
  const handleGeneralChange = (e) => {
    updateData('obj_general', e.target.value);
  };

  // Manejadores para los Objetivos Específicos (arreglo)
  const handleEspecificoChange = (index, value) => {
    // Copiamos el arreglo actual (o creamos uno vacío si no existe)
    const nuevosEspecificos = [...(data.obj_especificos || [])];
    nuevosEspecificos[index] = value;
    updateData('obj_especificos', nuevosEspecificos);
  };

  const addEspecifico = () => {
    const nuevosEspecificos = [...(data.obj_especificos || []), ''];
    updateData('obj_especificos', nuevosEspecificos);
  };

  const removeEspecifico = (index) => {
    const nuevosEspecificos = [...(data.obj_especificos || [])];
    nuevosEspecificos.splice(index, 1);
    updateData('obj_especificos', nuevosEspecificos);
  };

  // Asegurarnos de que siempre sea un array para evitar errores al mapear
  const objetivosEspecificos = data.obj_especificos || [];

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IV.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Objetivos</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 4 de 9</span>
        </div>
      </div>

      {/* 1. OBJETIVO GENERAL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Objetivo General <span className="text-red-500">*</span>
        </label>
        <textarea 
          className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 resize-y" 
          name="obj_general" 
          placeholder="Redacte el objetivo general del proyecto..." 
          value={data.obj_general || ''} 
          onChange={handleGeneralChange} 
        />
      </div>

      {/* 2. OBJETIVOS ESPECÍFICOS */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-semibold text-slate-700">
            Objetivos Específicos
          </label>
          <button 
            type="button"
            onClick={addEspecifico}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            {/* Ícono Plus (+) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar Objetivo
          </button>
        </div>

        {/* LISTA DINÁMICA */}
        <div className="space-y-3">
          {objetivosEspecificos.map((objetivo, index) => (
            <div key={index} className="flex items-center gap-3">
              
              {/* Número (Cuadro Rosado) */}
              <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-md flex items-center justify-center border border-red-100">
                <span className="text-[#b1122b] font-bold text-sm">{index + 1}</span>
              </div>

              {/* Input */}
              <input 
                type="text"
                className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
                placeholder={`Objetivo específico ${index + 1}...`}
                value={objetivo}
                onChange={(e) => handleEspecificoChange(index, e.target.value)}
              />

              {/* Botón Eliminar (Basurero) */}
              <button 
                type="button"
                onClick={() => removeEspecifico(index)}
                className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none"
                title="Eliminar objetivo"
              >
                {/* Ícono Trash */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* Mensaje por si se eliminan todos */}
          {objetivosEspecificos.length === 0 && (
            <div className="text-center py-4 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-md">
              No hay objetivos específicos. Haz clic en "Agregar Objetivo" para comenzar.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}