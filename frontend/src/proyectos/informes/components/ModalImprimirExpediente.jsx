import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiLoader, FiPrinter, FiX } from "react-icons/fi";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";
import ReporteExpediente from "../../../shared/components/ReporteExpediente";

// Vista de impresión del expediente integral de un proyecto.
// Carga el detalle completo, lo muestra en un modal y, al imprimir,
// las reglas @media print de index.css ocultan el resto de la aplicación
// (menú lateral, barra superior y botones) y dejan solo el expediente.
export default function ModalImprimirExpediente({ proyectoId, onClose }) {
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await proyectoApi.obtenerProyectoPorId(proyectoId);
        if (!cancelado) setProyecto(data);
      } catch (err) {
        console.error("Error al cargar el expediente:", err);
        if (!cancelado) {
          setError("No se pudo cargar el expediente del proyecto.");
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, [proyectoId]);

  // Marca el body mientras el modal está abierto para activar el CSS de impresión.
  useEffect(() => {
    document.body.classList.add("imprimiendo-expediente");
    return () => document.body.classList.remove("imprimiendo-expediente");
  }, []);

  const puedeImprimir = !loading && !error && Boolean(proyecto);

  return createPortal(
    <div
      id="print-expediente-root"
      className="exp-print-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="exp-print-panel bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FiEye className="text-slate-500" />
              Expediente Integral del Proyecto
            </h2>
            {proyecto && (
              <p className="text-xs text-slate-500 mt-0.5">
                {proyecto.codigo} — {proyecto.titulo}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!puedeImprimir}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPrinter />
              Imprimir
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Cerrar"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="exp-print-body flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="print:hidden flex items-center justify-center py-12 text-slate-400">
              <FiLoader className="animate-spin text-3xl" />
            </div>
          )}

          {error && (
            <p className="print:hidden text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {puedeImprimir && (
            <ReporteExpediente
              matrizSeleccionada={proyecto}
              showPrintButton={false}
            />
          )}
        </div>

        <div className="print:hidden px-6 py-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
