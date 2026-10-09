import React, { useState } from "react";
import {
  FiTrendingUp,
  FiFilter,
  FiUpload,
  FiFile,
  FiLink,
  FiExternalLink,
  FiCheck,
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiMessageSquare,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";

const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const construirUrlArchivo = (archivo) => {
  if (!archivo) return "";

  if (/^https?:\/\//i.test(archivo)) {
    return archivo;
  }

  return `${BACKEND_URL}${archivo.startsWith("/") ? "" : "/"}${archivo}`;
};

const obtenerColorEstado = (estado) => {
  switch (estado) {
    case "completada":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "observado":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

export default function TableroProyecto({
  proyecto,
  metasIndicadores = [],
  actividadesFiltradas = [],
  loadingDetalle = false,
  filtroEstado = "todos",
  setFiltroEstado,
  totalActividades = 0,
  actividadesCompletadas = 0,
  porcentajeProgreso = 0,
  avances = [],
  evidencias = {},
  onBack,
  onRegistrarEvidencia,
  onEliminarEvidencia,
  onObservarAvance,
  onCorregirAvance,
}) {
  const [avanceAbierto, setAvanceAbierto] = useState(null);
  const [tipoEvidencia, setTipoEvidencia] = useState("archivo");
  const [archivoEvidencia, setArchivoEvidencia] = useState(null);
  const [enlaceEvidencia, setEnlaceEvidencia] = useState("");
  const [observacionEvidencia, setObservacionEvidencia] = useState("");
  const [guardandoEvidencia, setGuardandoEvidencia] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState({});
  const [archivoInputKey, setArchivoInputKey] = useState(0);

  const listaAvances = Array.isArray(avances) ? avances : [];
  const listaActividades = Array.isArray(actividadesFiltradas)
    ? actividadesFiltradas
    : [];

  const obtenerAvancesActividad = (actividadId) =>
    listaAvances.filter((avance) => {
      const idActividad =
        typeof avance.actividad === "object"
          ? avance.actividad?.id
          : avance.actividad;

      return Number(idActividad) === Number(actividadId);
    });

  const obtenerUltimoAvance = (actividadId) => {
    const lista = obtenerAvancesActividad(actividadId);
    return lista.length > 0 ? lista[lista.length - 1] : null;
  };

  const obtenerEvidencias = (avance) => {
    const lista = evidencias?.[avance.id] ?? avance.evidencias ?? [];
    return Array.isArray(lista) ? lista : [];
  };

  const abrirFormularioEvidencia = (actividadId) => {
    setAvanceAbierto(actividadId);
    setTipoEvidencia("archivo");
    setArchivoEvidencia(null);
    setEnlaceEvidencia("");
    setObservacionEvidencia("");
    setArchivoInputKey((prev) => prev + 1);
  };

  const cerrarFormularioEvidencia = () => {
    setAvanceAbierto(null);
    setTipoEvidencia("archivo");
    setArchivoEvidencia(null);
    setEnlaceEvidencia("");
    setObservacionEvidencia("");
    setArchivoInputKey((prev) => prev + 1);
  };

  const handleRegistrarEvidencia = async (actividadId) => {
    if (guardandoEvidencia) return;

    const tieneArchivo =
      tipoEvidencia === "archivo" && Boolean(archivoEvidencia);

    const tieneEnlace =
      tipoEvidencia === "enlace" && Boolean(enlaceEvidencia.trim());

    if (tieneArchivo === tieneEnlace) {
      return;
    }

    setGuardandoEvidencia(true);

    try {
      const resultado = await onRegistrarEvidencia(actividadId, {
        archivo: tieneArchivo ? archivoEvidencia : null,
        enlace_drive: tieneEnlace ? enlaceEvidencia.trim() : "",
        observacion: observacionEvidencia.trim(),
      });

      if (resultado) {
        cerrarFormularioEvidencia();
      }
    } catch {
      // El hook muestra el error mediante showToast.
    } finally {
      setGuardandoEvidencia(false);
    }
  };

  const alternarHistorial = (actividadId) => {
    setMostrarHistorial((prev) => ({
      ...prev,
      [actividadId]: !prev[actividadId],
    }));
  };

  if (loadingDetalle) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />
        <span className="text-slate-500 font-medium">
          Cargando información del proyecto...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
              {proyecto?.codigo || `ID #${proyecto?.id ?? ""}`}
            </span>

            <h2 className="text-lg font-bold text-slate-800 mt-2">
              {proyecto?.titulo || "Proyecto"}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {proyecto?.escuela_nombre || ""}
              {proyecto?.periodo_nombre
                ? ` — ${proyecto.periodo_nombre}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <FiTrendingUp className="text-[#b1122b] w-5 h-5" />
            <div>
              <span className="text-[10px] text-slate-400 block">
                Progreso de actividades
              </span>
              <span className="text-sm font-bold text-slate-700">
                {porcentajeProgreso}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block">
            Total de actividades
          </span>
          <span className="text-xl font-bold text-slate-700 mt-1 block">
            {totalActividades}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block">
            Actividades completadas
          </span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">
            {actividadesCompletadas}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block">
            Progreso
          </span>
          <span className="text-xl font-bold text-[#b1122b] mt-1 block">
            {porcentajeProgreso}%
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado?.(e.target.value)}
            className="h-9 px-2 border border-slate-300 rounded-lg text-xs outline-none text-slate-600 font-semibold"
          >
            <option value="todos">Todas las actividades</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_ejecucion">En ejecución</option>
            <option value="completada">Completadas</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {listaActividades.length > 0 ? (
          listaActividades.map((actividad) => {
            const avancesActividad = obtenerAvancesActividad(actividad.id);
            const ultimoAvance = obtenerUltimoAvance(actividad.id);
            const historialAbierto = mostrarHistorial[actividad.id];
            const estadoColor = obtenerColorEstado(actividad.estado);

            return (
              <div
                key={actividad.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#b1122b]/10 text-[#b1122b] flex items-center justify-center shrink-0">
                          <FiCheckCircle />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {actividad.nombre}
                          </h4>

                          {actividad.descripcion && (
                            <p className="text-xs text-slate-500 mt-1">
                              {actividad.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

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

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${estadoColor}`}
                      >
                        {obtenerTextoEstado(actividad.estado)}
                      </span>

                      {actividad.estado !== "completada" && (
                        <button
                          type="button"
                          onClick={() =>
                            abrirFormularioEvidencia(actividad.id)
                          }
                          className="text-xs font-semibold px-3 h-9 rounded-lg bg-[#b1122b] text-white hover:bg-[#941020] transition-colors flex items-center"
                        >
                          <FiUpload className="mr-1" />
                          Registrar evidencia
                        </button>
                      )}
                    </div>
                  </div>

                  {actividad.evidencia_esperada && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <FiFile className="text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Evidencia esperada
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {actividad.evidencia_esperada}
                      </p>
                    </div>
                  )}
                </div>

                {ultimoAvance && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <FiTrendingUp className="text-[#b1122b]" />
                        <h5 className="text-xs font-bold text-slate-700">
                          Último avance registrado
                        </h5>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${obtenerColorRevision(
                          ultimoAvance.estado_revision
                        )}`}
                      >
                        {ultimoAvance.estado_revision || "registrado"}
                      </span>
                    </div>

                    {ultimoAvance.descripcion && (
                      <p className="text-sm text-slate-600">
                        {ultimoAvance.descripcion}
                      </p>
                    )}

                    {(ultimoAvance.observaciones ||
                      ultimoAvance.observacion) && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Observaciones
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {ultimoAvance.observaciones ||
                            ultimoAvance.observacion}
                        </p>
                      </div>
                    )}

                    {ultimoAvance.comentario_revision && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FiMessageSquare className="text-red-500" />
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
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

                {avanceAbierto === actividad.id && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor={`tipo-evidencia-${actividad.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Tipo de evidencia
                        </label>

                        <select
                          id={`tipo-evidencia-${actividad.id}`}
                          value={tipoEvidencia}
                          onChange={(e) => {
                            setTipoEvidencia(e.target.value);
                            setArchivoEvidencia(null);
                            setEnlaceEvidencia("");
                            setArchivoInputKey((prev) => prev + 1);
                          }}
                          className="w-full mt-1 h-10 border border-slate-300 rounded-lg px-3 text-sm"
                        >
                          <option value="archivo">
                            Imagen, PDF o documento
                          </option>
                          <option value="enlace">
                            Enlace de Google Drive
                          </option>
                        </select>
                      </div>

                      {tipoEvidencia === "archivo" ? (
                        <div>
                          <label
                            htmlFor={`archivo-evidencia-${actividad.id}`}
                            className="text-xs font-semibold text-slate-600"
                          >
                            Archivo de evidencia
                          </label>

                          <input
                            key={archivoInputKey}
                            id={`archivo-evidencia-${actividad.id}`}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            onChange={(e) => {
                              setArchivoEvidencia(
                                e.target.files?.[0] ?? null
                              );
                              setEnlaceEvidencia("");
                            }}
                            className="w-full mt-1 text-sm text-slate-600"
                          />

                          <p className="text-xs text-slate-400 mt-1">
                            Imágenes, PDF, Word, Excel y PowerPoint.
                            Tamaño máximo: 10 MB.
                          </p>

                          {archivoEvidencia && (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs text-slate-600 break-all">
                                Archivo seleccionado:{" "}
                                <strong>{archivoEvidencia.name}</strong>
                              </p>

                              {archivoEvidencia.type.startsWith("image/") && (
                                <img
                                  src={URL.createObjectURL(archivoEvidencia)}
                                  alt="Vista previa de la evidencia"
                                  className="mt-3 max-h-48 max-w-full rounded-lg object-contain"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor={`enlace-evidencia-${actividad.id}`}
                            className="text-xs font-semibold text-slate-600"
                          >
                            Enlace de Google Drive
                          </label>

                          <input
                            id={`enlace-evidencia-${actividad.id}`}
                            type="url"
                            value={enlaceEvidencia}
                            onChange={(e) => {
                              setEnlaceEvidencia(e.target.value);
                              setArchivoEvidencia(null);
                            }}
                            placeholder="https://drive.google.com/..."
                            className="w-full mt-1 h-10 border border-slate-300 rounded-lg px-3 text-sm outline-none focus:border-[#b1122b]"
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor={`observacion-evidencia-${actividad.id}`}
                          className="text-xs font-semibold text-slate-600"
                        >
                          Observación (opcional)
                        </label>

                        <textarea
                          id={`observacion-evidencia-${actividad.id}`}
                          value={observacionEvidencia}
                          onChange={(e) =>
                            setObservacionEvidencia(e.target.value)
                          }
                          rows={3}
                          placeholder="Observaciones adicionales..."
                          className="w-full mt-1 border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-[#b1122b]"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRegistrarEvidencia(actividad.id)
                          }
                          disabled={
                            guardandoEvidencia ||
                            (tipoEvidencia === "archivo"
                              ? !archivoEvidencia
                              : !enlaceEvidencia.trim())
                          }
                          className="px-4 h-10 rounded-lg bg-[#b1122b] text-white text-xs font-semibold hover:bg-[#941020] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {guardandoEvidencia
                            ? "Registrando..."
                            : "Enviar evidencia y completar"}
                        </button>

                        <button
                          type="button"
                          onClick={cerrarFormularioEvidencia}
                          disabled={guardandoEvidencia}
                          className="px-4 h-10 rounded-lg bg-white text-slate-600 text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {avancesActividad.length > 0 && (
                  <div className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => alternarHistorial(actividad.id)}
                      className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <span>
                        Historial de avances ({avancesActividad.length})
                      </span>
                      <span>{historialAbierto ? "−" : "+"}</span>
                    </button>

                    {historialAbierto && (
                      <div className="px-5 pb-5 space-y-3">
                        {avancesActividad.map((avance) => {
                          const listaEvidencias = obtenerEvidencias(avance);

                          return (
                            <div
                              key={avance.id}
                              className="border border-slate-200 rounded-lg p-4"
                            >
                              <div className="flex justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {avance.descripcion || "Sin descripción"}
                                  </p>

                                  {avance.created_at && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {new Date(
                                        avance.created_at
                                      ).toLocaleString("es-PE")}
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`h-fit text-[10px] font-bold px-2 py-0.5 rounded-md border ${obtenerColorRevision(
                                    avance.estado_revision
                                  )}`}
                                >
                                  {avance.estado_revision || "registrado"}
                                </span>
                              </div>

                              {(avance.observaciones ||
                                avance.observacion) && (
                                <p className="text-sm text-slate-500 mt-3">
                                  {avance.observaciones ||
                                    avance.observacion}
                                </p>
                              )}

                              {listaEvidencias.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Evidencias
                                  </p>

                                  {listaEvidencias.map((evidencia, index) => {
                                    const urlEvidencia =
                                      evidencia.url ||
                                      evidencia.enlace_drive ||
                                      evidencia.archivo_url ||
                                      evidencia.archivo ||
                                      "";

                                    const esEnlace =
                                      evidencia.tipo === "enlace" ||
                                      Boolean(
                                        evidencia.url ||
                                          evidencia.enlace_drive
                                      );

                                    const enlace = esEnlace
                                      ? urlEvidencia
                                      : construirUrlArchivo(urlEvidencia);

                                    const clave =
                                      evidencia.id ||
                                      `${avance.id}-${evidencia.tipo}-${index}`;

                                    return (
                                      <div
                                        key={clave}
                                        className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2 border border-slate-100"
                                      >
                                        <a
                                          href={enlace || undefined}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-2 text-xs font-semibold text-[#b1122b] hover:text-[#941020] min-w-0"
                                        >
                                          {esEnlace ? (
                                            <FiLink className="shrink-0" />
                                          ) : evidencia.tipo?.startsWith(
                                              "image/"
                                            ) ? (
                                            <FiFile className="shrink-0" />
                                          ) : (
                                            <FiFile className="shrink-0" />
                                          )}

                                          <span className="truncate">
                                            {evidencia.nombre ||
                                              evidencia.nombre_archivo ||
                                              (esEnlace
                                                ? "Ver enlace de Drive"
                                                : "Ver evidencia")}
                                          </span>

                                          <FiExternalLink className="shrink-0" />
                                        </a>

                                        {evidencia.id && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onEliminarEvidencia?.(
                                                avance.id,
                                                evidencia.id
                                              )
                                            }
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            title="Eliminar evidencia"
                                          >
                                            <FiTrash2 />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {avance.estado_revision === "observado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onCorregirAvance?.(avance.id)
                                  }
                                  className="mt-4 flex items-center gap-2 px-3 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                >
                                  <FiCheck />
                                  Marcar como corregido
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">
            <FiCheckCircle className="w-10 h-10 text-slate-300 mb-2" />

            <span className="text-slate-500 text-sm font-semibold">
              No hay actividades para mostrar
            </span>

            <span className="text-slate-400 text-xs mt-1">
              No existen actividades que coincidan con el filtro seleccionado.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}