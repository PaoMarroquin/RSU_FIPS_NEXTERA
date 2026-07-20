import React, { useEffect } from "react";

export default function Cronograma({ data, updateData }) {
  const cronogramas = data.cronogramas || [];

  // Asegura que al menos exista una acción vacía inicializada correctamente
  useEffect(() => {
    if (!data.cronogramas || data.cronogramas.length === 0) {
      updateData("cronogramas", [
        {
          descripcion: "",
          fecha_inicio: "",
          fecha_fin: "",
          responsable: "",
          estado_avance: "no_iniciado",
          orden: 1
        }
      ]);
    }
  }, []);

  const handleChangeCronograma = (index, field, value) => {
    const nuevoCronograma = [...cronogramas];
    nuevoCronograma[index][field] = value;
    nuevoCronograma[index]["orden"] = index + 1;
    updateData("cronogramas", nuevoCronograma);
  };

  const addAccion = () => {
    updateData("cronogramas", [
      ...cronogramas,
      {
        descripcion: "",
        fecha_inicio: "",
        fecha_fin: "",
        responsable: "",
        estado_avance: "no_iniciado",
        orden: cronogramas.length + 1
      },
    ]);
  };

  const removeAccion = (index) => {
    const nuevoCronograma = [...cronogramas];
    nuevoCronograma.splice(index, 1);
    const cronogramaReordenado = nuevoCronograma.map((item, idx) => ({
      ...item,
      orden: idx + 1
    }));
    updateData("cronogramas", cronogramaReordenado);
  };

  // Función de diagnóstico local en tiempo real
  const obtenerErrorFila = (item) => {
    if (!item.descripcion?.trim() || !item.fecha_inicio || !item.fecha_fin) {
      return "Faltan completar campos obligatorios.";
    }
    if (item.fecha_fin < item.fecha_inicio) {
      return "La fecha de fin no puede ser anterior a la de inicio.";
    }
    const fueraRangoGeneral =
      (data.fechaInicio && (item.fecha_inicio < data.fechaInicio || item.fecha_fin < data.fechaInicio)) ||
      (data.fechaTermino && (item.fecha_inicio > data.fechaTermino || item.fecha_fin > data.fechaTermino));

    if (fueraRangoGeneral) {
      return "Fechas fuera del rango general del proyecto.";
    }
    return null;
  };

  const tieneErroresFecha = cronogramas.some(item =>
    (item.fecha_inicio && item.fecha_fin && item.fecha_fin < item.fecha_inicio) ||
    (item.fecha_inicio && ((data.fechaInicio && item.fecha_inicio < data.fechaInicio) || (data.fechaTermino && item.fecha_inicio > data.fechaTermino))) ||
    (item.fecha_fin && ((data.fechaInicio && item.fecha_fin < data.fechaInicio) || (data.fechaTermino && item.fecha_fin > data.fechaTermino)))
  );
  const tieneCamposVacios = cronogramas.some(item => !item.descripcion?.trim() || !item.fecha_inicio || !item.fecha_fin);

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">VII.</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">Cronograma de Acciones</h2>
            <span className="text-xs text-slate-500 block mt-0.5">Sección 7 de 9</span>
          </div>
        </div>

        <button
          onClick={addAccion}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b1122b] text-white rounded-md text-xs font-semibold hover:bg-[#8f0e22] transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar Acción
        </button>
      </div>

      {/* ALERTAS VISUALES LOCALES */}
      {cronogramas.length > 0 && (tieneCamposVacios || tieneErroresFecha) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-700 animate-in fade-in slide-in-from-top-2">
          <p className="font-bold">⚠️ Por favor, corrige los siguientes problemas para asegurar el guardado en el servidor:</p>
          <ul className="list-disc list-inside ml-1 space-y-0.5 opacity-90">
            {tieneCamposVacios && <li>Hay filas con campos obligatorios vacíos (Descripción, Fecha Inicio o Fin).</li>}
            {tieneErroresFecha && <li>Las fechas no pueden cruzarse ni salirse del rango de Inicio y Termino del proyecto.</li>}
          </ul>
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3 w-1/12 text-center">N°</th>
              <th className="p-3 w-4/12">Acción / Descripción *</th>
              <th className="p-3 w-2/12">Fecha Inicio *</th>
              <th className="p-3 w-2/12">Fecha Fin *</th>
              <th className="p-3 w-2/12">Responsable</th>
              <th className="p-3 w-1/12 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {cronogramas.map((item, index) => {
              const errorFila = obtenerErrorFila(item);
              const esFechaInvalida = item.fecha_inicio && item.fecha_fin && item.fecha_fin < item.fecha_inicio;
              const esDescInvalida = !item.descripcion?.trim();
              const errorLocal = item.fecha_inicio && item.fecha_fin && item.fecha_fin < item.fecha_inicio;
              const inicioFueraRango = item.fecha_inicio && ((data.fechaInicio && item.fecha_inicio < data.fechaInicio) || (data.fechaTermino && item.fecha_inicio > data.fechaTermino));
              const finFueraRango = item.fecha_fin && ((data.fechaInicio && item.fecha_fin < data.fechaInicio) || (data.fechaTermino && item.fecha_fin > data.fechaTermino));

              return (
                <tr key={index} className={`transition-colors ${errorFila ? 'bg-red-50/10' : 'hover:bg-slate-50/50'}`}>

                  {/* Número de orden */}
                  <td className="p-2 text-center text-xs font-bold text-slate-400">
                    {item.orden || index + 1}
                  </td>

                  {/* Descripción */}
                  <td className="p-2">
                    <input
                      type="text"
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${esDescInvalida ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-[#b1122b]'
                        }`}
                      placeholder="Descripción de la acción..."
                      value={item.descripcion || ""}
                      onChange={(e) => handleChangeCronograma(index, "descripcion", e.target.value)}
                    />
                  </td>

                  {/* Fecha Inicio */}
                  <td className="p-2">
                    <input
                      type="date"
                      className={`w-full border rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${(!item.fecha_inicio || errorLocal || inicioFueraRango) ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-[#b1122b]'
                        }`}
                      value={item.fecha_inicio || ""}
                      min={data.fechaInicio || undefined}
                      max={item.fecha_fin || data.fechaTermino || undefined}
                      onChange={(e) => handleChangeCronograma(index, "fecha_inicio", e.target.value)}
                    />
                    {inicioFueraRango && (
                      <span className="text-[10px] text-red-600 block mt-0.5 font-medium">⚠️ Fuera de rango proyecto</span>
                    )}
                  </td>

                  {/* Fecha Fin */}
                  <td className="p-2">
                    <input
                      type="date"
                      className={`w-full border rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${(!item.fecha_fin || errorLocal || finFueraRango) ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-[#b1122b]'
                        }`}
                      value={item.fecha_fin || ""}
                      min={item.fecha_inicio || data.fechaInicio || undefined}
                      max={data.fechaTermino || undefined}
                      onChange={(e) => handleChangeCronograma(index, "fecha_fin", e.target.value)}
                    />
                    {errorLocal && (
                      <span className="text-[10px] text-red-600 block mt-0.5 font-medium">⚠️ Fin menor a Inicio</span>
                    )}
                    {finFueraRango && !errorLocal && (
                      <span className="text-[10px] text-red-600 block mt-0.5 font-medium">⚠️ Fuera de rango proyecto</span>
                    )}
                  </td>

                  {/* Responsable */}
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                      placeholder="Nombre o rol"
                      value={item.responsable || ""}
                      onChange={(e) => handleChangeCronograma(index, "responsable", e.target.value)}
                    />
                  </td>

                  {/* Eliminar */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeAccion(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none"
                      title="Eliminar acción"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}

            {cronogramas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-xs text-slate-400">
                  No hay acciones registradas en el cronograma. Presione "Agregar Acción" para iniciar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}