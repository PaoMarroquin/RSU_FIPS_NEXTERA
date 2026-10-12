import React from "react";
import {
  FiEye,
  FiRefreshCw,
  FiFileText,
  FiX,
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
        title={
          disponible
            ? "Ver documento"
            : "Documento no disponible"
        }
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
}) => {
  const tipoReal =
    typeof tipo === "string" ? tipo : tipo?.tipo;

  const urlPDF =
    typeof tipo === "object" ? tipo?.url : null;

  const titulo =
    tipoReal === "planificacion"
      ? "Informe de planificación"
      : tipoReal === "finalizacion"
      ? "Informe de finalización"
      : "Constancia de ejecución";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      {/* MODAL CON DIMENSIONES UNIFORMES */}
      <div className="bg-white w-full max-w-5xl h-[85vh] max-h-[85vh] min-h-0 rounded-xl shadow-2xl overflow-hidden flex flex-col">

        {/* ENCABEZADO FIJO */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FiEye className="text-slate-500 shrink-0" />

              <h2 className="text-sm font-bold text-slate-800">
                Expediente Integral del Proyecto
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

        {/* CONTENIDO CON SCROLL */}
        <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-100">

          {tipoReal === "planificacion" ? (
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

        {/* PIE FIJO */}
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
