import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../shared/layout/Layout";
import {
  FiCheckCircle,
  FiInbox,
  FiEye,
  FiX,
  FiAlertCircle,
  FiMessageSquare,
  FiExternalLink,
} from "react-icons/fi";
import { useProyectosParaFinalizar } from "./hooks/useProyectosParaFinalizar";
import { proyectoApi } from "../../shared/api/proyectos/proyectoApi";

export default function ProyectosParaFinalizar() {
  const navigate = useNavigate();

  const {
    proyectos,
    loading,
    obtenerProyectosParaFinalizar,
    finalizarProyecto,
    observarInforme,
  } = useProyectosParaFinalizar();

  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [modalObservarOpen, setModalObservarOpen] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [cargandoPDF, setCargandoPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState("");

  useEffect(() => {
    const role = (localStorage.getItem("user_role") || "").toLowerCase();

    if (
      role !== "departamento" &&
      role !== "jefatura rsu" &&
      role !== "administrador"
    ) {
      navigate("/dashboard");
      return;
    }

    obtenerProyectosParaFinalizar();
  }, [obtenerProyectosParaFinalizar, navigate]);

  // Libera la URL temporal del PDF al desmontar el componente.
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const abrirVista = async (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setModalVistaOpen(true);
    setCargandoPDF(true);
    setErrorPDF("");

    try {
      const response =
        await proyectoApi.descargarInformeFinalizacionPDF(proyecto.id);

      const blob = response.data;

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("El servidor no devolvió un PDF válido.");
      }

      const nuevaUrl = URL.createObjectURL(blob);

      setPdfUrl((urlAnterior) => {
        if (urlAnterior) URL.revokeObjectURL(urlAnterior);
        return nuevaUrl;
      });
    } catch (error) {
      console.error("Error al cargar el informe PDF:", error);
      setErrorPDF(
        error.response?.data?.detail ||
          "No se pudo cargar el informe de finalización. Verifica que el servidor genere el PDF."
      );
    } finally {
      setCargandoPDF(false);
    }
  };

  const cerrarVista = () => {
    if (confirmando) return;

    setModalVistaOpen(false);
    setProyectoSeleccionado(null);
    setErrorPDF("");

    setPdfUrl((urlAnterior) => {
      if (urlAnterior) URL.revokeObjectURL(urlAnterior);
      return null;
    });
  };

  const abrirObservacion = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setComentario("");
    setModalObservarOpen(true);
  };

  const cerrarObservacion = () => {
    if (confirmando) return;

    setModalObservarOpen(false);
    setProyectoSeleccionado(null);
    setComentario("");
  };

  const handleFinalizar = async () => {
    if (!proyectoSeleccionado) return;

    try {
      setConfirmando(true);

      await finalizarProyecto(proyectoSeleccionado.id);

      setModalVistaOpen(false);
      setProyectoSeleccionado(null);
      setPdfUrl((urlAnterior) => {
        if (urlAnterior) URL.revokeObjectURL(urlAnterior);
        return null;
      });

      await obtenerProyectosParaFinalizar();
    } catch (error) {
      // El hook muestra el mensaje correspondiente.
    } finally {
      setConfirmando(false);
    }
  };

  const handleObservar = async (e) => {
    e.preventDefault();

    if (!proyectoSeleccionado || comentario.trim().length < 15) return;

    try {
      setConfirmando(true);

      await observarInforme(
        proyectoSeleccionado.id,
        comentario.trim()
      );

      setModalObservarOpen(false);
      setProyectoSeleccionado(null);
      setComentario("");

      await obtenerProyectosParaFinalizar();
    } catch (error) {
      // El hook muestra el mensaje correspondiente.
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              Proyectos por finalizar
            </h1>
            <p className="m-0 mt-1 text-sm text-slate-500">
              Revisa los informes enviados, registra observaciones o confirma
              el cierre de los proyectos.
            </p>
          </div>

          {!loading && proyectos.length > 0 && (
            <span className="shrink-0 text-sm text-slate-400">
              {proyectos.length} pendiente
              {proyectos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-400 md:p-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#b1122b] border-t-transparent" />
              Cargando proyectos por finalizar...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center md:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-400">
                <FiInbox />
              </div>
              <p className="m-0 text-sm font-semibold text-slate-700">
                No hay informes pendientes de revisión
              </p>
              <p className="m-0 text-xs text-slate-400">
                Los informes enviados para revisión aparecerán aquí.
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
                      Responsable
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Ejecución
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium md:px-6">
                      Estado
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
                        <div className="mb-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {proyecto.codigo || "S/C"}
                        </div>
                        <div className="line-clamp-1 font-medium leading-snug text-slate-800">
                          {proyecto.titulo}
                        </div>
                      </td>

                      <td className="px-4 py-4 md:px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                            {(proyecto.docente_responsable_nombre || "D")
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("")}
                          </div>
                          <span className="text-slate-600">
                            {proyecto.docente_responsable_nombre || "Docente"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 md:px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#b1122b]"
                              style={{
                                width: `${Math.min(
                                  Number(proyecto.porcentaje_ejecucion || 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#b1122b]">
                            {proyecto.porcentaje_ejecucion ?? 100}%
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 md:px-6">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          <FiAlertCircle size={11} />
                          Informe enviado
                        </span>
                      </td>

                      <td className="px-4 py-4 md:px-6">
                        <div className="flex min-w-[300px] items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={cargandoPDF}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                            onClick={() => abrirVista(proyecto)}
                          >
                            <FiEye size={13} />
                            Ver
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                            onClick={() => abrirObservacion(proyecto)}
                          >
                            <FiMessageSquare size={13} />
                            Observar informe
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8f0e23]"
                            onClick={() => abrirVista(proyecto)}
                          >
                            <FiCheckCircle size={13} />
                            Finalizar
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

      {/* Modal del PDF de finalización */}
      {modalVistaOpen && proyectoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FiCheckCircle
                    className="shrink-0 text-[#b1122b]"
                    size={18}
                  />
                  <h2 className="m-0 text-base font-semibold text-slate-800">
                    Informe de finalización
                  </h2>
                </div>
                <p className="m-0 mt-1 truncate text-xs text-slate-500">
                  {proyectoSeleccionado.titulo}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    title="Abrir PDF en otra pestaña"
                  >
                    <FiExternalLink />
                  </a>
                )}
                <button
                  type="button"
                  aria-label="Cerrar informe"
                  onClick={cerrarVista}
                  disabled={confirmando}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-6">
              {cargandoPDF ? (
                <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-slate-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#b1122b] border-t-transparent" />
                  Cargando informe de finalización...
                </div>
              ) : errorPDF ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                  <FiAlertCircle size={28} className="text-red-500" />
                  <p className="max-w-lg text-sm text-red-600">{errorPDF}</p>
                  <button
                    type="button"
                    onClick={() => abrirVista(proyectoSeleccionado)}
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Reintentar
                  </button>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title={`Informe de finalización: ${proyectoSeleccionado.titulo}`}
                  className="h-[65vh] min-h-[400px] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">
                  No hay un documento para mostrar.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FiAlertCircle size={14} />
                  Confirma el cierre después de revisar el informe.
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cerrarVista}
                    disabled={confirmando}
                    className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizar}
                    disabled={confirmando || cargandoPDF || Boolean(errorPDF)}
                    className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f0e23] disabled:opacity-50"
                  >
                    {confirmando ? (
                      "Finalizando..."
                    ) : (
                      <>
                        <FiCheckCircle size={14} />
                        Confirmar finalización
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para observar informe */}
      {modalObservarOpen && proyectoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleObservar}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="m-0 text-base font-semibold text-slate-800">
                  Observar informe
                </h2>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  {proyectoSeleccionado.titulo}
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar observación"
                onClick={cerrarObservacion}
                disabled={confirmando}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <label
                htmlFor="comentario-observacion"
                className="block text-sm font-medium text-slate-700"
              >
                Motivo de la observación
              </label>

              <textarea
                id="comentario-observacion"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                minLength={15}
                maxLength={2000}
                required
                rows={5}
                placeholder="Describe qué debe corregirse en el informe..."
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#b1122b] focus:ring-2 focus:ring-[#b1122b]/10"
              />

              <div className="flex justify-between gap-3 text-xs">
                <span
                  className={
                    comentario.trim().length < 15
                      ? "text-amber-600"
                      : "text-slate-400"
                  }
                >
                  Mínimo 15 caracteres.
                </span>
                <span className="text-slate-400">
                  {comentario.trim().length}/2000
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={cerrarObservacion}
                disabled={confirmando}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={confirmando || comentario.trim().length < 15}
                className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmando ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FiMessageSquare size={14} />
                    Enviar observación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
