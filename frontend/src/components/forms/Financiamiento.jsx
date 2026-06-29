import React, { useState, useEffect } from "react";

export default function Financiamiento({ data, updateData }) {
  // Intentamos recuperar fuentes previas del estado global; si no existen, inicializamos una limpia
  const fuentesGuardadas = data.fuentes_financiamiento || [];

  // --- ESTADO LOCAL ESTRUCTURADO ---
  const [listaFuentes, setListaFuentes] = useState(() => {
    return fuentesGuardadas.length > 0
      ? fuentesGuardadas
      : [
          {
            fuente_financiamiento: "", // ej: "recursos_propios_unsa", "aporte_facultad"
            monto_financiamiento: "",   // Presupuesto asignado por esta fuente
            descripcion_fuente: "",     // Detalles o notas de esta fuente específica
            partidas: [
              { 
                categoria: "", 
                tipo_recurso: "", 
                descripcion: "", 
                unidad: "Unidad", 
                cantidad: 1, 
                costo_unitario: "" 
              }
            ]
          }
        ];
  });

  // Sincroniza automáticamente cualquier cambio local con el estado global raíz del formulario
  useEffect(() => {
    updateData("fuentes_financiamiento", listaFuentes);
  }, [listaFuentes]);

  // --- MANEJADORES PARA FUENTES (PADRE) ---
  const agregarFuente = () => {
    setListaFuentes([
      ...listaFuentes,
      {
        fuente_financiamiento: "",
        monto_financiamiento: "",
        descripcion_fuente: "",
        partidas: [{ categoria: "", tipo_recurso: "", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" }]
      }
    ]);
  };

  const eliminarFuente = (fIndex) => {
    if (listaFuentes.length === 1) {
      // Si es la última, solo la reseteamos para no dejar la UI vacía
      setListaFuentes([
        {
          fuente_financiamiento: "",
          monto_financiamiento: "",
          descripcion_fuente: "",
          partidas: [{ categoria: "", tipo_recurso: "", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" }]
        }
      ]);
    } else {
      setListaFuentes(listaFuentes.filter((_, i) => i !== fIndex));
    }
  };

  const handleFuenteChange = (fIndex, field, value) => {
    const nuevasFuentes = [...listaFuentes];
    
    // Controlar que el monto de la fuente sea un formato decimal válido antes de asignarlo
    if (field === "monto_financiamiento") {
      const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
      if (value !== "" && !regex.test(value)) return;
    }
    
    nuevasFuentes[fIndex][field] = value;
    setListaFuentes(nuevasFuentes);
  };

  // --- MANEJADORES PARA PARTIDAS (HIJO - DENTRO DE UNA FUENTE) ---
  const agregarPartida = (fIndex) => {
    const nuevasFuentes = [...listaFuentes];
    nuevasFuentes[fIndex].partidas.push({
      categoria: "",
      tipo_recurso: "",
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
      partidas[0] = { categoria: "", tipo_recurso: "", descripcion: "", unidad: "Unidad", cantidad: 1, costo_unitario: "" };
    } else {
      nuevasFuentes[fIndex].partidas = partidas.filter((_, i) => i !== pIndex);
    }
    setListaFuentes(nuevasFuentes);
  };

  const handlePartidaChange = (fIndex, pIndex, field, value) => {
    const nuevasFuentes = [...listaFuentes];
    const partida = nuevasFuentes[fIndex].partidas[pIndex];

    // Validación intermedia para el costo unitario de la partida
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
    <div className="space-y-6 transition-all duration-300">
      
      {/* CABECERA DE SECCIÓN */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="text-2xl font-bold text-[#b1122b]">IX.</span>
        <div>
          <h2 className="text-xl font-semibold text-slate-800 m-0">Financiamiento y Presupuesto</h2>
          <span className="text-xs text-slate-500 block mt-0.5">
            Especifique las fuentes de financiamiento del proyecto y desglose sus partidas presupuestarias individuales.
          </span>
        </div>
      </div>

      {/* BOTÓN AGREGAR FUENTE PRINCIPAL */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuentes de Financiamiento</span>
        <button
          type="button"
          onClick={agregarFuente}
          className="bg-[#b1122b] text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#8f0e22] transition-colors shadow-sm"
        >
          + Añadir Fuente de Financiamiento
        </button>
      </div>

      {/* ITERACIÓN DE FUENTES */}
      {listaFuentes.map((fuente, fIndex) => {
        // Cálculo dinámico del subtotal acumulado por las partidas de esta fuente
        const totalPartidasFuente = fuente.partidas.reduce(
          (sum, p) => sum + Number(p.cantidad || 0) * Number(p.costo_unitario || 0),
          0
        );

        return (
          <div key={fIndex} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            
            {/* ENCABEZADO DE FUENTE (DATOS PADRE) */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#b1122b] bg-[#b1122b]/10 px-2 py-0.5 rounded">
                  Fuente #{fIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarFuente(fIndex)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  ✕ Quitar Fuente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Origen del Financiamiento</label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b]"
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
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto Asignado por esta Fuente (S/)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b]"
                    value={fuente.monto_financiamiento}
                    onChange={(e) => handleFuenteChange(fIndex, "monto_financiamiento", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Breve Descripción / Destino</label>
                  <input
                    type="text"
                    placeholder="Ej. Para pasajes y materiales de campo..."
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-[#b1122b]"
                    value={fuente.descripcion_fuente}
                    onChange={(e) => handleFuenteChange(fIndex, "descripcion_fuente", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN DE PARTIDAS (DATOS HIJO VINCULADOS A ESTA FUENTE) */}
            <div className="p-4 bg-slate-50/30 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Desglose de Partidas de esta Fuente
                </h4>
                <button
                  type="button"
                  onClick={() => agregarPartida(fIndex)}
                  className="text-[#b1122b] hover:text-[#8f0e22] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  + Vincular Partida
                </button>
              </div>

              {/* LISTA DE PARTIDAS DINÁMICAS */}
              <div className="space-y-2">
                {fuente.partidas.map((partida, pIndex) => (
                  <div key={pIndex} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    
                    {/* Categoría / Rubro */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block md:hidden">Categoría</label>
                      <input
                        type="text"
                        placeholder="Categoría (Ej: Transporte, Refrigerio)"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-[#b1122b] outline-none"
                        value={partida.categoria}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "categoria", e.target.value)}
                      />
                    </div>

                    {/* Tipo de Recurso */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block md:hidden">Tipo Recurso</label>
                      <select
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 bg-white text-slate-600 focus:border-[#b1122b] outline-none"
                        value={partida.tipo_recurso}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "tipo_recurso", e.target.value)}
                      >
                        <option value="">Tipo Recurso</option>
                        <option value="humano">Humano</option>
                        <option value="material">Material</option>
                        <option value="financiero">Financiero</option>
                      </select>
                    </div>

                    {/* Descripción Detallada */}
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block md:hidden">Descripción</label>
                      <input
                        type="text"
                        placeholder="Descripción específica..."
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-[#b1122b] outline-none"
                        value={partida.descripcion}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "descripcion", e.target.value)}
                      />
                    </div>

                    {/* Unidad de Medida */}
                    <div className="md:col-span-1.5">
                      <label className="text-[10px] text-slate-400 block md:hidden">Unidad</label>
                      <input
                        type="text"
                        placeholder="U.M. (Ej: Global)"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-[#b1122b] outline-none"
                        value={partida.unidad}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "unidad", e.target.value)}
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="md:col-span-1">
                      <label className="text-[10px] text-slate-400 block md:hidden">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-[#b1122b] outline-none"
                        value={partida.cantidad}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "cantidad", e.target.value)}
                      />
                    </div>

                    {/* Costo Unitario */}
                    <div className="md:col-span-1.5">
                      <label className="text-[10px] text-slate-400 block md:hidden">Costo Unit.</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="S/ Costo"
                        className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-[#b1122b] outline-none"
                        value={partida.costo_unitario}
                        onChange={(e) => handlePartidaChange(fIndex, pIndex, "costo_unitario", e.target.value)}
                      />
                    </div>

                    {/* Botón de Remover Partida Única */}
                    <div className="md:col-span-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarPartida(fIndex, pIndex)}
                        className="text-slate-300 hover:text-red-500 font-bold text-sm transition-colors"
                        title="Quitar esta partida"
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* PIE DE LA FUENTE: ALERTAS Y BALANCE INFORMATIVO */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[11px] font-medium px-1 pt-1">
                <span className="text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded">
                  Subtotal calculado en partidas: S/ {totalPartidasFuente.toFixed(2)}
                </span>
                
                {/* Alerta si las partidas no coinciden con el presupuesto total asignado */}
                {fuente.monto_financiamiento && Number(fuente.monto_financiamiento) !== totalPartidasFuente && (
                  <span className="text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 font-normal">
                    ⚠ La suma de las partidas discrepa del monto asignado por la fuente (S/ {Number(fuente.monto_financiamiento).toFixed(2)})
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