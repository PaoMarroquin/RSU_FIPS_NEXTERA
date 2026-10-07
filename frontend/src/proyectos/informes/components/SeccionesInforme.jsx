import React from "react";
import { FiUsers, FiActivity, FiCheckCircle, FiTarget, FiSend, FiAlertCircle, FiClock, FiRefreshCw, FiSave } from "react-icons/fi";
// Importación al mismo nivel
import { SectionCard, CampoLectura, CampoTexto, Indicador } from "./ComponentesUI";

export const SeccionDatosGenerales = ({ informe, docentes }) => (
  <SectionCard numero="I" titulo="Datos generales" descripcion="Datos heredados del proyecto.">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
      <CampoLectura label="Código" value={informe?.codigo} />
      <CampoLectura label="Título" value={informe?.titulo} />
      <CampoLectura label="Semestre" value={informe?.periodo_nombre} />
      <CampoLectura label="Fecha inicio" value={informe?.fecha_inicio} />
      <CampoLectura label="Fecha término" value={informe?.fecha_termino} />
      <CampoLectura label="Lugar ejecución" value={informe?.lugar_ejecucion} />
      <CampoLectura label="Beneficiarios" value={informe?.beneficiarios_info} />
      <CampoLectura label="Eje RSU" value={informe?.ejes_rsu_info} />
    </div>
    <h4 className="text-sm font-bold text-slate-800 mb-3">Docentes participantes</h4>
    <div className="flex flex-wrap gap-2">
      {docentes.map((doc, idx) => (
        <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <FiUsers className="text-[#b1122b]" /> {doc}
        </span>
      ))}
    </div>
  </SectionCard>
);

export const SeccionFortalezas = () => (
  <SectionCard numero="II" titulo="Fortalezas y limitaciones" descripcion="Evaluación general">
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <p className="text-xs text-slate-500 mt-1">Los campos de Fortalezas se gestionan desde el informe base en el sistema.</p>
    </div>
  </SectionCard>
);

export const SeccionResultados = ({ porcentaje, completadas, total, metas }) => (
  <SectionCard numero="III" titulo="Resultados" descripcion="Progreso actual de ejecución.">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Indicador icon={<FiActivity />} titulo="Avance de ejecución" valor={`${porcentaje}%`} />
      <Indicador icon={<FiCheckCircle />} titulo="Completadas" valor={`${completadas}/${total}`} />
      <Indicador icon={<FiTarget />} titulo="Metas" valor={metas} />
    </div>
  </SectionCard>
);

export const SeccionTextosSimple = ({ numero, titulo, descripcion, label, valor, onChange, puedeEditar }) => (
  <SectionCard numero={numero} titulo={titulo} descripcion={descripcion}>
    <CampoTexto label={label} obligatorio disabled={!puedeEditar} value={valor} onChange={onChange} />
  </SectionCard>
);

export const SeccionRecomendaciones = ({ textos, cambiarTexto, puedeEditar }) => (
  <SectionCard numero="VI" titulo="Recomendaciones" descripcion="Recomendaciones derivadas de la ejecución.">
    <CampoTexto label="Recomendaciones" obligatorio disabled={!puedeEditar} value={textos.recomendaciones} onChange={(v) => cambiarTexto("recomendaciones", v)} />
    <div className="mt-5">
      <CampoTexto label="Medio de difusión" disabled={!puedeEditar} value={textos.medio_difusion} onChange={(v) => cambiarTexto("medio_difusion", v)} />
    </div>
  </SectionCard>
);

export const SeccionCronologia = ({ actividades }) => (
  <SectionCard numero="VII" titulo="Cronología" descripcion="Avances registrados.">
    <div className="space-y-5">
    {actividades.length === 0 ? <p className="text-xs text-slate-400">No hay actividades.</p> : actividades.map((act) => (
      <div key={act.id} className="border-l-2 border-[#b1122b]/20 pl-5">
        <h4 className="text-sm font-bold text-slate-700">{act.nombre} <span className="text-[9px] uppercase px-2 py-1 rounded-full bg-slate-100 ml-2">{act.estado}</span></h4>
      </div>
    ))}
    </div>
  </SectionCard>
);

