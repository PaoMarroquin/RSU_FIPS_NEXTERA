import React, { useEffect } from "react";

export default function Cronograma({ data, updateData }) {
  // 1. Ajuste al plural 'cronogramas' según la definición del Serializer
  const cronogramas = data.cronogramas || [];

  // Asegura que al menos exista una fila vacía si el usuario entra por primera vez
  useEffect(() => {
    if (!data.cronogramas || data.cronogramas.length === 0) {
      updateData("cronogramas", [
        {
          accion: "",
          fecha_inicio: "", // 2. Ajuste a snake_case para Django
          fecha_fin: "",    // 2. Ajuste a snake_case para Django
          responsable: "",
          estado: "No iniciado",
        }
      ]);
    }
  }, []);

  const handleChangeCronograma = (index, field, value) => {
    const nuevoCronograma = [...cronogramas];
    nuevoCronograma[index][field] = value;
    updateData("cronogramas", nuevoCronograma);
  };

  const addAccion = () => {
    updateData("cronogramas", [
      ...cronogramas,
      {
        accion: "",
        fecha_inicio: "",
        fecha_fin: "",
        responsable: "",
        estado: "No iniciado",
      },
    ]);
  };

  const removeAccion = (index) => {
    const nuevoCronograma = [...cronogramas];
    nuevoCronograma.splice(index, 1);
    updateData("cronogramas", nuevoCronograma);
  };

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">VII.</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">
              Cronograma
            </h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              Sección 7 de 9
            </span>
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

      <p className="text-xs text-slate-500">
        Distribuya de forma cronológica las acciones principales a lo largo del período estimado de ejecución del proyecto.
      </p>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3 w-5/12">Acción / Actividad</th>
              <th className="p-3 w-2/12">Fecha Inicio</th>
              <th className="p-3 w-2/12">Fecha Fin</th>
              <th className="p-3 w-2/12">Responsable</th>
              <th className="p-3 w-2/12">Estado</th>
              <th className="p-3 w-1/12 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {cronogramas.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                
                {/* Acción */}
                <td className="p-2">
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                    placeholder="Ej. Coordinación inicial, Compra de insumos..."
                    value={item.accion || ""}
                    onChange={(e) => handleChangeCronograma(index, "accion", e.target.value)}
                  />
                </td>

                {/* Fecha Inicio */}
                <td className="p-2">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                    value={item.fecha_inicio || ""}
                    onChange={(e) => handleChangeCronograma(index, "fecha_inicio", e.target.value)}
                  />
                </td>

                {/* Fecha Fin */}
                <td className="p-2">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                    value={item.fecha_fin || ""}
                    onChange={(e) => handleChangeCronograma(index, "fecha_fin", e.target.value)}
                  />
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

                {/* Estado */}
                <td className="p-2">
                  <select
                    className="w-full border border-slate-300 bg-white rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                    value={item.estado || "No iniciado"}
                    onChange={(e) => handleChangeCronograma(index, "estado", e.target.value)}
                  >
                    <option value="No iniciado">No iniciado</option>
                    <option value="Pendiente">En proceso</option>
                    <option value="Terminado">Terminado</option>
                  </select>
                </td>

                {/* Eliminar */}
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeAccion(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none"
                    title="Eliminar acción"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}

            {cronogramas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-xs text-slate-400">
                  No hay acciones registradas en el cronograma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}