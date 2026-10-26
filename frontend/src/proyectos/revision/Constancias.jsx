import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../../shared/layout/Layout";
import {
  FiAward,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiInbox,
  FiRefreshCw,
  FiX,
  FiExternalLink,
  FiAlertTriangle,
} from "react-icons/fi";
import { useToast } from "../../shared/context/ToastContext";
import {
  obtenerConstancias,
  descargarConstancia,
  aprobarConstancia,
} from "../informes/hooks/informefinalizado";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "aprobada", label: "Aprobadas" },
];

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "—" : fecha.toLocaleDateString();
};

// Mensaje legible a partir del error de la API ({ detail } o { error }).
const mensajeDeError = (err, porDefecto) =>
  err?.response?.data?.detail || err?.response?.data?.error || porDefecto;

export default function Constancias() {
  const { showToast } = useToast();

  const [constancias, setConstancias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todas");

  const [porAprobar, setPorAprobar] = useState(null);
  const [aprobando, setAprobando] = useState(false);

  const [pdf, setPdf] = useState(null); // { url, titulo }
  const [cargandoPdfId, setCargandoPdfId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await obtenerConstancias();
      setConstancias(Array.isArray(data) ? data : data?.results ?? []);
    } catch (err) {
      console.error("Error cargando constancias:", err);
      setError(mensajeDeError(err, "No se pudo cargar el listado de constancias."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Libera la URL temporal del PDF al cambiar o al salir.
  useEffect(() => {
    return () => {
      if (pdf?.url) window.URL.revokeObjectURL(pdf.url);
    };
  }, [pdf]);

  const pendientes = useMemo(
    () => constancias.filter((c) => c.constancia_estado === "pendiente").length,
    [constancias]
  );

  const visibles = useMemo(
    () =>
      filtro === "todas"
        ? constancias
        : constancias.filter((c) => c.constancia_estado === filtro),
    [constancias, filtro]
  );

  const verPdf = async (fila) => {
    if (cargandoPdfId) return;
    setCargandoPdfId(fila.proyecto_id);

    try {
      const response = await descargarConstancia(fila.proyecto_id);
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      setPdf({ url, titulo: `${fila.codigo || "Proyecto"} — ${fila.titulo}` });
    } catch (err) {
      console.error("Error descargando constancia:", err);

      // La respuesta de error de un blob llega como Blob: se lee su JSON.
      let detalle = null;
      try {
        const blob = err?.response?.data;
        if (blob instanceof Blob) {
          detalle = JSON.parse(await blob.text())?.detail;
        }
      } catch {
        detalle = null;
      }

      showToast(
        "error",
        detalle || mensajeDeError(err, "No se pudo abrir la constancia.")
      );
    } finally {
      setCargandoPdfId(null);
    }
  };

  const cerrarPdf = () => setPdf(null);

  const confirmarAprobacion = async () => {
    if (!porAprobar || aprobando) return;
    setAprobando(true);

    try {
      const data = await aprobarConstancia(porAprobar.proyecto_id);
      showToast("success", data?.detail || "Constancia aprobada.");
      setPorAprobar(null);
      await cargar();
    } catch (err) {
      console.error("Error aprobando constancia:", err);
      showToast("error", mensajeDeError(err, "No se pudo aprobar la constancia."));
    } finally {
      setAprobando(false);
    }
  };

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col space-y-6 p-6 md:p-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              Constancias
            </h1>
            <p className="m-0 mt-1 text-sm text-slate-500">
              Revisa las constancias de los proyectos finalizados y apruébalas
              para que el docente pueda descargarlas.
            </p>
          </div>

          {!loading && !error && constancias.length > 0 && (
            <span className="shrink-0 text-sm text-slate-400">
              {pendientes} pendiente{pendientes !== 1 ? "s" : ""} de{" "}
              {constancias.length}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === f.id
                  ? "border-[#b1122b] bg-[#b1122b] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-400 md:p-16">
              <FiRefreshCw className="animate-spin text-xl text-[#b1122b]" />
              Cargando constancias...
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center md:p-16">
              <FiAlertTriangle className="text-2xl text-red-500" />
              <p className="m-0 text-sm font-semibold text-slate-700">{error}</p>
              <button
                type="button"
                onClick={cargar}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Reintentar
              </button>
            </div>
          ) : visibles.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center md:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-400">
                <FiInbox />
              </div>
              <p className="m-0 text-sm font-semibold text-slate-700">
                {constancias.length === 0
                  ? "Aún no hay constancias"
                  : "No hay constancias con este filtro"}
              </p>
              <p className="m-0 text-xs text-slate-400">
                Las constancias aparecen cuando un proyecto queda finalizado.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Proyecto
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Docente responsable
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Cierre
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Estado
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium md:px-6">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibles.map((fila) => {
                    const aprobada = fila.constancia_estado === "aprobada";

                    return (
                      <tr
                        key={fila.proyecto_id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="max-w-md px-4 py-4 md:px-6">
                          <div className="mb-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {fila.codigo || "S/C"}
                          </div>
                          <div className="line-clamp-2 font-medium leading-snug text-slate-800">
                            {fila.titulo}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600 md:px-6">
                          {fila.docente || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 md:px-6">
                          {formatearFecha(fila.fecha_cierre)}
                        </td>

                        <td className="px-4 py-4 md:px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${
                              aprobada
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {aprobada ? (
                              <FiCheckCircle size={11} />
                            ) : (
                              <FiClock size={11} />
                            )}
                            {fila.constancia_estado_display ||
                              (aprobada ? "Aprobada" : "Pendiente de aprobación")}
                          </span>

                          {aprobada && (
                            <p className="m-0 mt-1 text-[10px] text-slate-400">
                              {fila.constancia_aprobada_por || "—"} ·{" "}
                              {formatearFecha(fila.constancia_aprobada_en)}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={cargandoPdfId === fila.proyecto_id}
                              onClick={() => verPdf(fila)}
                              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                            >
                              {cargandoPdfId === fila.proyecto_id ? (
                                <FiRefreshCw size={13} className="animate-spin" />
                              ) : (
                                <FiEye size={13} />
                              )}
                              Ver
                            </button>

                            {!aprobada && (
                              <button
                                type="button"
                                onClick={() => setPorAprobar(fila)}
                                className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8f0e23]"
                              >
                                <FiCheckCircle size={13} />
                                Aprobar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Confirmar aprobación */}
      {porAprobar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-slate-100 p-6">
              <FiAward className="mt-0.5 shrink-0 text-2xl text-[#b1122b]" />
              <div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">
                  Aprobar constancia
                </h3>
                <p className="m-0 mt-1 text-sm text-slate-600">
                  La constancia de «{porAprobar.titulo}» quedará disponible para{" "}
                  {porAprobar.docente || "el docente responsable"}, que recibirá
                  una notificación. ¿Deseas aprobarla?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4">
              <button
                type="button"
                disabled={aprobando}
                onClick={() => setPorAprobar(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={aprobando}
                onClick={confirmarAprobacion}
                className="rounded-lg bg-[#b1122b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8f0e23] disabled:opacity-50"
              >
                {aprobando ? "Aprobando..." : "Aprobar constancia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista del PDF */}
      {pdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 className="m-0 text-sm font-bold text-slate-800">
                  Constancia de ejecución
                </h2>
                <p className="m-0 mt-0.5 truncate text-[11px] text-slate-500">
                  {pdf.titulo}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir PDF en otra pestaña"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <FiExternalLink />
                </a>

                <button
                  type="button"
                  aria-label="Cerrar constancia"
                  onClick={cerrarPdf}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <iframe
              src={pdf.url}
              title={`Constancia: ${pdf.titulo}`}
              className="min-h-0 w-full flex-1 border-0"
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
