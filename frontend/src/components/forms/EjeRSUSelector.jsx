import React from 'react';

const SECCIONES_RSU = {
  gestion: {
    titulo: "GESTIÓN: (IMPACTO INTERNO - INSTITUCIONAL)",
    badge: "GESTIÓN",
    opciones: [
      { texto: "a. Programa de acciones ambientales a nivel administrativo", requiereDetalle: false },
      { texto: "b. Programa de acciones ambientales a nivel académico", requiereDetalle: false },
      { texto: "c. Programa de iniciativas de activación ambiental", requiereDetalle: false },
      { texto: "d. Conjunto de acciones sobre clima laboral y cultura organizacional", requiereDetalle: false },
      { texto: "e. Iniciativas orientadas a fomentar la inclusión y equidad social en el ámbito laboral", requiereDetalle: false },
      { texto: "f. Otro", requiereDetalle: true, labelDetalle: "Especificar otro de Gestión" }
    ]
  },
  formacion: {
    titulo: "FORMACIÓN: (IMPACTO INTERNO - ESTUDIANTES)",
    badge: "FORMACIÓN",
    opciones: [
      { texto: "a. Incorpora la temática de ética en el desempeño profesional", requiereDetalle: false },
      { texto: "b. Incorpora la temática de prácticas anticorrupción en la formación profesional", requiereDetalle: false },
      { texto: "c. Incorpora la temática de inclusión social en la formación profesional", requiereDetalle: false },
      { texto: "d. Incorpora la temática de equidad en el desarrollo profesional", requiereDetalle: false },
      { texto: "e. Incorpora la temática Educación ambiental relacionado al ejercicio profesional", requiereDetalle: false },
      { texto: "f. Incorpora la temática de Derechos Humanos en la formación profesional", requiereDetalle: false },
      { texto: "g. Incorpora la temática Objetivos de Desarrollo Sostenible en la formación profesional", requiereDetalle: false },
      { texto: "h. Otro", requiereDetalle: true, labelDetalle: "Especificar otro de Formación" }
    ]
  },
  investigacion: {
    titulo: "INVESTIGACIÓN: (IMPACTO INTERNO - ESTUDIANTES)",
    badge: "INVESTIGACIÓN",
    opciones: [
      { texto: "a. Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible", requiereDetalle: false },
      { texto: "b. Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia", requiereDetalle: false },
      { texto: "c. Contribuye a la formación ciudadana", requiereDetalle: false },
      { texto: "d. Contribuye a mejorar calidad de vida y condiciones económicas", requiereDetalle: false },
      { texto: "e. Contribuye al cumplimiento de la Política Ambiental Nacional (líneas MINAM)", requiereDetalle: false }
    ]
  },
  extension: {
    titulo: "EXTENSIÓN: (IMPACTO EXTERNO)",
    badge: "EXTENSIÓN",
    opciones: [
      { texto: "a. Contribuye a alguna de las metas de los Objetivos de Desarrollo Sostenible", requiereDetalle: true, labelDetalle: "ODS Nro." },
      { texto: "b. Contribuye a políticas de salud, educación, igualdad de género, inclusión social, justicia", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { texto: "c. Contribuye a la formación ciudadana", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { texto: "d. Contribuye a mejorar calidad de vida y condiciones económicas", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" },
      { texto: "e. Contribuye al cumplimiento de la Política Ambiental Nacional (líneas MINAM)", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" }
    ]
  },
  voluntariado: {
    titulo: "VOLUNTARIADO: (IMPACTO EXTERNO)",
    badge: "VOLUNTARIADO",
    opciones: [
      { texto: "a. Contribuye a la realización de iniciativas de voluntariado (evitando asistencialismo)", requiereDetalle: true, labelDetalle: "Detallar el ámbito de intervención" }
    ]
  }
};

export default function EjeRSUSelector({ valueSeccion, valueDetalle, onChange }) {

  const handleSelectChange = (e, seccionObj) => {
    const opcionSeleccionadaTexto = e.target.value;

    if (opcionSeleccionadaTexto === "") {
      onChange({ target: { name: "ejeRsuSeccion", value: "" } });
      onChange({ target: { name: "ejeRsuDetalle", value: "" } });
      return;
    }

    // 1. Guardamos el texto completo de la sección ("GESTIÓN: (IMPACTO...")
    onChange({ target: { name: "ejeRsuSeccion", value: seccionObj.titulo } });

    // 2. Buscamos si la opción requiere que el usuario escriba
    const opt = seccionObj.opciones.find(o => o.texto === opcionSeleccionadaTexto);
    if (opt.requiereDetalle) {
      // Le ponemos un " : " al final como separador, para que el input sepa dónde escribir
      onChange({ target: { name: "ejeRsuDetalle", value: `${opt.texto} : ` } });
    } else {
      onChange({ target: { name: "ejeRsuDetalle", value: opt.texto } });
    }
  };

  const handleInputChange = (e, opcionBaseTexto) => {
    const userText = e.target.value;
    // Concatenamos la opción base con lo que el usuario está tipeando
    onChange({ target: { name: "ejeRsuDetalle", value: `${opcionBaseTexto} : ${userText}` } });
  };

  return (
    <div className="space-y-4 w-full">
      <p className="text-[11px] text-slate-400 m-0 -mt-1 mb-2">
        Seleccione <b>una sola subcategoría</b>. Al escoger una, las demás secciones se deshabilitarán.
      </p>

      {Object.entries(SECCIONES_RSU).map(([claveSeccion, seccion]) => {
        // ¿Esta sección es la que está seleccionada actualmente?
        const esActiva = valueSeccion === seccion.titulo;
        // ¿Hay alguna sección seleccionada a nivel global?
        const haySeleccionGlobal = (valueSeccion && valueSeccion !== "");
        
        let optSeleccionada = null;
        let textoInputUsuario = ""; // Lo que el usuario escribió después de los dos puntos
        let selectValue = ""; // Lo que muestra el desplegable

        if (esActiva && valueDetalle) {
          // Buscamos cuál opción coincide con el inicio de nuestra súper cadena de texto
          optSeleccionada = seccion.opciones.find(opt => valueDetalle.startsWith(opt.texto));
          if (optSeleccionada) {
            selectValue = optSeleccionada.texto;
            
            // Si tiene detalle, separamos la parte escrita por el usuario
            if (optSeleccionada.requiereDetalle) {
              const prefijo = `${optSeleccionada.texto} : `;
              if (valueDetalle.startsWith(prefijo)) {
                textoInputUsuario = valueDetalle.substring(prefijo.length);
              }
            }
          }
        }

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
                value={esActiva ? selectValue : ""}
                onChange={(e) => handleSelectChange(e, seccion)}
              >
                <option value="">-- No aplica / Sin seleccionar --</option>
                {seccion.opciones.map(opt => (
                  <option key={opt.texto} value={opt.texto} className="text-slate-700 font-normal">
                    {opt.texto}
                  </option>
                ))}
              </select>

              {/* INPUT CONDICIONAL */}
              {esActiva && optSeleccionada?.requiereDetalle && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-white p-3 rounded-md border border-slate-200 mt-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {optSeleccionada.labelDetalle} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all"
                    placeholder="Escriba aquí..."
                    value={textoInputUsuario}
                    onChange={(e) => handleInputChange(e, optSeleccionada.texto)}
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