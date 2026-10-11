import React from "react";
import { FiUsers, FiActivity, FiCheckCircle, FiTarget } from "react-icons/fi";
import { CampoLectura, CampoTexto, Indicador } from "./ComponentesUI";

// Envuelve el contenido para mantener consistencia y fondo blanco limpio.
const ContenedorPaso = ({ titulo, descripcion, children }) => (
  <div className="animate-fade-in w-full">
    <div className="mb-6">
      <h3 className="text-xl font-bold text-slate-800">{titulo}</h3>
      <p className="text-xs text-slate-500 mt-1">{descripcion}</p>
    </div>
    <div className="w-full">{children}</div>
  </div>
);

export const SeccionDatosGenerales = ({ informe }) => (
  <ContenedorPaso titulo="Datos Generales" descripcion="Información heredada del plan de proyecto inicial.">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
      <CampoLectura label="Código" value={informe?.codigo} />
      <CampoLectura label="Título" value={informe?.titulo} />
      <CampoLectura label="Semestre" value={informe?.semestre_academico} />
      <CampoLectura label="Facultad" value={informe?.facultad?.nombre} />
      <CampoLectura label="Escuela" value={informe?.escuela?.nombre} />
      <CampoLectura label="Departamento" value={informe?.departamento?.nombre} />
      <CampoLectura label="Fecha inicio" value={informe?.fecha_inicio} />
      <CampoLectura label="Fecha término" value={informe?.fecha_termino} />
    </div>
    <h4 className="text-sm font-bold text-slate-800 mb-3">Ejes RSU y ODS</h4>
    <div className="flex flex-wrap gap-2 mb-6">
      {(informe?.ejes_rsu || []).map((eje) => (
        <span key={eje.id} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{eje.nombre}</span>
      ))}
      {(informe?.ods || []).map((ods) => (
        <span key={ods.id} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">ODS {ods.numero}: {ods.nombre}</span>
      ))}
    </div>
    <h4 className="text-sm font-bold text-slate-800 mb-3">Responsable</h4>
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 w-fit">
      <FiUsers className="text-[#b1122b]" />
      <span className="text-sm font-semibold text-slate-700">{informe?.docente_responsable}</span>
    </div>
  </ContenedorPaso>
);

export const SeccionFortalezas = () => (
  <ContenedorPaso titulo="Fortalezas y limitaciones" descripcion="Evaluación general">
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <p className="text-xs text-slate-500">Esta sección se nutre automáticamente a partir de los seguimientos aprobados.</p>
    </div>
  </ContenedorPaso>
);

export const SeccionResultados = ({ avance, esperados }) => (
  <ContenedorPaso titulo="Resultados" descripcion="Progreso actual de ejecución.">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Indicador icon={<FiActivity />} titulo="Ejecución" valor={`${avance?.porcentaje_ejecucion ?? 0}%`} />
      <Indicador icon={<FiCheckCircle />} titulo="Completadas" valor={`${avance?.actividades_completadas ?? 0}/${avance?.actividades_total ?? 1}`} />
      <Indicador icon={<FiTarget />} titulo="Avances Reg." valor={avance?.avances_registrados ?? 0} />
      <Indicador icon={<FiCheckCircle />} titulo="Evidencias" valor={avance?.evidencias_vigentes ?? 0} />
    </div>
    
    <h4 className="text-sm font-bold text-slate-800 mb-4">Resultados Esperados</h4>
    <div className="space-y-4">
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
        <p className="text-[10px] font-bold text-slate-500 uppercase">En Beneficiarios</p>
        <p className="text-xs text-slate-700 mt-2">{esperados?.en_beneficiarios || "—"}</p>
      </div>
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
        <p className="text-[10px] font-bold text-slate-500 uppercase">En Currículo</p>
        <p className="text-xs text-slate-700 mt-2">{esperados?.en_curriculo || "—"}</p>
      </div>
    </div>
  </ContenedorPaso>
);

export const SeccionTextosSimple = ({ titulo, descripcion, label, valor, onChange, puedeEditar }) => (
  <ContenedorPaso titulo={titulo} descripcion={descripcion}>
    <CampoTexto label={label} obligatorio disabled={!puedeEditar} value={valor} onChange={onChange} />
  </ContenedorPaso>
);

