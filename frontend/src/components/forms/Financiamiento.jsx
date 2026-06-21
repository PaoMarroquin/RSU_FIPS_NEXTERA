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
            <span className="text-red-500"> *</span>
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
            value={financiamiento.monto_financiamiento || ""}
            onChange={(e) =>
              handleChange("monto_financiamiento", e.target.value)
            }
          />
        </div>

        {/* Fuente */}
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1">
            Fuente de Financiamiento
            <span className="text-red-500"> *</span>
          </label>

          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all"
            value={financiamiento.fuente_financiamiento || ""}
            onChange={(e) =>
              handleChange("fuente_financiamiento", e.target.value)
            }
          >
            <option value="">
              Seleccione una fuente
            </option>

            <option value="recursos_propios_unsa">
              Recursos Propios UNSA
            </option>

            <option value="cooperacion_externa">
              Cooperación externa
            </option>

            <option value="aporte_facultad">
              Aporte a la Facultad
            </option>

            <option value="autofinanciado">
              Autofinanciado
            </option>
          </select>
        </div>

      </div>

      {/* DESCRIPCIÓN DE GASTOS */}
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">
          Descripción de Gastos
          <span className="text-red-500"> *</span>
        </label>

        <textarea
          rows={5}
          placeholder="Detalle los rubros de gasto y su distribución..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all resize-none"
          value={financiamiento.descripcion_gastos || ""}
          onChange={(e) =>
            handleChange("descripcion_gastos", e.target.value)
          }
        />
      </div>

      {/* OBSERVACIONES */}
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1">
          Observaciones
        </label>

        <textarea
          rows={4}
          placeholder="Observaciones adicionales sobre el financiamiento..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all resize-none"
          value={financiamiento.observaciones_financiamiento || ""}
          onChange={(e) =>
            handleChange("observaciones_financiamiento", e.target.value)
          }
        />
      </div>

    </div>
  );
}