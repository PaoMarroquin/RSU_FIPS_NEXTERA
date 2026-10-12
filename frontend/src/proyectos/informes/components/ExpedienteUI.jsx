
import React from "react";
import {
  FiEye,
  FiRefreshCw,
  FiFileText,
  FiX,
  FiExternalLink,
} from "react-icons/fi";

import ReporteExpediente from "../../../shared/components/ReporteExpediente";

export const DocumentoCard = ({
  icon,
  titulo,
  descripcion,
  estado,
  disponible,
  loading,
  onView,
  ultimo = false,
}) => (
  <div
    className={`bg-white border border-slate-200 rounded-xl ${
      ultimo ? "" : "mb-3"
    }`}
  >
    <div className="min-h-[82px] px-4 py-4 flex flex-row items-center gap-3 sm:gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          disponible
            ? "bg-[#f5e9eb] text-[#6f1825]"
            : "bg-slate-50 text-slate-300"
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-700 truncate">
            {titulo}
          </h3>

          <span
            className={`text-[9px] font-bold px-2 py-1 rounded-full ${
              disponible
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {estado}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {descripcion}
        </p>
      </div>

      <button
        type="button"
        disabled={!disponible || loading}
        onClick={onView}
        title={disponible ? "Ver documento" : "Documento no disponible"}
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
          disponible
            ? "border-slate-200 text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b] hover:bg-[#fdf7f8]"
            : "border-transparent text-slate-300 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <FiRefreshCw className="animate-spin" />
        ) : (
          <FiEye />
        )}
      </button>
    </div>
  </div>
);

export const ModalDocumento = ({
  tipo,
  proyecto,
  cerrar,
  actividades = [],
  avances = [],
  evidencias = {},
  loadingDetalle = false,
}) => {
  const tipoReal =
    typeof tipo === "string" ? tipo : tipo?.tipo;

  const urlPDF =
    typeof tipo === "object" ? tipo?.url : null;

  const titulo =
    tipoReal === "avance"
      ? "Estado de avance"
      : tipoReal === "planificacion"
      ? "Informe de planificación"
      : tipoReal === "finalizacion"
      ? "Informe de finalización"
      : "Constancia de ejecución";

  const obtenerAvanceActividad = (actividad) =>
    avances.find((avance) => {
      const relacion =
        avance.actividad_id ??
        (typeof avance.actividad === "object"
          ? avance.actividad?.id
          : avance.actividad);

      return Number(relacion) === Number(actividad.id);
    });

  const obtenerPorcentaje = (actividad, avance) => {
    const valor =
      actividad.porcentaje_avance ??
      actividad.porcentaje_ejecucion ??
      actividad.porcentaje ??
      avance?.porcentaje_avance ??
      avance?.porcentaje_ejecucion ??
      avance?.porcentaje;

    if (valor !== null && valor !== undefined && valor !== "") {
      const numero = Number(valor);

      if (Number.isFinite(numero)) {
        return Math.min(100, Math.max(0, numero));
      }
    }

    return actividad.estado === "completada" ? 100 : 0;
  };

  const obtenerEvidencias = (actividad, avance) => {
    const listaAvance = avance?.id
      ? evidencias[avance.id] || []
      : [];

    const listaActividad = actividad.evidencias || [];

    return [
      ...listaAvance,
      ...listaActividad.filter(
        (item) =>
          !listaAvance.some(
            (evidencia) =>
              evidencia.id != null &&
              Number(evidencia.id) === Number(item.id)
          )
      ),
    ];
  };

  const obtenerUrl = (evidencia) => {
    const archivo = evidencia.archivo;

    if (typeof archivo === "string") {
      return (
        evidencia.url ||
        evidencia.enlace_drive ||
        evidencia.archivo_url ||
        archivo
      );
    }

    return (
      evidencia.url ||
      evidencia.enlace_drive ||
      evidencia.archivo_url ||
      archivo?.url ||
      archivo?.archivo ||
      ""
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] max-h-[85vh] min-h-0 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FiEye className="text-slate-500 shrink-0" />

              <h2 className="text-sm font-bold text-slate-800">
                {titulo}
              </h2>
            </div>

            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {proyecto?.codigo || "—"} —{" "}
              {proyecto?.titulo || "Proyecto"}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-slate-500 hover:text-[#b1122b] hover:bg-slate-50"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-100">
          {tipoReal === "avance" ? (
            <div className="p-4 sm:p-6 space-y-3">
              {loadingDetalle ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  <FiRefreshCw className="animate-spin inline mr-2" />
                  Cargando actividades y evidencias...
                </div>
              ) : actividades.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                  Este proyecto todavía no tiene actividades registradas.
                </div>
              ) : (
                actividades.map((actividad) => {
                  const avance = obtenerAvanceActividad(actividad);
                  const porcentaje = obtenerPorcentaje(
                    actividad,
                    avance
                  );
                  const lista = obtenerEvidencias(
                    actividad,
                    avance
                  );

                  return (
                    <div
                      key={actividad.id}
                      className="bg-white border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm font-bold text-slate-800">
                          {actividad.nombre ||
                            actividad.titulo ||
                            actividad.descripcion ||
                            `Actividad ${actividad.id}`}
                        </h3>

                        <span className="text-sm font-bold text-[#b1122b] shrink-0">
                          {porcentaje}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-[#b1122b] rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          Evidencias
                        </p>

                        {lista.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            Sin evidencias registradas.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {lista.map((evidencia, index) => {
                              const enlace = obtenerUrl(evidencia);
                              const nombre =
                                evidencia.nombre ||
                                evidencia.nombre_archivo ||
                                `Evidencia ${index + 1}`;

                              return (
                                <div
                                  key={evidencia.id || index}
                                  className="flex flex-col gap-1 border-t border-slate-100 pt-2"
                                >
                                  <div className="flex items-start gap-2 text-xs">
                                    <FiFileText className="text-slate-400 shrink-0 mt-0.5" />

                                    {enlace ? (
                                      <a
                                        href={enlace}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#b1122b] hover:underline break-all"
                                      >
                                        {nombre}
                                        <FiExternalLink className="inline ml-1" />
                                      </a>
                                    ) : (
                                      <span className="text-slate-600 break-words">
                                        {nombre}
                                      </span>
                                    )}
                                  </div>

                                  {evidencia.observacion && (
                                    <p className="text-xs text-slate-500 pl-5">
                                      {evidencia.observacion}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : tipoReal === "planificacion" ? (
            <div className="p-3 sm:p-5">
              <ReporteExpediente
                matrizSeleccionada={proyecto}
                showPrintButton={true}
              />
            </div>
          ) : urlPDF ? (
            <iframe
              src={urlPDF}
              className="block w-full h-full min-h-[400px] border-none"
              title={`PDF - ${titulo}`}
            />
          ) : (
            <div className="flex min-h-[300px] items-center justify-center p-6 text-sm text-slate-500">
              No se encuentra disponible el documento.
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-end shrink-0">
          <button
            type="button"
            onClick={cerrar}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
