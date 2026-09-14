import React, { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import { catalogoPlanificacionApi } from '../../api/planificacion/catalogoPlanificacionApi';

export default function EjeRSUSelector({ data, updateData }) {
  const [ejesDb, setEjesDb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEjes = async () => {
      try {
        const response = await catalogoPlanificacionApi.obtenerEjesRSU();
        const resultados = response.results ? response.results : response;
        const ejesOrdenados = resultados.sort((a, b) => a.id - b.id);
        setEjesDb(ejesOrdenados);
      } catch (error) {
        console.error("Error cargando los Ejes RSU:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEjes();
  }, []);

  const ejesSeleccionados = Array.isArray(data.ejes_rsu) ? data.ejes_rsu : [];
  const subitemsSeleccionados = Array.isArray(data.ejes_subitems) ? data.ejes_subitems : [];

  // Sincroniza y actualiza los IDs únicos de ejes_rsu en función de las selecciones
  const sincronizarEjes = (nuevosSubitems, nuevosEjesSinSubitems) => {
    const ejesConSubitemsActivos = ejesDb
      .filter(eje => eje.subitems && eje.subitems.length > 0)
      .filter(eje => 
        eje.subitems.some(sub => nuevosSubitems.some(s => s.sub_eje === sub.id))
      )
      .map(eje => eje.id);

    const todosEjesActivos = Array.from(
      new Set([...ejesConSubitemsActivos, ...nuevosEjesSinSubitems])
    );

    updateData("ejes_rsu", todosEjesActivos);
  };

  // Manejar selección/deselección de subítems
  const handleToggleSubitem = (ejeId, subitemId) => {
    const idNum = parseInt(subitemId, 10);
    const existe = subitemsSeleccionados.some(s => s.sub_eje === idNum);

    let nuevosSubitems;
    if (existe) {
      nuevosSubitems = subitemsSeleccionados.filter(s => s.sub_eje !== idNum);
    } else {
      nuevosSubitems = [...subitemsSeleccionados, { sub_eje: idNum, detalle: "" }];
    }

    updateData("ejes_subitems", nuevosSubitems);

    const ejesSinSubitemsActuales = ejesSeleccionados.filter(id => {
      const eje = ejesDb.find(e => e.id === id);
      return eje && (!eje.subitems || eje.subitems.length === 0);
    });

    sincronizarEjes(nuevosSubitems, ejesSinSubitemsActuales);
  };

  // Manejar selección/deselección de ejes que NO tienen subítems
  const handleToggleEjeSinSubitems = (ejeId) => {
    const idNum = parseInt(ejeId, 10);
    const esSeleccionado = ejesSeleccionados.includes(idNum);

    const ejesSinSubitemsActuales = ejesSeleccionados.filter(id => {
      const eje = ejesDb.find(e => e.id === id);
      return eje && (!eje.subitems || eje.subitems.length === 0);
    });

    let nuevosEjesSinSubitems;
    if (esSeleccionado) {
      nuevosEjesSinSubitems = ejesSinSubitemsActuales.filter(id => id !== idNum);
      if (nuevosEjesSinSubitems.length === 0) {
        updateData("eje_detalle", "");
      }
    } else {
      nuevosEjesSinSubitems = [...ejesSinSubitemsActuales, idNum];
    }

    sincronizarEjes(subitemsSeleccionados, nuevosEjesSinSubitems);
  };

  // Actualizar el detalle de un subítem específico
  const handleSubitemDetalleChange = (subitemId, texto) => {
    const idNum = parseInt(subitemId, 10);
    const nuevosSubitems = subitemsSeleccionados.map(item =>
      item.sub_eje === idNum ? { ...item, detalle: texto } : item
    );
    updateData("ejes_subitems", nuevosSubitems);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-slate-50 border-slate-200">
        <FiLoader className="animate-spin text-[#b1122b] text-2xl mr-3" />
        <span className="text-sm font-medium text-slate-600">Cargando Ejes RSU desde la base de datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-[11px] text-slate-500 m-0 -mt-1 mb-2">
        Seleccione <b>uno o varios Ejes / Subítems</b> de la lista según aplique a su proyecto.
      </p>

      {ejesDb.map((eje) => {
        const tieneSubitems = eje.subitems && eje.subitems.length > 0;
        const esEjeActivo = ejesSeleccionados.includes(eje.id);

        return (
          <div 
            key={eje.id} 
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${
              esEjeActivo 
                ? 'border-[#b1122b] shadow-sm bg-red-50/10' 
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* ENCABEZADO */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                {eje.nombre.toUpperCase()} <span className="text-slate-400 font-normal">({eje.descripcion})</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider self-start sm:self-auto ${
                esEjeActivo ? 'bg-[#b1122b] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {eje.nombre.toUpperCase()}
              </span>
            </div>

            {/* CUERPO DEL SELECTOR */}
            <div className="p-4 flex flex-col gap-3">
              {tieneSubitems ? (
                <div className="grid grid-cols-1 gap-2">
                  {eje.subitems.sort((a, b) => a.orden - b.orden).map((sub) => {
                    const subitemState = subitemsSeleccionados.find(s => s.sub_eje === sub.id);
                    const isChecked = !!subitemState;

                    return (
                      <div key={sub.id} className="flex flex-col gap-2 p-2 rounded-md hover:bg-slate-50 border border-slate-100 transition-colors">
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 font-medium select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSubitem(eje.id, sub.id)}
                            className="w-4 h-4 text-[#b1122b] rounded focus:ring-[#b1122b] accent-[#b1122b] cursor-pointer"
                          />
                          <span>{sub.nombre}</span>
                        </label>

                        {/* INPUT CONDICIONAL DE DETALLE POR SUBÍTEM */}
                        {isChecked && sub.requiere_detalle && (
                          <div className="pl-6 pt-1 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs font-semibold text-slate-600 block mb-1">
                              {sub.label_detalle || "Especificar detalle"} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                              placeholder="Escriba el detalle aquí..."
                              value={subitemState.detalle || ""}
                              onChange={(e) => handleSubitemDetalleChange(sub.id, e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <label className="flex items-center gap-2.5 cursor-pointer w-fit p-1 select-none">
                  <input 
                    type="checkbox" 
                    checked={esEjeActivo} 
                    onChange={() => handleToggleEjeSinSubitems(eje.id)}
                    className="w-4 h-4 text-[#b1122b] rounded focus:ring-[#b1122b] accent-[#b1122b] cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 font-medium">Seleccionar Eje "{eje.nombre}"</span>
                </label>
              )}

              {/* INPUT CONDICIONAL DE DETALLE PARA EJE SIN SUBÍTEMS */}
              {(!tieneSubitems && esEjeActivo) && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-white p-3 rounded-md border border-slate-200 mt-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Especificar detalle del proyecto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    placeholder="Escriba aquí..."
                    value={data.eje_detalle || ""}
                    onChange={(e) => updateData("eje_detalle", e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}