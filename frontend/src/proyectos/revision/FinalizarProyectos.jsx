import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../shared/layout/Layout";
import {
  FiCheckCircle,
  FiInbox,
  FiEye,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { useProyectosParaFinalizar } from "./hooks/useProyectosParaFinalizar";
import ReporteExpediente from "../../shared/components/ReporteExpediente";

export default function ProyectosParaFinalizar() {
  const navigate = useNavigate();

  const {
    proyectos,
    loading,
    obtenerProyectosParaFinalizar,
    finalizarProyecto,
  } = useProyectosParaFinalizar();

  const [modalVistaOpen, setModalVistaOpen] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

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

  const abrirVista = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setModalVistaOpen(true);
  };

  const cerrarVista = () => {
    if (confirmando) return;
    setModalVistaOpen(false);
    setProyectoSeleccionado(null);
  };

  const handleFinalizar = async () => {
    if (!proyectoSeleccionado) return;

    try {
      setConfirmando(true);

      await finalizarProyecto(proyectoSeleccionado.id);

      setModalVistaOpen(false);
      setProyectoSeleccionado(null);

      await obtenerProyectosParaFinalizar();
    } catch (err) {
      // El hook muestra el mensaje correspondiente.
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col space-y-6 p-6 md:p-8">
        {/* Encabezado */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              Proyectos por finalizar
            </h1>

            <p className="m-0 mt-1 text-sm text-slate-500">
              Revisa los proyectos que completaron el 100% de ejecución y
              confirma su cierre.
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
              Cargando proyectos por finalizar...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center md:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-400">
                <FiInbox />
              </div>

              <p className="m-0 text-sm font-semibold text-slate-700">
                No hay proyectos pendientes de cierre
              </p>

              <p className="m-0 text-xs text-slate-400">
                Los proyectos que alcancen el 100% de ejecución aparecerán
                aquí automáticamente.
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b1122b]/10 px-2 py-1 text-[11px] font-semibold text-[#b1122b]">
                          <FiCheckCircle size={11} />
                          Listo para finalizar
                        </span>
                      </td>

                      <td className="px-4 py-4 md:px-6">
                        <div className="flex min-w-[280px] items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                            onClick={() => abrirVista(proyecto)}
                          >
                            <FiEye size={13} />
                            Ver
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8f0e23]"
                            onClick={() => abrirVista(proyecto)}
                          >
                            <FiCheckCircle size={13} />
                            Marcar como finalizado
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

      {/* Modal de finalización */}
      {modalVistaOpen && proyectoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="shrink-0 text-[#b1122b]" size={18} />

                  <h2 className="m-0 text-base font-semibold text-slate-800">
                    Finalizar proyecto
                  </h2>
                </div>

                <p className="m-0 mt-1 truncate text-xs text-slate-500">
                  {proyectoSeleccionado.titulo}
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar expediente"
                onClick={cerrarVista}
                disabled={confirmando}
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-6">
              <ReporteExpediente
                matrizSeleccionada={proyectoSeleccionado}
                showPrintButton={false}
              />
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FiAlertCircle className="shrink-0" size={14} />
                  <span>
                    El proyecto debe tener una ejecución del 100%.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cerrarVista}
                    disabled={confirmando}
                    className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizar}
                    disabled={confirmando}
                    className="flex items-center gap-1.5 rounded-md bg-[#b1122b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8f0e23] disabled:opacity-50"
                  >
                    {confirmando ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Finalizando...
                      </>
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
    </Layout>
  );
}
