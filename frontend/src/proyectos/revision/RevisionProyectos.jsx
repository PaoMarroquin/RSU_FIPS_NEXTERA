import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../shared/layout/Layout";
import {
  FiCheckCircle, FiXCircle, FiInbox, FiTarget,
  FiCalendar, FiDollarSign, FiFileText, FiEye, FiX, FiAlertCircle,
  FiUsers, FiActivity, FiChevronRight
} from "react-icons/fi";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRevision } from "./hooks/useRevision";
import ReporteExpediente from "../../shared/components/ReporteExpediente";

// Estructura de secciones: id, etiqueta, ícono y las claves de campo que agrupa.
// Las claves alimentan el contador de observaciones pendientes por sección.
const SECCIONES = [
  {
    id: "general", label: "Datos generales", icon: FiFileText,
    keys: ["unidad_academica", "periodo_semestre", "titulo", "asignaturas", "anio_carrera",
      "num_docentes_estudiantes", "lugar_ejecucion", "beneficiarios", "eje_rsu", "ejes_subitems",
      "tipo_actividad", "ods", "metas_indicadores", "fechas_clave"]
  },
  {
    id: "fundamentacion", label: "Fundamentación", icon: FiFileText,
    keys: ["fund_por_que_grupo", "fund_para_que_proyecto", "fund_mecanismo_ensenanza"]
  },
  {
    id: "diagnostico", label: "Diagnóstico", icon: FiTarget,
    keys: ["diag_estado_grupo", "diag_problemas_detectados", "diag_aportes_formacion", "diag_justificacion_intervencion"]
  },
  {
    id: "objetivos", label: "Objetivos y resultados", icon: FiTarget,
    keys: ["obj_logro_intervencion", "obj_mejora_curricular", "resultado_en_beneficiarios", "resultado_en_curriculo", "impacto_esperado"]
  },
  { id: "actividades", label: "Actividades", icon: FiActivity, keys: ["actividades"] },
  { id: "cronograma", label: "Cronograma", icon: FiCalendar, keys: ["cronograma"] },
  { id: "recursos", label: "Recursos", icon: FiUsers, keys: ["rec_humanos", "rec_materiales"] },
  {
    id: "financiamiento", label: "Financiamiento", icon: FiDollarSign,
    keys: ["monto_financiamiento", "fuentes_financiamiento", "descripcion_gastos", "observaciones_financiamiento"]
  },
];

const getIniciales = (nombre = "") =>
  nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?";

