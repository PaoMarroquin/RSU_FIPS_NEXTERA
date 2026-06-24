import React from 'react';

const SECCIONES_RSU = {
  gestion: {
    titulo: "GESTIÓN: (IMPACTO INTERNO - INSTITUCIONAL)",
    badge: "GESTIÓN",
    opciones: [
      { id: "gestion_admin", texto: "a. Programa de acciones ambientales a nivel administrativo", requiereDetalle: false },
      { id: "gestion_academico", texto: "b. Programa de acciones ambientales a nivel académico", requiereDetalle: false },
      { id: "gestion_activacion", texto: "c. Programa de iniciativas de activación ambiental", requiereDetalle: false },
      { id: "gestion_clima", texto: "d. Conjunto de acciones sobre clima laboral y cultura organizacional", requiereDetalle: false },
      { id: "gestion_inclusion", texto: "e. Iniciativas orientadas a fomentar la inclusión y equidad social en el ámbito laboral", requiereDetalle: false },
      { id: "gestion_otro", texto: "f. Otro", requiereDetalle: true, labelDetalle: "Especificar otro de Gestión" }
    ]
  },
  formacion: {
    titulo: "FORMACIÓN: (IMPACTO INTERNO - ESTUDIANTES)",
    badge: "FORMACIÓN",
    opciones: [
      { id: "formacion_etica", texto: "a. Incorpora la temática de ética en el desempeño profesional", requiereDetalle: false },
      { id: "formacion_anticorrupcion", texto: "b. Incorpora la temática de prácticas anticorrupción en la formación profesional", requiereDetalle: false },
      { id: "formacion_inclusion", texto: "c. Incorpora la temática de inclusión social en la formación profesional", requiereDetalle: false },
      { id: "formacion_equidad", texto: "d. Incorpora la temática de equidad en el desarrollo profesional", requiereDetalle: false },
      { id: "formacion_ambiental", texto: "e. Incorpora la temática Educación ambiental relacionado al ejercicio profesional", requiereDetalle: false },
      { id: "formacion_ddhh", texto: "f. Incorpora la temática de Derechos Humanos en la formación profesional", requiereDetalle: false },
      { id: "formacion_ods", texto: "g. Incorpora la temática Objetivos de Desarrollo Sostenible en la formación profesional", requiereDetalle: false },
      { id: "formacion_otro", texto: "h. Otro", requiereDetalle: true, labelDetalle: "Especificar otro de Formación" }
    ]
  },
  investigacion: {
    titulo: "INVESTIGACIÓN: (IMPACTO INTERNO - ESTUDIANTES)",
    badge: "INVESTIGACIÓN",
    opciones: [
      { id: "inv_ods", texto: "a. Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible", requiereDetalle: false },
      { id: "inv_politicas", texto: "b. Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia", requiereDetalle: false },
      { id: "inv_ciudadana", texto: "c. Contribuye a la formación ciudadana", requiereDetalle: false },
      { id: "inv_calidad", texto: "d. Contribuye a mejorar calidad de vida y condiciones económicas", requiereDetalle: false },
      { id: "inv_ambiental", texto: "e. Contribuye al cumplimiento de la Política Ambiental Nacional (líneas MINAM)", requiereDetalle: false }
    ]
  },
  extension: {
    titulo: "EXTENSIÓN: (IMPACTO EXTERNO)",
    badge: "EXTENSIÓN",
    opciones: [
      { id: "ext_ods", texto: "a. Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible", requiereDetalle: true, labelDetalle: "ODS Nro." },
      { id: "ext_politicas", texto: "b. Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { id: "ext_ciudadana", texto: "c. Contribuye a la formación ciudadana", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { id: "ext_calidad", texto: "d. Contribuye a mejorar calidad de vida y condiciones económicas", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { id: "ext_ambiental", texto: "e. Contribuye al cumplimiento de la Política Ambiental Nacional (líneas MINAM)", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" }
    ]
  },
  voluntariado: {
    titulo: "VOLUNTARIADO: (IMPACTO EXTERNO)",
    badge: "VOLUNTARIADO",
    opciones: [
      { id: "vol_iniciativas", texto: "a. Contribuye a la realización de iniciativas de voluntariado (evitando asistencialismo)", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" }
    ]
  }
};

export default function EjeRSUSelector({ valueEje, valueDetalle, onChange }) {

  const handleSelectChange = (e, nombreSeccion) => {
    const nuevoValor = e.target.value;

    if (nuevoValor !== "") {
      // 1. Guardamos el Nombre de la Sección (Ej. "GESTIÓN")
      onChange({ target: { name: "ejeRsuSeccion", value: nombreSeccion } });
      // 2. Guardamos la subcategoría seleccionada
      onChange({ target: { name: "ejeRsu", value: nuevoValor } });
      // 3. Limpiamos el detalle por si venía de otra opción
      onChange({ target: { name: "ejeRsuDetalle", value: "" } });
    } else {
      // Si elige "Sin seleccionar", limpiamos todo
      onChange({ target: { name: "ejeRsuSeccion", value: "" } });
      onChange({ target: { name: "ejeRsu", value: "" } });
      onChange({ target: { name: "ejeRsuDetalle", value: "" } });
    }
  };

  const handleInputChange = (e) => {
    onChange({ target: { name: "ejeRsuDetalle", value: e.target.value } });
  };

  // Averiguar qué sección está activa según el valueEje actual
  let claveSeccionActiva = "";
  for (const [clave, seccion] of Object.entries(SECCIONES_RSU)) {
    if (seccion.opciones.some(opt => opt.id === valueEje)) {
      claveSeccionActiva = clave;
      break;
    }
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-[11px] text-slate-400 m-0 -mt-1 mb-2">
        Seleccione <b>una sola subcategoría</b>. Al escoger una, las demás secciones se deshabilitarán.
      </p>

      {Object.entries(SECCIONES_RSU).map(([claveSeccion, seccion]) => {
        const esActiva = claveSeccionActiva === claveSeccion;
        const haySeleccionGlobal = claveSeccionActiva !== ""; // Para saber si oscurecer a las demás
        const optSeleccionada = esActiva ? seccion.opciones.find(opt => opt.id === valueEje) : null;

        return (
          <div 
            key={claveSeccion} 
            className={`border rounded-lg overflow-hidden transition-all duration-300 ${
              esActiva 
                ? 'border-[#b1122b] shadow-sm bg-red-50/10' 
                : (!esActiva && haySeleccionGlobal) ? 'opacity-50 border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
            }`}
          >
            {/* ENCABEZADO */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                {seccion.titulo}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider self-start sm:self-auto ${
                esActiva ? 'bg-[#b1122b] text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {seccion.badge}
              </span>
            </div>

            {/* CUERPO DEL SELECTOR */}
            <div className="p-4 flex flex-col gap-3">
              <select
                disabled={!esActiva && haySeleccionGlobal}
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm outline-none transition-all cursor-pointer ${
                  esActiva 
                    ? 'border-[#b1122b] bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#b1122b]/10' 
                    : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50'
                }`}
                value={esActiva ? valueEje : ""}
                onChange={(e) => handleSelectChange(e, seccion.badge)}
              >
                <option value="">-- No aplica / Sin seleccionar --</option>
                {seccion.opciones.map(opt => (
                  <option key={opt.id} value={opt.id} className="text-slate-700 font-normal">
                    {opt.texto}
                  </option>
                ))}
              </select>

              {/* INPUT CONDICIONAL PARA "OTRO" Y "DETALLES" */}
              {esActiva && optSeleccionada?.requiereDetalle && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-white p-3 rounded-md border border-slate-200 mt-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {optSeleccionada.labelDetalle} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    placeholder="Escriba aquí..."
                    value={valueDetalle || ""}
                    onChange={handleInputChange}
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