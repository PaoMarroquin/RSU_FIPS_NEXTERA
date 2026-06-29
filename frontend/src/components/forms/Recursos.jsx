import React, { useState, useEffect } from "react";

export default function Recursos({ data, updateData }) {
  // Ahora leemos los campos directamente desde la raíz del objeto 'data'
  // --- ESTADOS LOCALES PARA "OTROS RECURSOS HUMANOS" (Debe ser un Entero) ---
  const [hasHumOtros, setHasHumOtros] = useState(() => (data.rec_hum_otros ?? 0) > 0);
  const [listaHumOtros, setListaHumOtros] = useState(() => {
    const cantidadActual = data.rec_hum_otros ?? 0;
    return cantidadActual > 0 ? Array(cantidadActual).fill("") : [""];
  });

  // --- ESTADOS LOCALES PARA "OTROS MATERIALES" (Debe ser un String) ---
  const [hasMatOtros, setHasMatOtros] = useState(() => typeof data.rec_mat_otros === "string" && data.rec_mat_otros.trim() !== "");
  const [listaMatOtros, setListaMatOtros] = useState(() => {
    const dataActual = data.rec_mat_otros;
    if (dataActual && dataActual.trim() !== "") {
      return dataActual.split(", ");
    }
    return [""];
  });

  // --- EFECTO: Sincronizar "Otros Recursos Humanos" directamente a la raíz ---
  useEffect(() => {
    if (hasHumOtros) {
      updateData("rec_hum_otros", listaHumOtros.length);
    } else {
      updateData("rec_hum_otros", 0);
    }
  }, [listaHumOtros, hasHumOtros]);

  // --- EFECTO: Sincronizar "Otros Materiales" directamente a la raíz ---
  useEffect(() => {
    if (hasMatOtros) {
      const textoUnificado = listaMatOtros.filter(t => t.trim() !== "").join(", ");
      updateData("rec_mat_otros", textoUnificado || null);
    } else {
      updateData("rec_mat_otros", null);
    }
  }, [listaMatOtros, hasMatOtros]);

  const handleChange = (field, value) => {
    // Almacena el valor directamente en el campo de la raíz
    updateData(field, value);
  };

  // --- FUNCIONES DINÁMICAS: RECURSOS HUMANOS ---
  const handleInputChangeHumOtros = (index, value) => {
    const nuevaLista = [...listaHumOtros];
    nuevaLista[index] = value;
    setListaHumOtros(nuevaLista);
  };

  const eliminarCampoHumOtros = (index) => {
    if (listaHumOtros.length === 1) {
      setHasHumOtros(false);
      setListaHumOtros([""]);
    } else {
      setListaHumOtros(listaHumOtros.filter((_, i) => i !== index));
    }
  };

  // --- FUNCIONES DINÁMICAS: RECURSOS MATERIALES ---
  const handleInputChangeMatOtros = (index, value) => {
    const nuevaLista = [...listaMatOtros];
    nuevaLista[index] = value;
    setListaMatOtros(nuevaLista);
  };

  const eliminarCampoMatOtros = (index) => {
    if (listaMatOtros.length === 1) {
      setHasMatOtros(false);
      setListaMatOtros([""]);
    } else {
      setListaMatOtros(listaMatOtros.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">VIII.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Recursos</h2>
          <span className="text-xs text-slate-500 block mt-0.5">Sección 8 de 9</span>
        </div>
      </div>

      {/* RECURSOS HUMANOS */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">
          Recursos Humanos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-600 block mb-1">Docentes</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              value={data.rec_hum_docentes ?? 0}
              onChange={(e) => handleChange("rec_hum_docentes", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Administrativos</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              value={data.rec_hum_administrativos ?? 0}
              onChange={(e) => handleChange("rec_hum_administrativos", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Estudiantes</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              value={data.rec_hum_estudiantes ?? 0}
              onChange={(e) => handleChange("rec_hum_estudiantes", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Egresados</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              value={data.rec_hum_egresados ?? 0}
              onChange={(e) => handleChange("rec_hum_egresados", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Voluntarios</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              value={data.rec_hum_voluntarios ?? 0}
              onChange={(e) => handleChange("rec_hum_voluntarios", Number(e.target.value))}
            />
          </div>

          {/* CHECKBOX: OTROS RECURSOS HUMANOS */}
          <div className="flex flex-col justify-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#b1122b] border-slate-300 rounded focus:ring-[#b1122b]"
                checked={hasHumOtros}
                onChange={(e) => {
                  setHasHumOtros(e.target.checked);
                  if (e.target.checked && listaHumOtros.length === 0) setListaHumOtros([""]);
                }}
              />
              ¿Otros recursos humanos?
            </label>
          </div>
        </div>

        {/* INPUTS DINÁMICOS: OTROS RECURSOS HUMANOS */}
        {hasHumOtros && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Detalle otros R.H. (Total: {listaHumOtros.length})</span>
              <button
                type="button"
                onClick={() => setListaHumOtros([...listaHumOtros, ""])}
                className="inline-flex items-center gap-1 bg-[#b1122b] text-white text-xs px-2.5 py-1 rounded-md hover:bg-[#8f0e22]"
              >
                + Añadir otro
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaHumOtros.map((valor, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-700 outline-none"
                    placeholder={`Descripción del rol u otro recurso #${index + 1}...`}
                    value={valor}
                    onChange={(e) => handleInputChangeHumOtros(index, e.target.value)}
                  />
                  <button type="button" onClick={() => eliminarCampoHumOtros(index)} className="text-xs text-red-500 font-bold px-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RECURSOS MATERIALES */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">
          Recursos Materiales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-600 block mb-1">Material Didáctico</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              placeholder="Detalle del material didáctico..."
              value={data.rec_mat_material_didactico ?? ""}
              onChange={(e) => handleChange("rec_mat_material_didactico", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Afiches</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              placeholder="Detalle de afiches..."
              value={data.rec_mat_afiches ?? ""}
              onChange={(e) => handleChange("rec_mat_afiches", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Equipos</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              placeholder="Detalle de equipos..."
              value={data.rec_mat_equipos ?? ""}
              onChange={(e) => handleChange("rec_mat_equipos", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Útiles</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b]"
              placeholder="Detalle de útiles..."
              value={data.rec_mat_utiles ?? ""}
              onChange={(e) => handleChange("rec_mat_utiles", e.target.value)}
            />
          </div>

          {/* CHECKBOX: OTROS MATERIALES */}
          <div className="md:col-span-2 flex items-center pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#b1122b] border-slate-300 rounded focus:ring-[#b1122b]"
                checked={hasMatOtros}
                onChange={(e) => {
                  setHasMatOtros(e.target.checked);
                  if (e.target.checked && listaMatOtros.length === 0) setListaMatOtros([""]);
                }}
              />
              ¿Otros materiales adicionales?
            </label>
          </div>
        </div>

        {/* INPUTS DINÁMICOS: OTROS MATERIALES */}
        {hasMatOtros && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Detalle otros materiales</span>
              <button
                type="button"
                onClick={() => setListaMatOtros([...listaMatOtros, ""])}
                className="inline-flex items-center gap-1 bg-[#b1122b] text-white text-xs px-2.5 py-1 rounded-md hover:bg-[#8f0e22]"
              >
                + Añadir otro material
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listaMatOtros.map((valor, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-700 outline-none"
                    placeholder={`Nombre del material adicional #${index + 1}...`}
                    value={valor}
                    onChange={(e) => handleInputChangeMatOtros(index, e.target.value)}
                  />
                  <button type="button" onClick={() => eliminarCampoMatOtros(index)} className="text-xs text-red-500 font-bold px-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}