export default function RevisionProyectos() {
  const navigate = useNavigate();
  const {
    proyectos, loading, modalOpen, setModalOpen, selectedProyecto,
    observacionesCampos, evaluating, actionType, activeTab, setActiveTab,
    loadingDetalle,
    modalVistaOpen, setModalVistaOpen, proyectoDetalle, loadingVista,
    fetchProyectos, openModalVisualizacion, openModalRevision, handleInputChange, handleEvaluate
  } = useRevision();

  useEffect(() => {
    const role = (localStorage.getItem("user_role") || "").toLowerCase();
    if (role !== "departamento" && role !== "administrador") {
      navigate("/dashboard");
      return;
    }
    fetchProyectos();
  }, [fetchProyectos, navigate]);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    try { return format(parseISO(fechaString), "dd/MM/yyyy HH:mm", { locale: es }); } catch { return "-"; }
  };

  // Conteo de observaciones cargadas por sección, para el panel lateral.
  const conteosPorSeccion = useMemo(() => {
    const mapa = {};
    SECCIONES.forEach(sec => {
      mapa[sec.id] = sec.keys.filter(k => observacionesCampos[k]?.trim()).length;
    });
    return mapa;
  }, [observacionesCampos]);

  const totalObservaciones = useMemo(
    () => Object.values(conteosPorSeccion).reduce((a, b) => a + b, 0),
    [conteosPorSeccion]
  );

  const renderFilaDeEvaluacion = (tituloCampo, valorOriginal, campoKey, placeholder = "Describa la observación...") => {
    const esObservar = actionType === "observar";
    const tieneObservacion = esObservar && observacionesCampos[campoKey]?.trim();

    return (
      <div className={`rounded-lg border-l-[3px] bg-white transition-colors ${tieneObservacion ? "border-l-[#b1122b]" : "border-l-slate-200"} border border-slate-200`}>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">{tituloCampo}</h4>
          {tieneObservacion && (
            <span className="text-[11px] font-medium text-[#b1122b] flex items-center gap-1">
              <FiAlertCircle size={12} /> Observado
            </span>
          )}
        </div>

        <div className={`px-4 pb-4 grid gap-4 ${esObservar ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          <div className={esObservar ? "md:border-r md:border-slate-100 md:pr-4" : ""}>
            <span className="text-[11px] text-slate-400 mb-1 block">Declarado por el docente</span>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed m-0">
              {valorOriginal || <span className="text-slate-400 italic">Sin registrar</span>}
            </p>
          </div>

          {esObservar && (
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Observación del revisor</label>
              <textarea
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b1122b]/15 focus:border-[#b1122b] text-slate-700 resize-none min-h-[64px] placeholder:text-slate-400"
                rows="3"
                placeholder={placeholder}
                value={observacionesCampos[campoKey] || ""}
                onChange={(e) => handleInputChange(campoKey, e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const p = selectedProyecto || {};

  const txtBeneficiarios = () => {
    const lista = (p.beneficiarios_info || []).map(b => b.label).join(", ");
    return [lista, p.benef_otro_detalle ? `Otro: ${p.benef_otro_detalle}` : ""].filter(Boolean).join(" — ") || "";
  };
  const txtEjeRsu = () => {
    const lista = (p.ejes_rsu_info || []).map(e => e.nombre).join(", ");
    return [lista, p.eje_detalle ? `Detalle: ${p.eje_detalle}` : ""].filter(Boolean).join(" — ") || "";
  };
  const txtEjesSubitems = () =>
    (p.ejes_subitems || []).map(s => `• ${s.sub_eje_nombre}${s.detalle ? `: ${s.detalle}` : ""}`).join("\n") || "";
  const txtTipoActividad = () => {
    const lista = (p.tipo_actividad_display || []).join(", ");
    return [lista, p.tipo_actividad_otro ? `Otro: ${p.tipo_actividad_otro}` : ""].filter(Boolean).join(" — ") || "";
  };
  const txtOds = () => (p.ods_info || []).map(o => `ODS ${o.numero}: ${o.nombre}`).join(", ") || "";
  const txtMetasIndicadores = () =>
    (p.metas_indicadores || []).map(m =>
      `• ${m.meta_descripcion}\n  Indicador: ${m.indicador_nombre} | Meta: ${m.valor_meta ?? "-"} ${m.unidad_medida || ""} (Línea base: ${m.linea_base ?? "-"})`
    ).join("\n\n") || "";
  const txtFechasClave = () =>
    [
      `Inicio: ${formatearFecha(p.fecha_inicio)}`,
      `Evaluación de avance: ${formatearFecha(p.fecha_evaluacion_avance)}`,
      `Término: ${formatearFecha(p.fecha_termino)}`,
      `Encuesta docentes: ${formatearFecha(p.fecha_encuesta_docentes)}`,
      `Encuesta alumnos: ${formatearFecha(p.fecha_encuesta_alumnos)}`,
      `Encuesta grupo destinatario: ${formatearFecha(p.fecha_encuesta_grupo_destinatario)}`,
    ].join("\n");
  const txtActividades = () =>
    (p.actividades || []).map(a =>
      `• ${a.nombre}\n  ${a.descripcion || ""}\n  Responsable: ${a.responsable || "-"} | Fecha: ${a.fecha || "-"}\n  Evidencia esperada: ${a.evidencia_esperada || "-"}`
    ).join("\n\n") || "";
  const txtCronograma = () =>
    (p.cronograma || []).map(c =>
      `• ${c.descripcion}\n  Del ${c.fecha_inicio || "-"} al ${c.fecha_fin || "-"} | Responsable: ${c.responsable || "-"} | Estado: ${c.estado_avance}`
    ).join("\n\n") || "";
  const txtRecHumanos = () =>
    [
      `Docentes: ${p.rec_hum_docentes ?? 0}`, `Administrativos: ${p.rec_hum_administrativos ?? 0}`,
      `Estudiantes: ${p.rec_hum_estudiantes ?? 0}`, `Egresados: ${p.rec_hum_egresados ?? 0}`,
      `Voluntarios: ${p.rec_hum_voluntarios ?? 0}`, `Otros: ${p.rec_hum_otros ?? 0}`,
    ].join(" | ");
  const txtRecMateriales = () =>
    [
      p.rec_mat_material_didactico && `Material didáctico: ${p.rec_mat_material_didactico}`,
      p.rec_mat_afiches && `Afiches: ${p.rec_mat_afiches}`,
      p.rec_mat_equipos && `Equipos: ${p.rec_mat_equipos}`,
      p.rec_mat_utiles && `Útiles: ${p.rec_mat_utiles}`,
      p.rec_mat_otros && `Otros: ${p.rec_mat_otros}`,
    ].filter(Boolean).join("\n") || "";
  const txtFuentesFinanciamiento = () =>
    (p.fuentes_financiamiento || []).map(f => {
      const partidas = (f.partidas || []).map(pa => `    - ${pa.descripcion} (${pa.cantidad} x S/. ${pa.costo_unitario}) = S/. ${pa.monto_presupuestado}`).join("\n");
      return `• ${f.fuente_display || f.fuente}: S/. ${f.monto}${f.descripcion ? ` — ${f.descripcion}` : ""}\n${partidas}`;
    }).join("\n\n") || "";

  return (
    <Layout>
      <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight m-0">Revisión de proyectos RSU</h1>
            <p className="text-sm text-slate-500 mt-1 m-0">Evalúa cada expediente enviado por los docentes y registra observaciones por sección.</p>
          </div>
          {!loading && proyectos.length > 0 && (
            <span className="text-sm text-slate-400">{proyectos.length} pendiente{proyectos.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-sm text-slate-400">
              <div className="w-6 h-6 border-2 border-[#b1122b] border-t-transparent rounded-full animate-spin"></div>
              Cargando bandeja de revisión...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-lg"><FiInbox /></div>
              <p className="font-semibold text-sm text-slate-700 m-0">No hay proyectos pendientes de revisión</p>
              <p className="text-xs text-slate-400 m-0">Los nuevos envíos aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="py-3 px-6 font-medium">Proyecto</th>
                  <th className="py-3 px-6 font-medium">Coordinador</th>
                  <th className="py-3 px-6 font-medium">Enviado</th>
                  <th className="py-3 px-6 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {proyectos.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 max-w-md">
                      <div className="font-mono text-[10px] text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mb-1.5">{proyecto.codigo || 'S/C'}</div>
                      <div className="text-slate-800 font-medium leading-snug line-clamp-1">{proyecto.titulo}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {getIniciales(proyecto.docente_responsable_nombre)}
                        </div>
                        <span className="text-slate-600">{proyecto.docente_responsable_nombre || "Docente"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{formatearFecha(proyecto.fecha_envio_revision)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-md flex items-center gap-1.5 text-xs transition-colors"
                          onClick={() => openModalVisualizacion(proyecto)}
                        >
                          <FiEye size={13} /> Ver
                        </button>
                        <button
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md flex items-center gap-1.5 text-xs transition-colors"
                          onClick={() => openModalRevision(proyecto, 'aprobar')}
                        >
                          <FiCheckCircle size={13} /> Aprobar
                        </button>
                        <button
                          className="px-3 py-1.5 bg-[#b1122b] hover:bg-[#960f24] text-white font-medium rounded-md flex items-center gap-1.5 text-xs transition-colors"
                          onClick={() => openModalRevision(proyecto, 'observar')}
                        >
                          <FiXCircle size={13} /> Observar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL DE VISUALIZACIÓN COMPLETA (solo lectura) */}
      {modalVistaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 m-0"><FiEye /> Expediente completo</h2>
              <button onClick={() => setModalVistaOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"><FiX /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVista ? <div className="text-center py-10 text-sm text-slate-400 animate-pulse">Cargando expediente...</div> : <ReporteExpediente matrizSeleccionada={proyectoDetalle} showPrintButton={false} />}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DICTAMEN INTEGRAL */}
      {modalOpen && selectedProyecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl border border-slate-100 h-[92vh] flex flex-col overflow-hidden">

            {/* Encabezado */}
            <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  {actionType === 'aprobar'
                    ? <FiCheckCircle className="text-emerald-600" size={18} />
                    : <FiXCircle className="text-[#b1122b]" size={18} />}
                  <h2 className="text-base font-semibold text-slate-800 m-0">
                    {actionType === 'aprobar' ? 'Aprobar plan de trabajo' : 'Registrar observaciones'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 m-0">{p.titulo}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"><FiX /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Panel lateral de navegación por sección */}
              <nav className="w-56 shrink-0 border-r border-slate-100 bg-slate-50/50 py-3 overflow-y-auto">
                {SECCIONES.map(sec => {
                  const Icon = sec.icon;
                  const activa = activeTab === sec.id;
                  const count = conteosPorSeccion[sec.id];
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveTab(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                        activa ? "bg-white text-[#b1122b] font-semibold" : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      <Icon size={15} className={activa ? "text-[#b1122b]" : "text-slate-400"} />
                      <span className="flex-1">{sec.label}</span>
                      {actionType === 'observar' && count > 0 && (
                        <span className="text-[10px] font-semibold bg-[#b1122b]/10 text-[#b1122b] rounded-full w-4 h-4 flex items-center justify-center">
                          {count}
                        </span>
                      )}
                      {activa && <FiChevronRight size={13} className="text-[#b1122b]" />}
                    </button>
                  );
                })}
                {actionType === 'observar' && (
                  <div className="px-4 pt-3 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    {totalObservaciones} observación{totalObservaciones !== 1 ? "es" : ""} registrada{totalObservaciones !== 1 ? "s" : ""}
                  </div>
                )}
              </nav>

              {/* Contenido de la sección activa */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {loadingDetalle || !selectedProyecto ? (
                  <div className="text-center py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-[#b1122b] rounded-full animate-spin"></div>
                    Sincronizando expediente...
                  </div>
                ) : (
                  <div className="space-y-3 max-w-3xl">
                    {activeTab === "general" && (
                      <>
                        {renderFilaDeEvaluacion("Unidad académica", `${p.facultad_nombre || "-"} > ${p.escuela_nombre || "-"} > ${p.departamento_nombre || "-"}`, "unidad_academica", "Ej: La escuela seleccionada no corresponde a la facultad indicada...")}
                        {renderFilaDeEvaluacion("Periodo académico y semestre", `${p.periodo_nombre || "-"} — Semestre: ${p.semestre_academico || "-"}`, "periodo_semestre", "Ej: El periodo consignado ya se encuentra cerrado...")}
                        {renderFilaDeEvaluacion("Título del proyecto", p.titulo, "titulo", "Ej: El título es confuso o no refleja las actividades de RSU...")}
                        {renderFilaDeEvaluacion("Asignaturas vinculadas", (p.asignaturas || []).map(a => a.nombre_asignatura).join(", "), "asignaturas", "Ej: Las asignaturas declaradas no corresponden a la malla curricular...")}
                        {renderFilaDeEvaluacion("Año de carrera / tesis de 5to año", `${p.anio_carrera_display || "-"}${p.es_tesis_quinto_anio ? " (marcado como tesis de 5to año)" : ""}`, "anio_carrera", "Ej: No corresponde marcar tesis de 5to año para este año de carrera...")}
                        {renderFilaDeEvaluacion("N.º de docentes / estudiantes", `Docentes: ${p.nro_docentes ?? "-"} | Estudiantes: ${p.nro_estudiantes ?? "-"}`, "num_docentes_estudiantes", "Ej: El número de estudiantes declarado excede el máximo permitido...")}
                        {renderFilaDeEvaluacion("Lugar de ejecución", p.lugar_ejecucion, "lugar_ejecucion", "Ej: La zona de intervención está fuera de la cobertura autorizada...")}
                        {renderFilaDeEvaluacion("Beneficiarios", txtBeneficiarios(), "beneficiarios", "Ej: El detalle de 'otro beneficiario' es insuficiente...")}
                        {renderFilaDeEvaluacion("Eje RSU", txtEjeRsu(), "eje_rsu", "Ej: El eje seleccionado no guarda coherencia con el problema planteado...")}
                        {renderFilaDeEvaluacion("Sub-ejes / detalle", txtEjesSubitems(), "ejes_subitems", "Ej: Falta precisar el sub-eje vinculado a la actividad principal...")}
                        {renderFilaDeEvaluacion("Tipo de actividad", txtTipoActividad(), "tipo_actividad", "Ej: El tipo de actividad declarado no corresponde a lo descrito...")}
                        {renderFilaDeEvaluacion("Objetivos de Desarrollo Sostenible", txtOds(), "ods", "Ej: No se justifica la vinculación directa con el ODS marcado...")}
                        {renderFilaDeEvaluacion("Metas e indicadores de logro", txtMetasIndicadores(), "metas_indicadores", "Ej: Las metas planteadas son insuficientes para medir el impacto...")}
                        {renderFilaDeEvaluacion("Fechas clave del proyecto", txtFechasClave(), "fechas_clave", "Ej: La fecha de término es anterior a la fecha de evaluación de avance...")}
                      </>
                    )}
                    {activeTab === "fundamentacion" && (
                      <>
                        {renderFilaDeEvaluacion("¿Por qué se trabaja con este grupo?", p.fund_por_que_grupo, "fund_por_que_grupo", "Ej: No se justifica adecuadamente la elección del grupo beneficiario...")}
                        {renderFilaDeEvaluacion("¿Para qué se realiza este proyecto?", p.fund_para_que_proyecto, "fund_para_que_proyecto", "Ej: El propósito no está alineado con los objetivos institucionales...")}
                        {renderFilaDeEvaluacion("Mecanismo de enseñanza-aprendizaje", p.fund_mecanismo_ensenanza, "fund_mecanismo_ensenanza", "Ej: No se explica cómo se articula la enseñanza con la intervención...")}
                      </>
                    )}
                    {activeTab === "diagnostico" && (
                      <>
                        {renderFilaDeEvaluacion("Estado actual del grupo", p.diag_estado_grupo, "diag_estado_grupo", "Ej: No se describe con suficiente detalle la situación actual...")}
                        {renderFilaDeEvaluacion("Problemas detectados", p.diag_problemas_detectados, "diag_problemas_detectados", "Ej: No se adjuntan estadísticas ni diagnóstico real de la problemática...")}
                        {renderFilaDeEvaluacion("Aportes a la formación", p.diag_aportes_formacion, "diag_aportes_formacion", "Ej: No queda claro el aporte formativo para los estudiantes...")}
                        {renderFilaDeEvaluacion("Justificación de la intervención", p.diag_justificacion_intervencion, "diag_justificacion_intervencion", "Ej: La justificación no sustenta la urgencia de la intervención...")}
                      </>
                    )}
                    {activeTab === "objetivos" && (
                      <>
                        {renderFilaDeEvaluacion("Logro esperado en el beneficiario", p.obj_logro_intervencion, "obj_logro_intervencion", "Ej: El objetivo no está redactado con un verbo en infinitivo medible...")}
                        {renderFilaDeEvaluacion("Mejora curricular esperada", p.obj_mejora_curricular, "obj_mejora_curricular", "Ej: No se especifica cómo se mejorará el plan curricular...")}
                        {renderFilaDeEvaluacion("Resultado esperado en beneficiarios", p.resultado_en_beneficiarios, "resultado_en_beneficiarios", "Ej: El resultado esperado no es medible ni verificable...")}
                        {renderFilaDeEvaluacion("Resultado esperado en el currículo", p.resultado_en_curriculo, "resultado_en_curriculo", "Ej: No se explica el impacto en la malla curricular...")}
                        {renderFilaDeEvaluacion("Impacto esperado", p.impacto_esperado, "impacto_esperado", "Ej: El impacto declarado es poco realista para el alcance del proyecto...")}
                      </>
                    )}
                    {activeTab === "actividades" && renderFilaDeEvaluacion("Actividades declaradas", txtActividades(), "actividades", "Ej: Las actividades no cubren todos los objetivos específicos...")}
                    {activeTab === "cronograma" && renderFilaDeEvaluacion("Cronograma de acciones", txtCronograma(), "cronograma", "Ej: El orden de los hitos es inconsistente o se cruza con periodos vacacionales...")}
                    {activeTab === "recursos" && (
                      <>
                        {renderFilaDeEvaluacion("Recursos humanos", txtRecHumanos(), "rec_humanos", "Ej: Las horas asignadas al equipo exceden el máximo por reglamento...")}
                        {renderFilaDeEvaluacion("Recursos materiales", txtRecMateriales(), "rec_materiales", "Ej: Los materiales solicitados no son coherentes con las actividades declaradas...")}
                      </>
                    )}
                    {activeTab === "financiamiento" && (
                      <>
                        {renderFilaDeEvaluacion("Monto de financiamiento solicitado", `S/. ${p.monto_financiamiento ?? "0.00"}`, "monto_financiamiento", "Ej: El monto solicitado supera el tope presupuestal para esta categoría...")}
                        {renderFilaDeEvaluacion("Fuentes de financiamiento y partidas", txtFuentesFinanciamiento(), "fuentes_financiamiento", "Ej: Hay partidas no permitidas en esta convocatoria...")}
                        {renderFilaDeEvaluacion("Descripción de gastos", p.descripcion_gastos, "descripcion_gastos", "Ej: La descripción de gastos no coincide con las partidas declaradas...")}
                        {renderFilaDeEvaluacion("Observaciones de financiamiento (del docente)", p.observaciones_financiamiento, "observaciones_financiamiento", "Ej: Falta aclarar la fuente de contrapartida...")}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cierre y acciones */}
            <div className="border-t border-slate-100 px-6 py-3 shrink-0 bg-white">
              {actionType === 'observar' && selectedProyecto && (
                <div className="mb-3">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Observación general / conclusión del dictamen
                  </label>
                  <textarea
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b1122b]/15 focus:border-[#b1122b] text-slate-700 resize-none placeholder:text-slate-400"
                    rows="2"
                    placeholder="Escriba un resumen de las correcciones que se le solicitan al docente..."
                    value={observacionesCampos.observacion_general || ""}
                    onChange={(e) => handleInputChange("observacion_general", e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={evaluating}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating || !selectedProyecto}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-md flex items-center gap-1.5 transition-colors ${
                    actionType === 'aprobar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#b1122b] hover:bg-[#960f24]'
                  } disabled:opacity-50`}
                >
                  {evaluating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : actionType === 'aprobar' ? (
                    <><FiCheckCircle size={14} /> Confirmar aprobación</>
                  ) : (
                    <><FiXCircle size={14} /> Emitir observaciones</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
}