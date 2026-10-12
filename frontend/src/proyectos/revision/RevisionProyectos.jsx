import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../shared/layout/Layout";
import {
  FiCheckCircle,
  FiXCircle,
  FiInbox,
  FiTarget,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiEye,
  FiX,
  FiAlertCircle,
  FiUsers,
  FiActivity,
  FiChevronRight,
} from "react-icons/fi";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRevision } from "./hooks/useRevision";
import ReporteExpediente from "../../shared/components/ReporteExpediente";

const SECCIONES = [
  {
    id: "general",
    label: "Datos generales",
    icon: FiFileText,
    keys: [
      "unidad_academica",
      "periodo_semestre",
      "titulo",
      "asignaturas",
      "anio_carrera",
      "num_docentes_estudiantes",
      "lugar_ejecucion",
      "beneficiarios",
      "eje_rsu",
      "ejes_subitems",
      "tipo_actividad",
      "ods",
      "metas_indicadores",
      "fechas_clave",
    ],
  },
  {
    id: "fundamentacion",
    label: "Fundamentación",
    icon: FiFileText,
    keys: [
      "fund_por_que_grupo",
      "fund_para_que_proyecto",
      "fund_mecanismo_ensenanza",
    ],
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    icon: FiTarget,
    keys: [
      "diag_estado_grupo",
      "diag_problemas_detectados",
      "diag_aportes_formacion",
      "diag_justificacion_intervencion",
    ],
  },
  {
    id: "objetivos",
    label: "Objetivos y resultados",
    icon: FiTarget,
    keys: [
      "obj_logro_intervencion",
      "obj_mejora_curricular",
      "resultado_en_beneficiarios",
      "resultado_en_curriculo",
      "impacto_esperado",
    ],
  },
  {
    id: "actividades",
    label: "Actividades",
    icon: FiActivity,
    keys: ["actividades"],
  },
  {
    id: "cronograma",
    label: "Cronograma",
    icon: FiCalendar,
    keys: ["cronograma"],
  },
  {
    id: "recursos",
    label: "Recursos",
    icon: FiUsers,
    keys: ["rec_humanos", "rec_materiales"],
  },
  {
    id: "financiamiento",
    label: "Financiamiento",
    icon: FiDollarSign,
    keys: [
      "monto_financiamiento",
      "fuentes_financiamiento",
      "descripcion_gastos",
      "observaciones_financiamiento",
    ],
  },
];

const getIniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export default function RevisionProyectos() {
  const navigate = useNavigate();

  const {
    proyectos,
    loading,
    modalOpen,
    setModalOpen,
    selectedProyecto,
    codigoProyecto,
    setCodigoProyecto,
    observacionesCampos,
    evaluating,
    actionType,
    activeTab,
    setActiveTab,
    loadingDetalle,
    modalVistaOpen,
    setModalVistaOpen,
    proyectoDetalle,
    loadingVista,
    fetchProyectos,
    openModalVisualizacion,
    openModalRevision,
    handleInputChange,
    handleEvaluate,
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

    try {
      return format(parseISO(fechaString), "dd/MM/yyyy HH:mm", {
        locale: es,
      });
    } catch {
      return "-";
    }
  };

  const conteosPorSeccion = useMemo(() => {
    const mapa = {};

    SECCIONES.forEach((sec) => {
      mapa[sec.id] = sec.keys.filter((key) =>
        observacionesCampos[key]?.trim()
      ).length;
    });

    return mapa;
  }, [observacionesCampos]);

  const totalObservaciones = useMemo(
    () => Object.values(conteosPorSeccion).reduce((a, b) => a + b, 0),
    [conteosPorSeccion]
  );

  const renderFilaDeEvaluacion = (
    tituloCampo,
    valorOriginal,
    campoKey,
    placeholder = "Describa la observación..."
  ) => {
    const esObservar = actionType === "observar";
    const tieneObservacion =
      esObservar && observacionesCampos[campoKey]?.trim();

    return (
      <div
        key={campoKey}
        className={`rounded-lg border border-slate-200 border-l-[3px] bg-white transition-colors ${
          tieneObservacion
            ? "border-l-[#b1122b]"
            : "border-l-slate-200"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <h4 className="m-0 text-sm font-semibold text-slate-700">
            {tituloCampo}
          </h4>

          {tieneObservacion && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#b1122b]">
              <FiAlertCircle size={12} />
              Observado
            </span>
          )}
        </div>

        <div
          className={`grid gap-4 px-4 pb-4 ${
            esObservar ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div
            className={
              esObservar
                ? "min-w-0 md:border-r md:border-slate-100 md:pr-4"
                : "min-w-0"
            }
          >
            <span className="mb-1 block text-[11px] text-slate-400">
              Declarado por el docente
            </span>

            <p className="m-0 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">
              {valorOriginal || (
                <span className="italic text-slate-400">
                  Sin registrar
                </span>
              )}
            </p>
          </div>

          {esObservar && (
            <div className="min-w-0">
              <label className="mb-1 block text-[11px] text-slate-400">
                Observación del revisor
              </label>

              <textarea
                className="min-h-[64px] w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#b1122b] focus:outline-none focus:ring-2 focus:ring-[#b1122b]/15"
                rows={3}
                placeholder={placeholder}
                value={observacionesCampos[campoKey] || ""}
                onChange={(e) =>
                  handleInputChange(campoKey, e.target.value)
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const p = selectedProyecto || {};

  const txtBeneficiarios = () => {
    const lista = (p.beneficiarios_info || [])
      .map((b) => b.label)
      .join(", ");

    return (
      [
        lista,
        p.benef_otro_detalle ? `Otro: ${p.benef_otro_detalle}` : "",
      ]
        .filter(Boolean)
        .join(" — ") || ""
    );
  };

  const txtEjeRsu = () => {
    const lista = (p.ejes_rsu_info || [])
      .map((e) => e.nombre)
      .join(", ");

    return (
      [
        lista,
        p.eje_detalle ? `Detalle: ${p.eje_detalle}` : "",
      ]
        .filter(Boolean)
        .join(" — ") || ""
    );
  };

  const txtEjesSubitems = () =>
    (p.ejes_subitems || [])
      .map(
        (s) =>
          `• ${s.sub_eje_nombre}${s.detalle ? `: ${s.detalle}` : ""}`
      )
      .join("\n") || "";

  const txtTipoActividad = () => {
    const lista = (p.tipo_actividad_display || []).join(", ");

    return (
      [
        lista,
        p.tipo_actividad_otro ? `Otro: ${p.tipo_actividad_otro}` : "",
      ]
        .filter(Boolean)
        .join(" — ") || ""
    );
  };

  const txtOds = () =>
    (p.ods_info || [])
      .map((o) => `ODS ${o.numero}: ${o.nombre}`)
      .join(", ") || "";

  const txtMetasIndicadores = () =>
    (p.metas_indicadores || [])
      .map(
        (m) =>
          `• ${m.meta_descripcion}\n  Indicador: ${m.indicador_nombre} | Meta: ${
            m.valor_meta ?? "-"
          } ${m.unidad_medida || ""} (Línea base: ${
            m.linea_base ?? "-"
          })`
      )
      .join("\n\n") || "";

  const txtFechasClave = () =>
    [
      `Inicio: ${formatearFecha(p.fecha_inicio)}`,
      `Evaluación de avance: ${formatearFecha(p.fecha_evaluacion_avance)}`,
      `Término: ${formatearFecha(p.fecha_termino)}`,
      `Encuesta docentes: ${formatearFecha(p.fecha_encuesta_docentes)}`,
      `Encuesta alumnos: ${formatearFecha(p.fecha_encuesta_alumnos)}`,
      `Encuesta grupo destinatario: ${formatearFecha(
        p.fecha_encuesta_grupo_destinatario
      )}`,
    ].join("\n");

  const txtActividades = () =>
    (p.actividades || [])
      .map(
        (a) =>
          `• ${a.nombre}\n  ${a.descripcion || ""}\n  Responsable: ${
            a.responsable || "-"
          } | Fecha: ${a.fecha || "-"}\n  Evidencia esperada: ${
            a.evidencia_esperada || "-"
          }`
      )
      .join("\n\n") || "";

  const txtCronograma = () =>
    (p.cronograma || [])
      .map(
        (c) =>
          `• ${c.descripcion}\n  Del ${c.fecha_inicio || "-"} al ${
            c.fecha_fin || "-"
          } | Responsable: ${c.responsable || "-"} | Estado: ${
            c.estado_avance || "-"
          }`
      )
      .join("\n\n") || "";

  const txtRecHumanos = () =>
    [
      `Docentes: ${p.rec_hum_docentes ?? 0}`,
      `Administrativos: ${p.rec_hum_administrativos ?? 0}`,
      `Estudiantes: ${p.rec_hum_estudiantes ?? 0}`,
      `Egresados: ${p.rec_hum_egresados ?? 0}`,
      `Voluntarios: ${p.rec_hum_voluntarios ?? 0}`,
      `Otros: ${p.rec_hum_otros ?? 0}`,
    ].join(" | ");

  const txtRecMateriales = () =>
    [
      p.rec_mat_material_didactico &&
        `Material didáctico: ${p.rec_mat_material_didactico}`,
      p.rec_mat_afiches && `Afiches: ${p.rec_mat_afiches}`,
      p.rec_mat_equipos && `Equipos: ${p.rec_mat_equipos}`,
      p.rec_mat_utiles && `Útiles: ${p.rec_mat_utiles}`,
      p.rec_mat_otros && `Otros: ${p.rec_mat_otros}`,
    ]
      .filter(Boolean)
      .join("\n") || "";

  const txtFuentesFinanciamiento = () =>
    (p.fuentes_financiamiento || [])
      .map((f) => {
        const partidas = (f.partidas || [])
          .map(
            (pa) =>
              `    - ${pa.descripcion} (${pa.cantidad} x S/. ${
                pa.costo_unitario
              }) = S/. ${pa.monto_presupuestado}`
          )
          .join("\n");

        return `• ${f.fuente_display || f.fuente}: S/. ${f.monto}${
          f.descripcion ? ` — ${f.descripcion}` : ""
        }\n${partidas}`;
      })
      .join("\n\n") || "";

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col space-y-6 p-6 md:p-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              Revisión de proyectos RSU
            </h1>

            <p className="m-0 mt-1 text-sm text-slate-500">
              Evalúa cada expediente enviado por los docentes y registra
              observaciones por sección.
            </p>
          </div>

          {!loading && proyectos.length > 0 && (
            <span className="shrink-0 text-sm text-slate-400">
              {proyectos.length} pendiente
              {proyectos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Bandeja de proyectos */}
        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-400 md:p-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#b1122b] border-t-transparent" />
              Cargando bandeja de revisión...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center md:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-400">
                <FiInbox />
              </div>

              <p className="m-0 text-sm font-semibold text-slate-700">
                No hay proyectos pendientes de revisión
              </p>

              <p className="m-0 text-xs text-slate-400">
                Los nuevos envíos aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Proyecto
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Coordinador
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Enviado
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium md:px-6">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {proyectos.map((proyecto) => (
                    <tr
                      key={proyecto.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="max-w-md px-4 py-4 md:px-6">
                        <span className="mb-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {proyecto.codigo || "S/C"}
                        </span>

                        <div className="line-clamp-2 font-medium leading-snug text-slate-800">
                          {proyecto.titulo || "Proyecto sin título"}
                        </div>
                      </td>

                      <td className="px-4 py-4 md:px-6">
                        <div className="flex min-w-[160px] items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                            {getIniciales(
                              proyecto.docente_responsable_nombre
                            )}
                          </div>

                          <span className="text-slate-600">
                            {proyecto.docente_responsable_nombre ||
                              "Docente"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 md:px-6">
                        {formatearFecha(proyecto.fecha_envio_revision)}
                      </td>

                      <td className="px-4 py-4 md:px-6">
                        <div className="flex min-w-[300px] items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                            onClick={() =>
                              openModalVisualizacion(proyecto)
                            }
                          >
                            <FiEye size={13} />
                            Ver
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                            onClick={() =>
                              openModalRevision(proyecto, "aprobar")
                            }
                          >
                            <FiCheckCircle size={13} />
                            Aprobar
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#960f24]"
                            onClick={() =>
                              openModalRevision(proyecto, "observar")
                            }
                          >
                            <FiXCircle size={13} />
                            Observar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal de visualización del expediente */}
      {modalVistaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-slate-800">
                <FiEye />
                Expediente completo
              </h2>

              <button
                type="button"
                aria-label="Cerrar expediente"
                onClick={() => setModalVistaOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loadingVista ? (
                <div className="animate-pulse py-10 text-center text-sm text-slate-400">
                  Cargando expediente...
                </div>
              ) : (
                <ReporteExpediente
                  matrizSeleccionada={proyectoDetalle}
                  showPrintButton={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de evaluación integral */}
      {modalOpen && selectedProyecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[96vh] max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl md:h-[92vh] md:max-h-[92vh]">
            {/* Encabezado */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 md:px-6">
              <div className="min-w-0">
                <div className="mb-0.5 flex items-center gap-2">
                  {actionType === "aprobar" ? (
                    <FiCheckCircle
                      className="shrink-0 text-emerald-600"
                      size={18}
                    />
                  ) : (
                    <FiXCircle
                      className="shrink-0 text-[#b1122b]"
                      size={18}
                    />
                  )}

                  <h2 className="m-0 text-base font-semibold text-slate-800">
                    {actionType === "aprobar"
                      ? "Aprobar plan de trabajo"
                      : "Registrar observaciones"}
                  </h2>
                </div>

                <p className="m-0 break-words text-xs text-slate-500">
                  {p.titulo}
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar evaluación"
                onClick={() => setModalOpen(false)}
                disabled={evaluating}
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* Navegación lateral */}
              <nav className="hidden w-56 shrink-0 overflow-y-auto border-r border-slate-100 bg-slate-50/50 py-3 sm:block">
                {SECCIONES.map((sec) => {
                  const Icon = sec.icon;
                  const activa = activeTab === sec.id;
                  const count = conteosPorSeccion[sec.id];

                  return (
                    <button
                      type="button"
                      key={sec.id}
                      onClick={() => setActiveTab(sec.id)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                        activa
                          ? "bg-white font-semibold text-[#b1122b]"
                          : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={
                          activa ? "text-[#b1122b]" : "text-slate-400"
                        }
                      />

                      <span className="min-w-0 flex-1">
                        {sec.label}
                      </span>

                      {actionType === "observar" && count > 0 && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#b1122b]/10 text-[10px] font-semibold text-[#b1122b]">
                          {count}
                        </span>
                      )}

                      {activa && (
                        <FiChevronRight
                          size={13}
                          className="shrink-0 text-[#b1122b]"
                        />
                      )}
                    </button>
                  );
                })}

                {actionType === "observar" && (
                  <div className="mx-4 mt-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                    {totalObservaciones} observación
                    {totalObservaciones !== 1 ? "es" : ""} registrada
                    {totalObservaciones !== 1 ? "s" : ""}
                  </div>
                )}
              </nav>

              {/* Contenido de evaluación */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Navegación adaptable para pantallas pequeñas */}
                <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 sm:hidden">
                  <label
                    htmlFor="revision-seccion"
                    className="mb-1.5 block text-xs font-medium text-slate-500"
                  >
                    Sección del expediente
                  </label>

                  <select
                    id="revision-seccion"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10"
                  >
                    {SECCIONES.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.label}
                        {actionType === "observar" &&
                        conteosPorSeccion[sec.id] > 0
                          ? ` (${conteosPorSeccion[sec.id]})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {actionType === "observar" && (
                    <p className="mb-0 mt-2 text-[11px] text-slate-400">
                      {totalObservaciones} observación
                      {totalObservaciones !== 1 ? "es" : ""} registrada
                      {totalObservaciones !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-6">
                  {loadingDetalle || !selectedProyecto ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-slate-400">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#b1122b]" />
                      Sincronizando expediente...
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-3">
                      {activeTab === "general" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "Unidad académica",
                            `${p.facultad_nombre || "-"} > ${
                              p.escuela_nombre || "-"
                            } > ${p.departamento_nombre || "-"}`,
                            "unidad_academica",
                            "Ej: La escuela seleccionada no corresponde a la facultad indicada..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Periodo académico y semestre",
                            `${p.periodo_nombre || "-"} — Semestre: ${
                              p.semestre_academico || "-"
                            }`,
                            "periodo_semestre",
                            "Ej: El periodo consignado ya se encuentra cerrado..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Título del proyecto",
                            p.titulo,
                            "titulo",
                            "Ej: El título es confuso o no refleja las actividades de RSU..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Asignaturas vinculadas",
                            (p.asignaturas || [])
                              .map((a) => a.nombre_asignatura)
                              .join(", "),
                            "asignaturas",
                            "Ej: Las asignaturas declaradas no corresponden a la malla curricular..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Año de carrera / tesis de 5to año",
                            `${p.anio_carrera_display || "-"}${
                              p.es_tesis_quinto_anio
                                ? " (marcado como tesis de 5to año)"
                                : ""
                            }`,
                            "anio_carrera",
                            "Ej: No corresponde marcar tesis de 5to año para este año de carrera..."
                          )}

                          {renderFilaDeEvaluacion(
                            "N.º de docentes / estudiantes",
                            `Docentes: ${p.nro_docentes ?? "-"} | Estudiantes: ${
                              p.nro_estudiantes ?? "-"
                            }`,
                            "num_docentes_estudiantes",
                            "Ej: El número de estudiantes declarado excede el máximo permitido..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Lugar de ejecución",
                            p.lugar_ejecucion,
                            "lugar_ejecucion",
                            "Ej: La zona de intervención está fuera de la cobertura autorizada..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Beneficiarios",
                            txtBeneficiarios(),
                            "beneficiarios",
                            "Ej: El detalle de 'otro beneficiario' es insuficiente..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Eje RSU",
                            txtEjeRsu(),
                            "eje_rsu",
                            "Ej: El eje seleccionado no guarda coherencia con el problema planteado..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Sub-ejes / detalle",
                            txtEjesSubitems(),
                            "ejes_subitems",
                            "Ej: Falta precisar el sub-eje vinculado a la actividad principal..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Tipo de actividad",
                            txtTipoActividad(),
                            "tipo_actividad",
                            "Ej: El tipo de actividad declarado no corresponde a lo descrito..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Objetivos de Desarrollo Sostenible",
                            txtOds(),
                            "ods",
                            "Ej: No se justifica la vinculación directa con el ODS marcado..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Metas e indicadores de logro",
                            txtMetasIndicadores(),
                            "metas_indicadores",
                            "Ej: Las metas planteadas son insuficientes para medir el impacto..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Fechas clave del proyecto",
                            txtFechasClave(),
                            "fechas_clave",
                            "Ej: La fecha de término es anterior a la fecha de evaluación de avance..."
                          )}
                        </>
                      )}

                      {activeTab === "fundamentacion" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "¿Por qué se trabaja con este grupo?",
                            p.fund_por_que_grupo,
                            "fund_por_que_grupo",
                            "Ej: No se justifica adecuadamente la elección del grupo beneficiario..."
                          )}

                          {renderFilaDeEvaluacion(
                            "¿Para qué se realiza este proyecto?",
                            p.fund_para_que_proyecto,
                            "fund_para_que_proyecto",
                            "Ej: El propósito no está alineado con los objetivos institucionales..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Mecanismo de enseñanza-aprendizaje",
                            p.fund_mecanismo_ensenanza,
                            "fund_mecanismo_ensenanza",
                            "Ej: No se explica cómo se articula la enseñanza con la intervención..."
                          )}
                        </>
                      )}

                      {activeTab === "diagnostico" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "Estado actual del grupo",
                            p.diag_estado_grupo,
                            "diag_estado_grupo",
                            "Ej: No se describe con suficiente detalle la situación actual..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Problemas detectados",
                            p.diag_problemas_detectados,
                            "diag_problemas_detectados",
                            "Ej: No se adjuntan estadísticas ni diagnóstico real de la problemática..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Aportes a la formación",
                            p.diag_aportes_formacion,
                            "diag_aportes_formacion",
                            "Ej: No queda claro el aporte formativo para los estudiantes..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Justificación de la intervención",
                            p.diag_justificacion_intervencion,
                            "diag_justificacion_intervencion",
                            "Ej: La justificación no sustenta la urgencia de la intervención..."
                          )}
                        </>
                      )}

                      {activeTab === "objetivos" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "Logro esperado en el beneficiario",
                            p.obj_logro_intervencion,
                            "obj_logro_intervencion",
                            "Ej: El objetivo no está redactado con un verbo en infinitivo medible..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Mejora curricular esperada",
                            p.obj_mejora_curricular,
                            "obj_mejora_curricular",
                            "Ej: No se especifica cómo se mejorará el plan curricular..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Resultado esperado en beneficiarios",
                            p.resultado_en_beneficiarios,
                            "resultado_en_beneficiarios",
                            "Ej: El resultado esperado no es medible ni verificable..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Resultado esperado en el currículo",
                            p.resultado_en_curriculo,
                            "resultado_en_curriculo",
                            "Ej: No se explica el impacto en la malla curricular..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Impacto esperado",
                            p.impacto_esperado,
                            "impacto_esperado",
                            "Ej: El impacto declarado es poco realista para el alcance del proyecto..."
                          )}
                        </>
                      )}

                      {activeTab === "actividades" &&
                        renderFilaDeEvaluacion(
                          "Actividades declaradas",
                          txtActividades(),
                          "actividades",
                          "Ej: Las actividades no cubren todos los objetivos específicos..."
                        )}

                      {activeTab === "cronograma" &&
                        renderFilaDeEvaluacion(
                          "Cronograma de acciones",
                          txtCronograma(),
                          "cronograma",
                          "Ej: El orden de los hitos es inconsistente o se cruza con periodos vacacionales..."
                        )}

                      {activeTab === "recursos" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "Recursos humanos",
                            txtRecHumanos(),
                            "rec_humanos",
                            "Ej: Las horas asignadas al equipo exceden el máximo por reglamento..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Recursos materiales",
                            txtRecMateriales(),
                            "rec_materiales",
                            "Ej: Los materiales solicitados no son coherentes con las actividades declaradas..."
                          )}
                        </>
                      )}

                      {activeTab === "financiamiento" && (
                        <>
                          {renderFilaDeEvaluacion(
                            "Monto de financiamiento solicitado",
                            `S/. ${p.monto_financiamiento ?? "0.00"}`,
                            "monto_financiamiento",
                            "Ej: El monto solicitado supera el tope presupuestal para esta categoría..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Fuentes de financiamiento y partidas",
                            txtFuentesFinanciamiento(),
                            "fuentes_financiamiento",
                            "Ej: Hay partidas no permitidas en esta convocatoria..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Descripción de gastos",
                            p.descripcion_gastos,
                            "descripcion_gastos",
                            "Ej: La descripción de gastos no coincide con las partidas declaradas..."
                          )}

                          {renderFilaDeEvaluacion(
                            "Observaciones de financiamiento (del docente)",
                            p.observaciones_financiamiento,
                            "observaciones_financiamiento",
                            "Ej: Falta aclarar la fuente de contrapartida..."
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pie del modal y acciones */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-6">
              {actionType === "aprobar" && (
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Código alfanumérico del proyecto
                  </label>

                  <input
                    type="text"
                    value={codigoProyecto}
                    onChange={(e) =>
                      setCodigoProyecto(
                        e.target.value
                          .replace(/[^a-zA-Z0-9-]/g, "")
                          .toUpperCase()
                      )
                    }
                    placeholder="Ej. RSU-2026-A12"
                    maxLength={30}
                    required
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <p className="mb-0 mt-1 text-[11px] text-slate-400">
                    Solo letras, números y guiones.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={evaluating}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={
                    evaluating ||
                    !selectedProyecto ||
                    (actionType === "aprobar" && !codigoProyecto.trim())
                  }
                  className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    actionType === "aprobar"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-[#b1122b] hover:bg-[#960f24]"
                  }`}
                >
                  {evaluating ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Procesando...
                    </>
                  ) : actionType === "aprobar" ? (
                    <>
                      <FiCheckCircle size={14} />
                      Confirmar aprobación
                    </>
                  ) : (
                    <>
                      <FiXCircle size={14} />
                      Emitir observaciones
                    </>
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
