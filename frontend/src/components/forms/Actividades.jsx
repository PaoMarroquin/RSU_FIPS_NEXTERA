import React, { useEffect } from 'react';

export default function Actividades({ data, updateData }) {
  const actividades = data.actividades || [];

  // Asegura que al menos exista una actividad vacía alineada al backend
  useEffect(() => {
    if (!data.actividades || data.actividades.length === 0) {
      updateData('actividades', [
        {
          nombre: '',             // Clave exacta requerida por el backend ('nombre')
          descripcion: '',
          responsable: '',
          fecha: '',
          evidencia_esperada: '', // Clave estandarizada del backend
          orden: 1
        }
      ]);
    }
  }, []);

  const handleChangeActividades = (index, field, value) => {
    const nuevasActividades = [...actividades];
    nuevasActividades[index][field] = value;
    nuevasActividades[index]['orden'] = index + 1;
    updateData('actividades', nuevasActividades);
  };

  const addActividad = () => {
    updateData('actividades', [
      ...actividades,
      {
        nombre: '',
        descripcion: '',
        responsable: '',
        fecha: '',
        evidencia_esperada: '',
        orden: actividades.length + 1
      }
    ]);
  };

  const removeActividad = (index) => {
    const nuevasActividades = [...actividades];
    nuevasActividades.splice(index, 1);
    // Reordenación en tiempo real para evitar que falle la secuencia en Django
    const actividadesReordenadas = nuevasActividades.map((act, idx) => ({
      ...act,
      orden: idx + 1
    }));
    updateData('actividades', actividadesReordenadas);
  };

  // Validación local preventiva antes del submit
  const tieneCamposVacios = actividades.some(act => !act.nombre?.trim());

  return (
    <div className="space-y-6 transition-all duration-300">

      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#b1122b]">VI.</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 m-0">Actividades del Proyecto</h2>
            <span className="text-xs text-slate-500 block mt-0.5">
              Sección 6 de 9
            </span>
          </div>
        </div>

        <button
          onClick={addActividad}
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
          Agregar Actividad
        </button>
      </div>

      {/* ALERTA DE VALIDACIÓN VISUAL */}
      {actividades.length > 0 && tieneCamposVacios && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-in fade-in slide-in-from-top-2">
          <p className="font-bold">⚠️ El título o nombre de la actividad es obligatorio para procesar el envío al servidor.</p>
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3 w-1/12 text-center">N°</th>
              <th className="p-3 w-3/12">Actividad *</th>
              <th className="p-3 w-3/12">Descripción</th>
              <th className="p-3 w-2/12">Responsable</th>
              <th className="p-3 w-1.5/12">Fecha</th>
              <th className="p-3 w-1.5/12">Evidencia Esperada</th>
              <th className="p-3 w-0.5/12 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {actividades.map((item, index) => {
              const esNombreInvalido = !item.nombre?.trim();

              return (
                <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${esNombreInvalido ? 'bg-red-50/10' : ''}`}>
                  
                  {/* Número de orden */}
                  <td className="p-2 text-center text-xs font-bold text-slate-400">
                    {item.orden || index + 1}
                  </td>

                  {/* Nombre de Actividad */}
                  <td className="p-2">
                    <input
                      type="text"
                      className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${
                        esNombreInvalido 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-slate-300 focus:border-[#b1122b]'
                      }`}
                      placeholder="Ej. Taller de capacitación *"
                      value={item.nombre || ""}
                      onChange={(e) => handleChangeActividades(index, 'nombre', e.target.value)}
                    />
                  </td>

                  {/* Descripción */}
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                      placeholder="Breve descripción..."
                      value={item.descripcion || ""}
                      onChange={(e) => handleChangeActividades(index, 'descripcion', e.target.value)}
                    />
                  </td>

                  {/* Responsable */}
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                      placeholder="Docente / Coordinador"
                      value={item.responsable || ""}
                      onChange={(e) => handleChangeActividades(index, 'responsable', e.target.value)}
                    />
                  </td>

                  {/* Fecha */}
                  <td className="p-2">
                    <input
                      type="date"
                      className={`w-full border rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 ${
                        (item.fecha && ((data.fechaInicio && item.fecha < data.fechaInicio) || (data.fechaTermino && item.fecha > data.fechaTermino)))
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-300 focus:border-[#b1122b]'
                      }`}
                      value={item.fecha || ""}
                      min={data.fechaInicio || undefined}
                      max={data.fechaTermino || undefined}
                      onChange={(e) => handleChangeActividades(index, 'fecha', e.target.value)}
                    />
                    {(item.fecha && ((data.fechaInicio && item.fecha < data.fechaInicio) || (data.fechaTermino && item.fecha > data.fechaTermino))) && (
                      <span className="text-[10px] text-red-600 block mt-0.5 font-medium">⚠️ Fuera de rango</span>
                    )}
                  </td>

                  {/* Evidencia */}
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#b1122b]"
                      placeholder="Ej. Fotos, lista de asistencia"
                      value={item.evidencia_esperada || ""}
                      onChange={(e) => handleChangeActividades(index, 'evidencia_esperada', e.target.value)}
                    />
                  </td>

                  {/* Eliminar Fila */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeActividad(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none"
                      title="Eliminar actividad"
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
              );
            })}

            {actividades.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-xs text-slate-400">
                  No hay actividades registradas aún. Presione "Agregar Actividad".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}