export const SeccionCronologia = ({ actividades }) => (
  <ContenedorPaso titulo="Cronología" descripcion="Avances registrados y actividades del proyecto.">
    <div className="space-y-4">
      {(!actividades || actividades.length === 0) ? <p className="text-xs text-slate-400">No hay actividades registradas.</p> : actividades.map((act) => (
        <div key={act.id} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700">{act.nombre}</h4>
            <span className="text-[9px] uppercase px-2 py-1 rounded-full bg-slate-200 font-bold text-slate-600">{act.estado_display}</span>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600 mb-3">{act.descripcion}</p>
            {act.avances && act.avances.length > 0 ? (
              <div className="space-y-2 border-l-2 border-[#b1122b]/30 pl-4 mt-2">
                {act.avances.map(av => (
                  <div key={av.id}>
                    <p className="text-xs font-semibold text-slate-700">{av.descripcion}</p>
                    <p className="text-[10px] text-slate-400">{new Date(av.created_at).toLocaleDateString()} - Por {av.autor}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">Sin avances reportados.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </ContenedorPaso>
);

export const SeccionMetas = ({ metas, cambiarMeta, puedeEditar }) => (
  <ContenedorPaso titulo="Metas e indicadores" descripcion="Valores de metas alcanzados.">
    <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Descripción</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Línea Base</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Meta</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Alcanzado</th>
          </tr>
        </thead>
        <tbody>
          {metas.map((meta) => (
            <tr key={meta.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-700">{meta.meta} - <span className="text-slate-500 italic">{meta.indicador}</span></td>
              <td className="px-4 py-3 text-xs">{meta.linea_base}</td>
              <td className="px-4 py-3 text-xs text-[#b1122b] font-bold">{meta.valor_meta}</td>
              <td className="px-4 py-3">
                <input type="number" step="0.1" disabled={!puedeEditar} value={meta.valor_alcanzado || ""} onChange={(e) => cambiarMeta(meta.id, e.target.value)} className="w-full max-w-[120px] border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b] transition-colors" placeholder="Ej. 10" />
              </td>
            </tr>
          ))}
          {metas.length === 0 && <tr><td colSpan="4" className="text-center p-6 text-xs text-slate-400">Sin metas registradas</td></tr>}
        </tbody>
      </table>
    </div>
  </ContenedorPaso>
);

export const SeccionPresupuesto = ({ partidas, cambiarPartida, puedeEditar }) => (
  <ContenedorPaso titulo="Ejecución presupuestal" descripcion="Detalla el monto ejecutado por cada partida.">
    <div className="overflow-x-auto w-full border border-slate-200 rounded-lg">
      <table className="w-full text-left min-w-[500px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Partida</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Presupuestado</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Ejecutado (S/)</th>
          </tr>
        </thead>
        <tbody>
          {partidas.map((partida) => (
            <tr key={partida.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-700 font-medium">{partida.descripcion} <span className="block text-[10px] text-slate-400 font-normal">{partida.categoria}</span></td>
              <td className="px-4 py-3 text-xs text-slate-600">S/ {(Number(partida.monto_presupuestado) || 0).toFixed(2)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">S/</span>
                  <input type="number" step="0.01" disabled={!puedeEditar} value={partida.monto_ejecutado || ""} onChange={(e) => cambiarPartida(partida.id, e.target.value)} className="w-full max-w-[120px] border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-[#b1122b] transition-colors" placeholder="0.00" />
                </div>
              </td>
            </tr>
          ))}
          {partidas.length === 0 && <tr><td colSpan="3" className="text-center p-6 text-xs text-slate-400">Sin presupuesto registrado</td></tr>}
        </tbody>
      </table>
    </div>
  </ContenedorPaso>
);

export const SeccionEvidencias = () => (
  <ContenedorPaso titulo="Evidencias y Anexos" descripcion="Gestión de evidencias finales del proyecto.">
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
      <p className="text-xs text-slate-500">Módulo de carga de evidencias conectado desde la vista de seguimiento.</p>
    </div>
  </ContenedorPaso>
);