export const SeccionMetas = ({ metas, cambiarMeta, puedeEditar }) => (
  <SectionCard numero="VIII" titulo="Metas e indicadores" descripcion="Valores de metas alcanzados.">
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Descripción</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Línea Base</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Meta</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Alcanzado</th>
          </tr>
        </thead>
        <tbody>
          {metas.map((meta, index) => (
            <tr key={meta.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs">{meta.descripcion}</td>
              <td className="px-4 py-3 text-xs">{meta.linea_base}</td>
              <td className="px-4 py-3 text-xs text-[#b1122b] font-bold">{meta.valor_meta}</td>
              <td className="px-4 py-3">
                <input type="number" disabled={!puedeEditar} value={meta.valor_alcanzado} onChange={(e) => cambiarMeta(index, e.target.value)} className="w-32 border border-slate-200 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b]" />
              </td>
            </tr>
          ))}
          {metas.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-xs text-slate-400">Sin metas registradas</td></tr>}
        </tbody>
      </table>
    </div>
  </SectionCard>
);

export const SeccionPresupuesto = ({ partidas, cambiarPartida, puedeEditar }) => (
  <SectionCard numero="IX" titulo="Ejecución presupuestal" descripcion="Partidas de presupuesto ejecutadas.">
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Partida</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Presupuestado</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Ejecutado (S/)</th>
          </tr>
        </thead>
        <tbody>
          {partidas.map((partida, index) => (
            <tr key={partida.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs">{partida.partida}</td>
              <td className="px-4 py-3 text-xs text-slate-600 font-medium">S/ {partida.monto}</td>
              <td className="px-4 py-3">
                <input type="number" step="0.01" disabled={!puedeEditar} value={partida.monto_ejecutado} onChange={(e) => cambiarPartida(index, e.target.value)} className="w-32 border border-slate-200 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b]" />
              </td>
            </tr>
          ))}
          {partidas.length === 0 && <tr><td colSpan="3" className="text-center p-4 text-xs text-slate-400">Sin presupuesto registrado</td></tr>}
        </tbody>
      </table>
    </div>
  </SectionCard>
);

export const SeccionEvidencias = () => (
  <SectionCard numero="X" titulo="Evidencias" descripcion="Gestión de evidencias del proyecto.">
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
      <p className="text-xs text-slate-500">Módulo de carga de evidencias pendiente de conectar al endpoint.</p>
    </div>
  </SectionCard>
);

export const SeccionEnvio = ({ estado, revisiones, puedeEditar, guardar, enviar, guardando, enviando }) => (
  <SectionCard numero="XI" titulo="Envío y revisión" descripcion="Estado actual del informe.">
    <div className="p-5 border border-slate-200 bg-slate-50 rounded-xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white border ${estado === 'aprobado' ? 'text-green-600 border-green-200' : 'text-[#b1122b] border-slate-200'}`}>
        {estado === 'aprobado' ? <FiCheckCircle /> : estado === 'enviado' ? <FiSend /> : estado === 'observado' ? <FiAlertCircle /> : <FiClock />}
      </div>
      <div>
        <p className="font-bold uppercase text-[10px] text-slate-400">Estado Actual</p>
        <p className="font-bold text-sm text-slate-700 mt-1">{estado === "aprobado" ? "Aprobado" : estado === "enviado" ? "Enviado a Depto." : estado === "observado" ? "Observado" : "Borrador"}</p>
      </div>
    </div>

    {estado === "observado" && revisiones.length > 0 && (
      <div className="mt-4 bg-amber-50 p-4 border border-amber-200 rounded-xl flex gap-3">
        <FiAlertCircle className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 text-xs font-bold">Observación del Departamento</p>
          <p className="text-amber-700 text-xs mt-1">{revisiones[revisiones.length - 1]?.comentario_tecnico || "Revisa tus datos."}</p>
        </div>
      </div>
    )}

    <div className="mt-5 flex flex-wrap gap-3">
      {puedeEditar && <button onClick={guardar} disabled={guardando} className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">{guardando ? <FiRefreshCw className="animate-spin"/> : <FiSave />} Guardar Borrador</button>}
      {puedeEditar && <button onClick={enviar} disabled={enviando} className="px-4 py-2.5 bg-[#b1122b] text-white rounded-lg text-xs font-bold hover:bg-[#8a0e21] flex items-center gap-2">{enviando ? <FiRefreshCw className="animate-spin"/> : <FiSend />} Enviar a Revisión</button>}
    </div>
  </SectionCard>
);