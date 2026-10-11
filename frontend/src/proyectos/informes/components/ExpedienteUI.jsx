import React from "react";
import { FiEye, FiRefreshCw, FiFileText, FiX, FiAward, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import ReporteExpediente from "../../../shared/components/ReporteExpediente";

// =============================================================
// TARJETA DOCUMENTO (CORREGIDA PARA CELULAR)
// =============================================================
export const DocumentoCard = ({ icon, titulo, descripcion, estado, disponible, loading, onView, ultimo = false }) => (
  <div className={`bg-white border border-slate-200 rounded-xl ${ultimo ? "" : "mb-3"}`}>
    <div className="min-h-[82px] px-4 py-4 flex flex-row items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${disponible ? "bg-[#f5e9eb] text-[#6f1825]" : "bg-slate-50 text-slate-300"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-700 truncate">{titulo}</h3>
          <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${disponible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {estado}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{descripcion}</p>
      </div>
      <button
        type="button" disabled={!disponible || loading} onClick={onView} title={disponible ? "Ver documento" : "Documento no disponible"}
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
          disponible ? "border-slate-200 text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b] hover:bg-[#fdf7f8]" : "border-transparent text-slate-300 cursor-not-allowed"
        }`}
      >
        {loading ? <FiRefreshCw className="animate-spin" /> : <FiEye />}
      </button>
    </div>
  </div>
);

// =============================================================
// MODAL DOCUMENTO
// =============================================================
export const ModalDocumento = ({ tipo, proyecto, informeFinalizacion, loadingConstancia, errorConstancia, cerrar }) => {
  const titulo = tipo === "planificacion" ? "Informe de planificación" : tipo === "finalizacion" ? "Informe de finalización" : "Constancia de ejecución";
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-[#b1122b]" />
              <h2 className="text-sm font-bold text-slate-800">{titulo}</h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{proyecto?.codigo || "—"} · {proyecto?.titulo || "Proyecto"}</p>
          </div>
          <button type="button" onClick={cerrar} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#b1122b] hover:bg-slate-50">
            <FiX className="text-lg" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100">
          {tipo === "planificacion" && <div className="p-2 sm:p-5 w-full overflow-x-auto"><ReporteExpediente matrizSeleccionada={proyecto} showPrintButton={true} /></div>}
          {tipo === "finalizacion" && <DocumentoFinalizacion informe={informeFinalizacion} proyecto={proyecto} />}
          {tipo === "constancia" && (
            <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
              {loadingConstancia ? (
                <><FiRefreshCw className="text-3xl text-[#b1122b] animate-spin" /><p className="text-sm font-semibold text-slate-600 mt-4">Cargando constancia...</p></>
              ) : errorConstancia ? (
                <><FiAlertCircle className="text-3xl text-red-400" /><p className="text-sm font-semibold text-red-600 mt-3">{errorConstancia}</p></>
              ) : (
                <><FiAward className="text-4xl text-[#b1122b]" /><p className="text-sm font-bold text-slate-700 mt-4">Constancia de ejecución</p><p className="text-xs text-slate-400 mt-1">Documento oficial del proyecto</p></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================
// SUB-COMPONENTES DE DOCUMENTO FINALIZACIÓN
// =============================================================
const SeccionDocumento = ({ titulo, children }) => (
  <section className="mb-7">
    <div className="bg-slate-800 text-white px-4 py-2 mb-3">
      <h2 className="text-[10px] font-bold uppercase tracking-wide">{titulo}</h2>
    </div>
    <div className="w-full overflow-x-auto">{children}</div>
  </section>
);

const TablaDocumento = ({ filas = [] }) => (
  <div className="border border-slate-300 min-w-[300px]">
    {Array.isArray(filas) && filas.map(([label, value], index) => (
      <div key={index} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] border-b border-slate-300 last:border-b-0">
        <div className="bg-slate-50 sm:border-r border-b sm:border-b-0 border-slate-300 px-3 py-2">
          <p className="text-[9px] font-bold text-slate-700">{label}</p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[10px] text-slate-700 whitespace-pre-wrap">{value ?? "—"}</p>
        </div>
      </div>
    ))}
  </div>
);

const TextoDocumento = ({ texto }) => {
  if (!texto || String(texto).trim() === "") return <VacioDocumento />;
  return <div className="border border-slate-300 p-4"><p className="text-[10px] leading-relaxed whitespace-pre-wrap">{texto}</p></div>;
};

const VacioDocumento = () => (
  <div className="border border-slate-300 bg-slate-50 p-4"><p className="text-[10px] text-slate-400 italic">No hay información registrada.</p></div>
);

// =============================================================
// DOCUMENTO FINALIZACIÓN - SOLO LECTURA
// =============================================================
export const DocumentoFinalizacion = ({ informe, proyecto }) => {
  if (!informe) return <div className="p-10 text-center"><FiAlertCircle className="mx-auto text-3xl text-slate-300" /><p className="text-xs text-slate-500 mt-3">No existe información del informe.</p></div>;

  const datosProyecto = informe?.datos_proyecto || {};
  const textos = informe?.textos || {};
  const docentes = Array.isArray(informe?.docentes_participantes) ? informe.docentes_participantes : [];
  const actividades = Array.isArray(informe?.actividades) ? informe.actividades : [];
  const metas = Array.isArray(informe?.metas_indicadores) ? informe.metas_indicadores : [];
  const partidas = Array.isArray(informe?.partidas_presupuesto) ? informe.partidas_presupuesto : [];

  return (
    <div className="bg-white w-full max-w-5xl mx-auto p-4 sm:p-8 md:p-12 overflow-x-hidden">
      <div className="text-center border-b-2 border-slate-800 pb-5 mb-7">
        <p className="text-[10px] font-bold uppercase">UNIVERSIDAD NACIONAL DE SAN AGUSTÍN</p>
        <p className="text-[9px] text-slate-500 mt-1">RESPONSABILIDAD SOCIAL UNIVERSITARIA</p>
        <h1 className="text-lg font-bold uppercase mt-5">INFORME DE FINALIZACIÓN</h1>
        <p className="text-xs text-slate-500 mt-2">Expediente oficial del proyecto RSU</p>
      </div>

      <SeccionDocumento titulo="1. DATOS GENERALES">
        <TablaDocumento filas={[
          ["Título del proyecto", informe?.titulo || proyecto?.titulo || "—"],
          ["Código de registro", informe?.codigo || proyecto?.codigo || "—"],
          ["Periodo", datosProyecto?.periodo || proyecto?.periodo || proyecto?.periodo_nombre || "—"],
          ["Fecha de inicio", datosProyecto?.fecha_inicio || "—"],
          ["Fecha de término", datosProyecto?.fecha_termino || "—"],
          ["Lugar de ejecución", datosProyecto?.lugar_ejecucion || "—"],
          ["Número de beneficiarios", datosProyecto?.nro_beneficiarios ?? "—"],
          ["Eje RSU", datosProyecto?.eje_rsu || "—"],
          ["Porcentaje de ejecución", informe?.porcentaje_ejecucion != null ? `${informe.porcentaje_ejecucion}%` : "—"],
        ]} />
      </SeccionDocumento>

      <SeccionDocumento titulo="2. DOCENTES PARTICIPANTES">
        {docentes.length > 0 ? (
          <div className="border border-slate-300 min-w-[300px]">
            {docentes.map((docente, index) => (
              <div key={index} className="px-4 py-3 border-b border-slate-200 last:border-b-0 text-xs">{docente}</div>
            ))}
          </div>
        ) : <VacioDocumento />}
      </SeccionDocumento>

      <SeccionDocumento titulo="3. ACTIVIDADES Y AVANCES">
        {actividades.length > 0 ? (
          <div className="border border-slate-300 min-w-[300px]">
            {actividades.map((actividad, index) => {
              const avances = Array.isArray(actividad?.avances) ? actividad.avances : [];
              return (
                <div key={actividad?.id || index} className="p-4 border-b border-slate-200 last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{actividad?.nombre || "Actividad"}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Estado: {actividad?.estado || "—"}</p>
                    </div>
                    {actividad?.estado === "completada" && <FiCheckCircle className="text-emerald-500 shrink-0" />}
                  </div>
                  {avances.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {avances.map((avance) => (
                        <div key={avance?.id} className="bg-slate-50 border border-slate-200 p-3">
                          <p className="text-[10px] text-slate-700">{avance?.descripcion || "Sin descripción"}</p>
                          {avance?.fecha_registro && <p className="text-[9px] text-slate-400 mt-1">Fecha: {avance.fecha_registro}</p>}
                          {Array.isArray(avance?.evidencias) && avance.evidencias.length > 0 && (
                            <p className="text-[9px] text-slate-400 mt-1">Evidencias: {avance.evidencias.length}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : <VacioDocumento />}
      </SeccionDocumento>

      <SeccionDocumento titulo="4. METAS E INDICADORES">
        {metas.length > 0 ? (
          <table className="w-full border-collapse border border-slate-300 min-w-[500px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Descripción</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Línea base</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Valor meta</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Alcanzado</th>
              </tr>
            </thead>
            <tbody>
              {metas.map((meta, index) => (
                <tr key={meta?.id || index}>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">{meta?.descripcion || "—"}</td>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">{meta?.linea_base ?? "—"}</td>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">{meta?.valor_meta ?? "—"}</td>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">{meta?.valor_alcanzado ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <VacioDocumento />}
      </SeccionDocumento>

      <SeccionDocumento titulo="5. EJECUCIÓN PRESUPUESTAL">
        {partidas.length > 0 ? (
          <table className="w-full border-collapse border border-slate-300 min-w-[400px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Partida</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Presupuestado</th>
                <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">Ejecutado</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((partida, index) => (
                <tr key={partida?.id || index}>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">{partida?.partida || "—"}</td>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">S/ {partida?.monto ?? "0.00"}</td>
                  <td className="border border-slate-300 px-3 py-2 text-[10px]">S/ {partida?.monto_ejecutado ?? "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <VacioDocumento />}
      </SeccionDocumento>

      <SeccionDocumento titulo="6. CONCLUSIONES"><TextoDocumento texto={textos?.conclusiones} /></SeccionDocumento>
      <SeccionDocumento titulo="7. RECOMENDACIONES"><TextoDocumento texto={textos?.recomendaciones} /></SeccionDocumento>
      <SeccionDocumento titulo="8. LECCIONES APRENDIDAS"><TextoDocumento texto={textos?.lecciones_aprendidas} /></SeccionDocumento>
      <SeccionDocumento titulo="9. MEDIO DE DIFUSIÓN"><TextoDocumento texto={textos?.medio_difusion} /></SeccionDocumento>
    </div>
  );
};