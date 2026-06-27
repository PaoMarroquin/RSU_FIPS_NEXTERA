import React from "react";

export default function Financiamiento({ data, updateData }) {
  
  const financiamiento = data.financiamiento || {
    monto_financiamiento: "",
    fuente_financiamiento: "",
    descripcion_gastos: "",
    observaciones_financiamiento: "",
  };

  const handleChange = (field, value) => {
    updateData("financiamiento", {
      ...financiamiento,
      [field]: value,
    });
  };

  // Validación rápida local para el patrón string($decimal): ^-?\d{0,10}(?:\.\d{0,2})?$
  const handleMontoChange = (e) => {
    const val = e.target.value;
    // Permitimos que borre todo (vacío) o que cumpla la expresión regular decimal
    const regex = /^-?\d{0,10}(?:\.\d{0,2})?$/;
    
    if (val === "" || regex.test(val)) {
      handleChange("monto_financiamiento", val === "" ? null : val);
    }
  };

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IX.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">
            Financiamiento
          </h2>
          <span className="text-xs text-slate-500 block mt-0.5">
            Sección 9 de 9
          </span>
        </div>
      </div>

      {/* PRESUPUESTO Y FUENTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Presupuesto */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">
            Presupuesto Estimado Total (S/)
          </label>
          <input
            type="text" // Cambiado a text para controlar el formato string($decimal) limpiamente
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
            value={financiamiento.monto_financiamiento ?? ""}
            onChange={handleMontoChange}
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Máximo de 10 dígitos enteros y 2 decimales.
          </span>
        </div>

        {/* Fuente */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">
            Fuente de Financiamiento
          </label>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
            value={financiamiento.fuente_financiamiento ?? ""}
            onChange={(e) =>
              handleChange("fuente_financiamiento", e.target.value === "" ? null : e.target.value)
            }
          >
            <option value="">Seleccione una fuente</option>
            <option value="recursos_propios_unsa">Recursos Propios UNSA</option>
            <option value="cooperacion_externa">Cooperación externa</option>
            <option value="aporte_facultad">Aporte a la Facultad</option>
            <option value="autofinanciado">Autofinanciado</option>
          </select>
        </div>

      </div>

      {/* DESCRIPCIÓN DE GASTOS */}
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">
          Detalle de los rubros de gasto y su distribución
        </label>
        <textarea
          rows={5}
          placeholder="Detalle los rubros de gasto y su distribución..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all resize-none"
          value={financiamiento.descripcion_gastos ?? ""}
          onChange={(e) =>
            handleChange("descripcion_gastos", e.target.value === "" ? null : e.target.value)
          }
        />
      </div>

      {/* OBSERVACIONES */}
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">
          Observaciones adicionales sobre el financiamiento
        </label>
        <textarea
          rows={4}
          placeholder="Observaciones adicionales sobre el financiamiento..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all resize-none"
          value={financiamiento.observaciones_financiamiento ?? ""}
          onChange={(e) =>
            handleChange("observaciones_financiamiento", e.target.value === "" ? null : e.target.value)
          }
        />
      </div>

    </div>
  );
}