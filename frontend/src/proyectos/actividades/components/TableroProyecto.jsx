import React, { useState } from "react";
import {
  FiTarget,
  FiTrendingUp,
  FiFilter,
  FiUpload,
  FiFile,
  FiLink,
  FiExternalLink,
  FiPlayCircle,
  FiCheck,
  FiRotateCcw,
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiTrash2,
  FiPlus,
  FiAlertCircle
} from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const construirUrlArchivo = (archivo) => {
  if (!archivo) return "";

  if (archivo.startsWith("http://") || archivo.startsWith("https://")) {
    return archivo;
  }

  return `${BACKEND_URL}${archivo.startsWith("/") ? "" : "/"}${archivo}`;
};

const obtenerColorEstado = (estado) => {
  switch (estado) {
    case "completada":
      return "bg-green-50 text-green-700 border-green-200";

    case "en_ejecucion":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const obtenerTextoEstado = (estado) => {
  switch (estado) {
    case "completada":
      return "Completada";

    case "en_ejecucion":
      return "En ejecución";

    default:
      return "Pendiente";
  }
};

const obtenerColorRevision = (estado) => {
  switch (estado) {
    case "aprobado":
      return "bg-green-50 text-green-700 border-green-200";

    case "observado":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

export default function TableroProyecto({
  proyecto,
  metasIndicadores,
  actividadesFiltradas,
  loadingDetalle,
  filtroEstado,
  setFiltroEstado,
  urlInputs,
  totalActividades,
  actividadesCompletadas,
  porcentajeProgreso,
  avances,
  evidencias,
  onBack,
  onCambiarEstado,
  onRegistrarAvance,
  onSubirEvidencia,
  onGuardarUrl,
  onUpdateUrl,
  onEliminarEvidencia,
  onCorregirAvance
}) {
  const [avanceAbierto, setAvanceAbierto] = useState(null);
  const [descripcionAvance, setDescripcionAvance] = useState("");
  const [observacionesAvance, setObservacionesAvance] = useState("");

  const [mostrarHistorial, setMostrarHistorial] = useState({});

  const obtenerAvancesActividad = (actividadId) => {
    return (avances || []).filter(
      (avance) => avance.actividad === actividadId
    );
  };

  const obtenerUltimoAvance = (actividadId) => {
    const avancesActividad =
      obtenerAvancesActividad(actividadId);

    if (avancesActividad.length === 0) {
      return null;
    }

    return avancesActividad[avancesActividad.length - 1];
  };

  const abrirFormularioAvance = (actividadId) => {
    setAvanceAbierto(actividadId);
    setDescripcionAvance("");
    setObservacionesAvance("");
  };

  const cerrarFormularioAvance = () => {
    setAvanceAbierto(null);
    setDescripcionAvance("");
    setObservacionesAvance("");
  };

  const handleRegistrarAvance = async (actividadId) => {
    if (!descripcionAvance.trim()) {
      return;
    }

    await onRegistrarAvance(
      actividadId,
      descripcionAvance.trim(),
      observacionesAvance.trim()
    );

    cerrarFormularioAvance();
  };

  const alternarHistorial = (actividadId) => {
    setMostrarHistorial((prev) => ({
      ...prev,
      [actividadId]: !prev[actividadId]
    }));
  };

  if (loadingDetalle) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#b1122b] border-t-transparent rounded-full animate-spin" />

        <p className="text-xs text-slate-400 mt-3">
          Cargando información del proyecto...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          ENCABEZADO DEL PROYECTO
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#b1122b] transition-colors mb-4"
        >
          <FiArrowLeft />
          Volver a mis proyectos
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          <div>
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">
              {proyecto?.codigo || `ID #${proyecto?.id}`}
            </span>

            <h2 className="text-lg font-bold text-slate-800 mt-2">
              {proyecto?.titulo}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {proyecto?.escuela_nombre}
              {proyecto?.periodo_nombre &&
                ` — ${proyecto.periodo_nombre}`}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
            <FiTrendingUp className="text-[#b1122b]" />

            <div>
              <p className="text-[10px] text-slate-400">
                Progreso de actividades
              </p>

              <p className="text-sm font-bold text-slate-700">
                {porcentajeProgreso}%
              </p>
            </div>
          </div>

        </div>
      </div>


      {/* =====================================================
          METAS E INDICADORES
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

        <div className="flex items-center gap-2 mb-5">
          <FiTarget className="text-[#b1122b]" />

          <h3 className="text-base font-bold text-slate-800">
            Metas e indicadores
          </h3>
        </div>

        {metasIndicadores?.length > 0 ? (

          <div className="space-y-4">

            {[...metasIndicadores]
              .sort(
                (a, b) =>
                  (a.orden || 0) - (b.orden || 0)
              )
              .map((item, index) => (

                <div
                  key={item.id || index}
                  className="border border-slate-200 rounded-lg p-4"
                >

                  {/* Meta */}
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Meta
                    </p>

                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {item.meta_descripcion || "Sin descripción"}
                    </p>
                  </div>


                  {/* Indicador */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      Indicador
                    </p>

                    <p className="text-sm text-slate-700 mt-1">
                      {item.indicador_nombre || "Sin indicador"}
                    </p>
                  </div>


                  {/* Valores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400">
                        Línea base
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {item.linea_base ?? "—"}
                      </p>
                    </div>


                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400">
                        Valor meta
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {item.valor_meta ?? "—"}
                        {item.unidad_medida &&
                          ` ${item.unidad_medida}`}
                      </p>
                    </div>


                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400">
                        Valor alcanzado
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {item.valor_alcanzado ?? "—"}
                        {item.unidad_medida &&
                          ` ${item.unidad_medida}`}
                      </p>
                    </div>

                  </div>


                  {/* Porcentaje de avance */}
                  {item.porcentaje_avance !== null &&
                    item.porcentaje_avance !== undefined &&
                    item.porcentaje_avance !== "" && (

                      <div className="mt-4">

                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Avance del indicador
                          </p>

                          <p className="text-xs font-bold text-[#b1122b]">
                            {item.porcentaje_avance}
                          </p>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                          <div
                            className="h-full bg-[#b1122b] rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  parseFloat(
                                    item.porcentaje_avance
                                  ) || 0,
                                  0
                                ),
                                100
                              )}%`
                            }}
                          />

                        </div>

                      </div>
                    )}


                  {/* Método de verificación */}
                  {item.metodo_verificacion && (
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Método de verificación
                      </p>

                      <p className="text-sm text-slate-600 mt-1">
                        {item.metodo_verificacion}
                      </p>
                    </div>
                  )}


                  {/* Fuente de verificación */}
                  {item.fuente_verificacion && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Fuente de verificación
                      </p>

                      <p className="text-sm text-slate-600 mt-1">
                        {item.fuente_verificacion}
                      </p>
                    </div>
                  )}

                </div>
              ))}

          </div>

        ) : (

          <div className="py-6 text-center">
            <FiAlertCircle className="mx-auto text-slate-300 text-xl" />

            <p className="text-xs text-slate-400 mt-2">
              Este proyecto no tiene metas e indicadores registrados.
            </p>
          </div>

        )}

      </div>


      {/* =====================================================
          RESUMEN DE ACTIVIDADES
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400">
            Total de actividades
          </p>

          <p className="text-xl font-bold text-slate-700 mt-1">
            {totalActividades}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400">
            Actividades completadas
          </p>

          <p className="text-xl font-bold text-green-600 mt-1">
            {actividadesCompletadas}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400">
            Progreso
          </p>

          <p className="text-xl font-bold text-[#b1122b] mt-1">
            {porcentajeProgreso}%
          </p>
        </div>

      </div>


      {/* =====================================================
          FILTRO
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">

        <div className="flex items-center gap-2">

          <FiFilter className="text-slate-400" />

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            className="text-xs border-0 outline-none bg-transparent font-medium text-slate-600"
          >
            <option value="todos">
              Todas las actividades
            </option>

            <option value="pendiente">
              Pendientes
            </option>

            <option value="en_ejecucion">
              En ejecución
            </option>

            <option value="completada">
              Completadas
            </option>
          </select>

        </div>

      </div>


      {/* =====================================================
          ACTIVIDADES
      ===================================================== */}

      <div className="space-y-4">

        {actividadesFiltradas?.length > 0 ? (

          actividadesFiltradas.map((actividad) => {

            const avancesActividad =
              obtenerAvancesActividad(actividad.id);

            const ultimoAvance =
              obtenerUltimoAvance(actividad.id);

            const historialAbierto =
              mostrarHistorial[actividad.id];

            const estadoColor =
              obtenerColorEstado(actividad.estado);

            return (
              <div
                key={actividad.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >

                {/* =================================================
                    INFORMACIÓN DE LA ACTIVIDAD
                ================================================= */}

                <div className="p-5">

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                    <div className="flex-1">

                      <div className="flex items-start gap-3">

                        <div className="w-8 h-8 rounded-lg bg-[#b1122b]/10 text-[#b1122b] flex items-center justify-center shrink-0">
                          <FiCheckCircle />
                        </div>

                        <div>

                          <h4 className="text-sm font-bold text-slate-800">
                            {actividad.nombre}
                          </h4>

                          {actividad.descripcion && (
                            <p className="text-sm text-slate-500 mt-1">
                              {actividad.descripcion}
                            </p>
                          )}

                        </div>

                      </div>


                      {/* Datos */}
                      <div className="flex flex-wrap gap-3 mt-4">

                        {actividad.fecha && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <FiCalendar />
                            {actividad.fecha}
                          </span>
                        )}

                        {actividad.responsable && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <FiUser />
                            {actividad.responsable}
                          </span>
                        )}

                        {actividad.curso_vinculado && (
                          <span className="text-xs text-slate-500">
                            Curso: {actividad.curso_vinculado}
                          </span>
                        )}

                      </div>

                    </div>


                    {/* Estado */}
                    <div className="flex items-center gap-2">

                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${estadoColor}`}
                      >
                        {obtenerTextoEstado(
                          actividad.estado
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onCambiarEstado(
                            actividad.id,
                            actividad.estado
                          )
                        }
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#b1122b] text-white hover:bg-[#8a0e21] transition-colors"
                      >
                        {actividad.estado === "pendiente" && (
                          <>
                            <FiPlayCircle className="inline mr-1" />
                            Iniciar
                          </>
                        )}

                        {actividad.estado === "en_ejecucion" && (
                          <>
                            <FiCheck className="inline mr-1" />
                            Completar
                          </>
                        )}

                        {actividad.estado === "completada" && (
                          <>
                            <FiRotateCcw className="inline mr-1" />
                            Reiniciar
                          </>
                        )}
                      </button>

                    </div>

                  </div>


                  {/* Evidencia esperada */}
                  {actividad.evidencia_esperada && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-3">

                      <div className="flex items-center gap-2">
                        <FiFile className="text-slate-400" />

                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Evidencia esperada
                        </p>
                      </div>

                      <p className="text-sm text-slate-600 mt-1">
                        {actividad.evidencia_esperada}
                      </p>

                    </div>
                  )}

                </div>


                {/* =================================================
                    ÚLTIMO AVANCE
                ================================================= */}

                {ultimoAvance && (
                  <div className="border-t border-slate-100 p-5">

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">
                        <FiTrendingUp className="text-[#b1122b]" />

                        <h5 className="text-xs font-bold text-slate-700">
                          Último avance registrado
                        </h5>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${obtenerColorRevision(
                          ultimoAvance.estado_revision
                        )}`}
                      >
                        {ultimoAvance.estado_revision ||
                          "registrado"}
                      </span>

                    </div>


                    {ultimoAvance.descripcion && (
                      <p className="text-sm text-slate-600">
                        {ultimoAvance.descripcion}
                      </p>
                    )}

                    {ultimoAvance.observaciones && (
                      <div className="mt-3">

                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Observaciones
                        </p>

                        <p className="text-sm text-slate-600 mt-1">
                          {ultimoAvance.observaciones}
                        </p>

                      </div>
                    )}


                    {ultimoAvance.comentario_revision && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">

                        <div className="flex items-center gap-2">
                          <FiMessageSquare className="text-red-500" />

                          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                            Comentario de revisión
                          </p>
                        </div>

                        <p className="text-sm text-red-700 mt-1">
                          {ultimoAvance.comentario_revision}
                        </p>

                      </div>
                    )}

                  </div>
                )}


                {/* =================================================
                    REGISTRAR AVANCE
                ================================================= */}

                <div className="border-t border-slate-100 p-5">

                  {avanceAbierto === actividad.id ? (

                    <div className="space-y-3">

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Descripción del avance
                        </label>

                        <textarea
                          value={descripcionAvance}
                          onChange={(e) =>
                            setDescripcionAvance(
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-[#b1122b]"
                          placeholder="Describe lo realizado..."
                        />
                      </div>


                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          Observaciones
                        </label>

                        <textarea
                          value={observacionesAvance}
                          onChange={(e) =>
                            setObservacionesAvance(
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-[#b1122b]"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>


                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleRegistrarAvance(
                              actividad.id
                            )
                          }
                          disabled={!descripcionAvance.trim()}
                          className="px-4 py-2 rounded-lg bg-[#b1122b] text-white text-xs font-semibold hover:bg-[#8a0e21] transition-colors disabled:opacity-50"
                        >
                          Guardar avance
                        </button>

                        <button
                          type="button"
                          onClick={cerrarFormularioAvance}
                          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>

                      </div>

                    </div>

                  ) : (

                    <button
                      type="button"
                      onClick={() =>
                        abrirFormularioAvance(
                          actividad.id
                        )
                      }
                      className="flex items-center gap-2 text-xs font-semibold text-[#b1122b] hover:text-[#8a0e21] transition-colors"
                    >
                      <FiPlus />
                      Registrar avance
                    </button>

                  )}

                </div>


                {/* =================================================
                    HISTORIAL
                ================================================= */}

                {avancesActividad.length > 0 && (
                  <div className="border-t border-slate-100">

                    <button
                      type="button"
                      onClick={() =>
                        alternarHistorial(
                          actividad.id
                        )
                      }
                      className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <span>
                        Historial de avances (
                        {avancesActividad.length}
                        )
                      </span>

                      <span>
                        {historialAbierto ? "−" : "+"}
                      </span>
                    </button>


                    {historialAbierto && (
                      <div className="px-5 pb-5 space-y-3">

                        {avancesActividad.map(
                          (avance) => (

                            <div
                              key={avance.id}
                              className="border border-slate-200 rounded-lg p-4"
                            >

                              <div className="flex justify-between gap-3">

                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {avance.descripcion ||
                                      "Sin descripción"}
                                  </p>

                                  {avance.created_at && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {new Date(
                                        avance.created_at
                                      ).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`h-fit text-[10px] px-2 py-1 rounded-full border ${obtenerColorRevision(
                                    avance.estado_revision
                                  )}`}
                                >
                                  {avance.estado_revision ||
                                    "registrado"}
                                </span>

                              </div>


                              {avance.observaciones && (
                                <p className="text-sm text-slate-500 mt-3">
                                  {avance.observaciones}
                                </p>
                              )}


                              {/* Evidencias */}
                              {(evidencias?.[avance.id] || [])
                                .length > 0 && (

                                <div className="mt-4 space-y-2">

                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                    Evidencias
                                  </p>

                                  {evidencias[avance.id].map(
                                    (evidencia) => {

                                      const enlace =
                                        evidencia.tipo === "enlace"
                                          ? evidencia.enlace_drive
                                          : construirUrlArchivo(
                                              evidencia.archivo
                                            );

                                      return (
                                        <div
                                          key={evidencia.id}
                                          className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2"
                                        >

                                         <a 
                                            href={enlace}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 text-xs font-medium text-[#b1122b] hover:text-[#8a0e21] transition-colors min-w-0"
                                          >
                                            {evidencia.tipo === "enlace" ? (
                                              <FiLink />
                                            ) : (
                                              <FiFile />
                                            )}

                                            <span className="truncate">
                                              {evidencia.nombre ||
                                                "Ver evidencia"}
                                            </span>

                                            <FiExternalLink className="shrink-0" />
                                          </a>


                                          <button
                                            type="button"
                                            onClick={() =>
                                              onEliminarEvidencia(
                                                avance.id,
                                                evidencia.id
                                              )
                                            }
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            title="Eliminar evidencia"
                                          >
                                            <FiTrash2 />
                                          </button>

                                        </div>
                                      );
                                    }
                                  )}

                                </div>
                              )}


                              {/* Subir evidencia */}
                              <div className="mt-4 flex flex-col gap-3">

                                <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer text-xs font-medium text-slate-500 hover:border-[#b1122b] hover:text-[#b1122b] transition-colors">
                                  <FiUpload />

                                  Subir archivo

                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file =
                                        e.target.files?.[0];

                                      if (file) {
                                        onSubirEvidencia(
                                          avance.id,
                                          file
                                        );
                                      }

                                      e.target.value = "";
                                    }}
                                  />
                                </label>


                                <div className="flex gap-2">

                                  <input
                                    type="url"
                                    value={
                                      urlInputs?.[avance.id] || ""
                                    }
                                    onChange={(e) =>
                                      onUpdateUrl(
                                        avance.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Pegar enlace de Google Drive"
                                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#b1122b]"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onGuardarUrl(
                                        avance.id
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                    title="Guardar enlace"
                                  >
                                    <FiLink />
                                  </button>

                                </div>

                              </div>


                              {/* Corregir */}
                              {avance.estado_revision === "observado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onCorregirAvance(
                                      avance.id
                                    )
                                  }
                                  className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                >
                                  <FiCheck />
                                  Marcar como corregido
                                </button>
                              )}

                            </div>

                          )
                        )}

                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })

        ) : (

          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">

            <FiCheckCircle className="mx-auto text-slate-300 text-2xl" />

            <p className="text-sm font-semibold text-slate-600 mt-3">
              No hay actividades para mostrar
            </p>

            <p className="text-xs text-slate-400 mt-1">
              No existen actividades que coincidan con el filtro seleccionado.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}