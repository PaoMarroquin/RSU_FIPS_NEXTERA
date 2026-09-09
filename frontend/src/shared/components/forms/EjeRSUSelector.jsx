import React, { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
// Ruta relativa hacia el API de planificación desde shared/components/forms
import { catalogoPlanificacionApi } from '../../api/planificacion/catalogoPlanificacionApi';

export default function EjeRSUSelector({ data, updateData }) {
  const [ejesDb, setEjesDb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEjes = async () => {
      try {
        const response = await catalogoPlanificacionApi.obtenerEjesRSU();
        // Soportar tanto si la API devuelve directamente el array o un objeto paginado con .results
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

  const handleSelectSubitem = (ejeId, subitemId) => {
    if (!subitemId) {
      updateData("eje_rsu", null);
      updateData("ejes_subitems", []);
      updateData("eje_detalle", "");
      return;
    }

    updateData("eje_rsu", parseInt(ejeId));
    updateData("ejes_subitems", [{ sub_eje: parseInt(subitemId), detalle: "" }]);
    updateData("eje_detalle", ""); 
  };

  const handleSelectEjeSinSubitems = (ejeId) => {
    updateData("eje_rsu", parseInt(ejeId));
    updateData("ejes_subitems", []); 
    updateData("eje_detalle", ""); 
  };

  const handleDetalleChange = (texto) => {
    if (data.ejes_subitems && data.ejes_subitems.length > 0) {
      const currentSubitem = data.ejes_subitems[0];
      updateData("ejes_subitems", [{ sub_eje: currentSubitem.sub_eje, detalle: texto }]);
    } else {
      updateData("eje_detalle", texto);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-slate-50 border-slate-200">
        <FiLoader className="animate-spin text-[#b1122b] text-2xl mr-3" />
        <span className="text-sm font-medium text-slate-600">Cargando Ejes RSU desde la base de datos...</span>
      </div>
    );
  }

  const subitemActivoId = data.ejes_subitems?.length > 0 ? data.ejes_subitems[0].sub_eje : null;
  const textoDetalleActual = data.ejes_subitems?.length > 0 
    ? (data.ejes_subitems[0].detalle || "") 
    : (data.eje_detalle || "");

  return (
    <div className="space-y-4 w-full">
      <p className="text-[11px] text-slate-400 m-0 -mt-1 mb-2">
        Seleccione <b>una sola subcategoría</b>. Al escoger una, las demás secciones se deshabilitarán.
      </p>

      {ejesDb.map((eje) => {
        const esActiva = data.eje_rsu === eje.id;
        const haySeleccionGlobal = data.eje_rsu !== null;
        const tieneSubitems = eje.subitems.length > 0;
        
        const subitemSeleccionadoObj = eje.subitems.find(sub => sub.id === subitemActivoId);

        return (
          <div 
            key={eje.id} 
            className={`border rounded-lg overflow-hidden transition-all duration-300 ${
              esActiva 
                ? 'border-[#b1122b] shadow-sm bg-red-50/10' 
                : (!esActiva && haySeleccionGlobal) ? 'opacity-50 border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
            }`}
          >
            {/* ENCABEZADO */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                {eje.nombre.toUpperCase()} <span className="text-slate-400 font-normal">({eje.descripcion})</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider self-start sm:self-auto ${
                esActiva ? 'bg-[#b1122b] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {eje.nombre.toUpperCase()}
              </span>
            </div>

            {/* CUERPO DEL SELECTOR */}
            <div className="p-4 flex flex-col gap-3">
              {tieneSubitems ? (
                <select
                  disabled={!esActiva && haySeleccionGlobal}
                  className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none transition-all cursor-pointer ${
                    esActiva 
                      ? 'border-[#b1122b] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#b1122b]/10' 
                      : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50'
                  }`}
                  value={esActiva ? (subitemActivoId || "") : ""}
                  onChange={(e) => handleSelectSubitem(eje.id, e.target.value)}
                >
                  <option value="">-- No aplica / Sin seleccionar --</option>
                  {eje.subitems.sort((a, b) => a.orden - b.orden).map(sub => (
                    <option key={sub.id} value={sub.id} className="text-slate-700 font-normal">
                      {sub.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input 
                    type="radio" 
                    checked={esActiva} 
                    onChange={() => handleSelectEjeSinSubitems(eje.id)}
                    disabled={!esActiva && haySeleccionGlobal}
                    className="w-4 h-4 text-[#b1122b] focus:ring-[#b1122b]"
                  />
                  <span className="text-sm text-slate-700 font-medium">Seleccionar Eje "{eje.nombre}"</span>
                </label>
              )}

              {/* INPUT CONDICIONAL DINÁMICO */}
              {(esActiva && (subitemSeleccionadoObj?.requiere_detalle || !tieneSubitems)) && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-white p-3 rounded-md border border-slate-200 mt-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {!tieneSubitems ? "Especificar detalle del proyecto" : subitemSeleccionadoObj.label_detalle} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    placeholder="Escriba aquí..."
                    value={textoDetalleActual}
                    onChange={(e) => handleDetalleChange(e.target.value)}
                    required
                    autoFocus
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