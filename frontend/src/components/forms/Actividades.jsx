import React from 'react';

export default function Actividades({ data, updateData }) {

  const actividades = data.actividades || [];

  // actualizar campo específico de una fila
  const handleChangeActividades = (index, field, value) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[index][field] = value;
    updateData('actividades', nuevasActividades);
  };

  // agregar fila
  const addActividad = () => {
    updateData('actividades', [
      ...actividades,
      {
        actividad: '',
        descripcion: '',
        curso: '',
        responsable: '',
        fecha: '',
        evidencia: '',
      }
    ]);
  };

  // eliminar fila
  const removeActividad = (index) => {
    const nuevasActividades = [...actividades];
    nuevasActividades.splice(index, 1);
    updateData('actividades', nuevasActividades);
  };

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">VI.</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">Actividades</h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              Sección 6 de 9
            </span>
          </div>
        </div>


        <button
        onClick={addActividad}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
        {/* Ícono Plus */}
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
            d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>

        Agregar Actividad
        </button>

      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          {/* HEADER */}
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b">
              <th className="p-2">ACTIVIDAD</th>
              <th className="p-2">DESCRIPCIÓN</th>
              <th className="p-2">CURSO</th>
              <th className="p-2">RESPONSABLE</th>
              <th className="p-2">FECHA</th>
              <th className="p-2">EVIDENCIA</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {actividades.map((item, index) => (
              <tr key={index} className="border-b">

                <td className="p-2">
                  <input
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    placeholder="Ej. Taller 1"
                    value={item.actividad}
                    onChange={(e) => handleChangeActividades(index, 'actividad', e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    placeholder="Descripción breve"
                    value={item.descripcion}
                    onChange={(e) => handleChangeActividades(index, 'descripcion', e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    placeholder="Asignatura"
                    value={item.curso}
                    onChange={(e) => handleChangeActividades(index, 'curso', e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    placeholder="Nombre"
                    value={item.responsable}
                    onChange={(e) => handleChangeActividades(index, 'responsable', e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    value={item.fecha}
                    onChange={(e) => handleChangeActividades(index, 'fecha', e.target.value)}
                  />
                </td>

                <td className="p-2">
                  <input
                    className="w-full border border-slate-300 rounded-md px-2 py-1"
                    placeholder="Fotos, listas..."
                    value={item.evidencia}
                    onChange={(e) => handleChangeActividades(index, 'evidencia', e.target.value)}
                  />
                </td>

                <td className="p-2 text-center">
                <button
                    type="button"
                    onClick={() => removeActividad(index)}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none"
                    title="Eliminar acción"
                >
                    {/* Ícono Trash */}
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
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
          </tbody>

        </table>
      </div>

    </div>
  );
}