import React, { useState, useEffect } from "react";

export default function Financiamiento({ data, updateData }) {
  // Recuperamos la lista de fuentes desde el estado global del formulario
  const fuentesGuardadas = data.fuentes_financiamiento || [];

  // --- ESTADO LOCAL ESTRUCTURADO ---
  const [listaFuentes, setListaFuentes] = useState(() => {
    return fuentesGuardadas.length > 0
      ? fuentesGuardadas
      : [
          {
            id: null, // ID de la base de datos (null si es nueva)
            fuente_financiamiento: "", 
            monto_financiamiento: "",   
            descripcion_fuente: "",     
            partidas: [
              { 
                id: null, // ID de la partida (null si es nueva)
                categoria: "", 
                tipo_recurso: "material", // Valor por defecto
                descripcion: "", 
                unidad: "Unidad", 
                cantidad: 1, 
                costo_unitario: "" 
              }
            ]
          }
        ];
  });

  // Sincroniza automáticamente cualquier cambio local con el hook useFormRSU
  useEffect(() => {
    updateData("fuentes_financiamiento", listaFuentes);
  }, [listaFuentes]);

  // --- MANEJADORES PARA FUENTES (PADRE) ---
  const agregarFuente = () => {
    setListaFuentes([
      ...listaFuentes,
      {
        id: null,
        fuente_financiamiento: "",
        monto_financiamiento: "",
        descripcion_fuente: "",
        partidas: [{ id: null, categoria: "", tipo_recurso: "material", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" }]
      }
    ]);
  };

  const eliminarFuente = (fIndex) => {
    if (listaFuentes.length === 1) {
      // Si es la última, reiniciamos a una vacía en lugar de dejar el arreglo en cero
      setListaFuentes([
        {
          id: null,
          fuente_financiamiento: "",
          monto_financiamiento: "",
          descripcion_fuente: "",
          partidas: [{ id: null, categoria: "", tipo_recurso: "material", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" }]
        }
      ]);
    } else {
      setListaFuentes(listaFuentes.filter((_, i) => i !== fIndex));
    }
  };

  const handleFuenteChange = (fIndex, field, value) => {
    const nuevasFuentes = [...listaFuentes];
    
    // Validación básica para evitar letras en el monto del financiamiento
    if (field === "monto_financiamiento") {
      const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
      if (value !== "" && !regex.test(value)) return;
    }
    
    nuevasFuentes[fIndex][field] = value;
    setListaFuentes(nuevasFuentes);
  };

  // --- MANEJADORES PARA PARTIDAS (HIJO) ---
  const agregarPartida = (fIndex) => {
    const nuevasFuentes = [...listaFuentes];
    nuevasFuentes[fIndex].partidas.push({
      id: null,
      categoria: "",
      tipo_recurso: "material",
      descripcion: "",
      unidad: "Unidad",
      cantidad: 1,
      costo_unitario: ""
    });
    setListaFuentes(nuevasFuentes);
  };

  const eliminarPartida = (fIndex, pIndex) => {
    const nuevasFuentes = [...listaFuentes];
    const partidas = nuevasFuentes[fIndex].partidas;
    
    if (partidas.length === 1) {
      partidas[0] = { id: null, categoria: "", tipo_recurso: "material", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" };
    } else {
      nuevasFuentes[fIndex].partidas = partidas.filter((_, i) => i !== pIndex);
    }
    setListaFuentes(nuevasFuentes);
  };

  const handlePartidaChange = (fIndex, pIndex, field, value) => {
    const nuevasFuentes = [...listaFuentes];
    const partida = nuevasFuentes[fIndex].partidas[pIndex];

    // Validación básica para evitar letras en el costo unitario
    if (field === "costo_unitario") {
      const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
      if (value !== "" && !regex.test(value)) return;
    }

    if (field === "cantidad") {
      const parsed = parseInt(value, 10);
      partida[field] = isNaN(parsed) ? "" : parsed;
    } else {
      partida[field] = value;
    }

    setListaFuentes(nuevasFuentes);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      
      {/* SECCIÓN CABECERA */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IX.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Financiamiento y Presupuesto</h2>
          <span className="text-xs text-slate-500 block mt-0.5">
            Maneje de manera dinámica el presupuesto asignado. Cada partida de gasto debe estar amarrada a una fuente de origen específica.
          </span>
        </div>
      </div>

      {/* CONTROL PRINCIPAL */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuentes de Financiamiento</span>
        <button
          type="button"
          onClick={agregarFuente}
          className="bg-[#b1122b] text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-[#8f0e22] transition-colors shadow-sm"
        >
          + Añadir Fuente de Financiamiento
        </button>
      </div>

      {/* ITERACIÓN DE FUENTES (PADRE) */}
      {listaFuentes.map((fuente, fIndex) => {
        // Cálculo del total acumulado por las partidas de esta fuente
        const totalPartidasFuente = fuente.partidas.reduce(
          (sum, p) => sum + Number(p.cantidad || 0) * Number(p.costo_unitario || 0),
          0
        );

        return (
          <div key={fIndex} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-[#b1122b]">
            
            {/* PANEL SUPERIOR: CONFIGURACIÓN DE LA FUENTE */}
            <div className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#b1122b] bg-[#b1122b]/10 px-2 py-0.5 rounded">
                  Origen de Fondo #{fIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarFuente(fIndex)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  ✕ Eliminar esta Fuente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Tipo de Fuente</label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b] focus:border-[#b1122b]"
                    value={fuente.fuente_financiamiento}
                    onChange={(e) => handleFuenteChange(fIndex, "fuente_financiamiento", e.target.value)}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="recursos_propios_unsa">Recursos Propios UNSA</option>
                    <option value="cooperacion_externa">Cooperación Externa</option>
                    <option value="aporte_facultad">Aporte de la Facultad</option>
                    <option value="autofinanciado">Autofinanciado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Monto Asignado Teórico (S/)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b] focus:border-[#b1122b]"
                    value={fuente.monto_financiamiento}
                    onChange={(e) => handleFuenteChange(fIndex, "monto_financiamiento", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Descripción / Observaciones</label>
                  <input
                    type="text"
                    placeholder="Detalles sobre este desembolso..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b] focus:border-[#b1122b]"
                    value={fuente.descripcion_fuente}
                    onChange={(e) => handleFuenteChange(fIndex, "descripcion_fuente", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* PANEL INFERIOR: CONTROL DE PARTIDAS VINCULADAS (HIJO) */}
            <div className="p-4 bg-slate-50/20 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Partidas Presupuestarias del Gasto
                </h4>
                <button
                  type="button"
                  onClick={() => agregarPartida(fIndex)}
                  className="text-[#b1122b] hover:text-[#8f0e22] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  + Vincular Partida de Gasto
                </button>
              </div>

              {/* LISTADO DE PARTIDAS */}
              <div className="space-y-2">
                {fuente.partidas.map((partida, pIndex) => (
                  <div key={pIndex} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    

                    {/* Categoría */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">Categoría</label>
                      <select
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 bg-white text-slate-600 focus:border-[#b1122b] outline-none"
                        value={partida.categoria}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "categoria", e.target.value)}
                      >
                        <option value="">Seleccione Categoría</option>
                        <option value="material_escritorio">Material de escritorio</option>
                        <option value="refrigerio">Refrigerio</option>
                        <option value="transporte">Transporte</option>
                        <option value="otros">Otros</option>
                      </select>
                    </div>

                    {/* Tipo Recurso */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">Tipo Recurso</label>
                      <select
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 bg-white text-slate-600 focus:border-[#b1122b] outline-none"
                        value={partida.tipo_recurso}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "tipo_recurso", e.target.value)}
                      >
                        <option value="material">Material</option>
                        <option value="humano">Humano</option>
                        <option value="financiero">Financiero</option>
                      </select>
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">Descripción</label>
                      <input
                        type="text"
                        placeholder="Nombre / Descripción del gasto..."
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 focus:border-[#b1122b] outline-none"
                        value={partida.descripcion}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "descripcion", e.target.value)}
                      />
                    </div>

                    {/* Unidad de Medida */}
                    <div className="md:col-span-1">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">U.M.</label>
                      <input
                        type="text"
                        placeholder="Unidad"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 focus:border-[#b1122b] outline-none text-center"
                        value={partida.unidad}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "unidad", e.target.value)}
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="md:col-span-1">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 focus:border-[#b1122b] outline-none text-center"
                        value={partida.cantidad}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "cantidad", e.target.value)}
                      />
                    </div>

                    {/* Costo Unitario */}
                    <div className="md:col-span-1.5">
                      <label className="text-[10px] text-slate-400 block md:hidden mb-0.5">Costo Unitario</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="S/ 0.00"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-2 focus:border-[#b1122b] outline-none text-right font-mono"
                        value={partida.costo_unitario}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "costo_unitario", e.target.value)}
                      />
                    </div>

                    {/* Eliminar Fila Partida */}
                    <div className="md:col-span-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarPartida(fIndex, pIndex)}
                        className="text-slate-400 hover:text-red-500 font-bold text-sm transition-colors p-1"
                        title="Remover Partida"
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* BARRA DE TOTALES INFERIOR */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[11px] font-medium px-1 pt-2 border-t border-slate-100 mt-2">
                <span className="text-slate-700 bg-slate-200 px-2 py-1 rounded">
                  Monto Ejecutado en Partidas: <strong className="font-mono text-xs">S/ {totalPartidasFuente.toFixed(2)}</strong>
                </span>
                
                {fuente.monto_financiamiento && Number(fuente.monto_financiamiento) !== totalPartidasFuente && (
                  <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 font-normal animate-pulse">
                     Alerta: El total de partidas difiere del monto asignado teórico (S/ {Number(fuente.monto_financiamiento).toFixed(2)})
                  </span>
                )}
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
}