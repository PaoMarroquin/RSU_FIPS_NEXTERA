import React, { useState } from 'react';

const OPCIONES_PREDEFINIDAS = [
  "Comunidad universitaria – interna",
  "Instituciones Educativas Básico Regulares",
  "Instituciones Educativas Especiales",
  "Gobierno Local, Regional, Nacional",
  "Asociaciones",
  "Organizaciones comunales",
  "Sector empresarial",
  "Sectores laborales",
  "Centros Penitenciarios"
];

export default function BeneficiariosSelector({ value, onChange }) {
  const isCustomValue = value && !OPCIONES_PREDEFINIDAS.includes(value);
  
  const [selectValue, setSelectValue] = useState(isCustomValue ? "Otro" : (value || ""));
  const [customValue, setCustomValue] = useState(isCustomValue ? value : "");

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectValue(val);
    
    if (val !== "Otro") {
      setCustomValue("");
      onChange({ target: { name: "beneficiarios", value: val } });
    } else {
      onChange({ target: { name: "beneficiarios", value: customValue } });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCustomValue(val);
    onChange({ target: { name: "beneficiarios", value: val } });
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/2">
      <label className="text-xs font-semibold text-slate-600">
        Beneficiario / Destinatario Principal <span className="text-red-500">*</span>
      </label>
      
      <select 
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all cursor-pointer"
        value={selectValue}
        onChange={handleSelectChange}
      >
        <option value="" disabled>Seleccione una opción...</option>
        {OPCIONES_PREDEFINIDAS.map(opcion => (
          <option key={opcion} value={opcion}>{opcion}</option>
        ))}
        <option value="Otro">Otro (Especificar)</option>
      </select>

      {selectValue === "Otro" && (
        <div className="animate-in fade-in slide-in-from-top-2 mt-1">
          <input 
            type="text"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
            placeholder="Especifique el beneficiario aquí..."
            value={customValue}
            onChange={handleInputChange}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}