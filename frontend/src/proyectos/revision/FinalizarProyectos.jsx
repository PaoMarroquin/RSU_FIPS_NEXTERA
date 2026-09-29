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
      <main className="p-8 max-w-6xl w-full mx-auto space-y-6">

        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight m-0">
              Proyectos por finalizar
            </h1>

            <p className="text-sm text-slate-500 mt-1 m-0">
              Revisa los proyectos que completaron el 100% de ejecución y
              confirma su cierre.
            </p>
          </div>

          {!loading && proyectos.length > 0 && (
            <span className="text-sm text-slate-400">
              {proyectos.length} pendiente
              {proyectos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {loading ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-sm text-slate-400">
              <div className="w-6 h-6 border-2 border-[#b1122b] border-t-transparent rounded-full animate-spin" />
              Cargando proyectos por finalizar...
            </div>
          ) : proyectos.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-lg">
                <FiInbox />
              </div>

              <p className="font-semibold text-sm text-slate-700 m-0">
                No hay proyectos pendientes de cierre
              </p>

              <p className="text-xs text-slate-400 m-0">
                Los proyectos que alcancen el 100% de ejecución aparecerán
                aquí automáticamente.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="py-3 px-6 font-medium">Proyecto</th>
                  <th className="py-3 px-6 font-medium">Responsable</th>
                  <th className="py-3 px-6 font-medium">Ejecución</th>
                  <th className="py-3 px-6 font-medium">Estado</th>
                  <th className="py-3 px-6 font-medium text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {proyectos.map((proyecto) => (
                  <tr
                    key={proyecto.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-6 max-w-md">
                      <div className="font-mono text-[10px] text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mb-1.5">
                        {proyecto.codigo || "S/C"}
                      </div>

                      <div className="text-slate-800 font-medium leading-snug line-clamp-1">
                        {proyecto.titulo}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center shrink-0">
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

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                Number(
                                  proyecto.porcentaje_ejecucion || 0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-semibold text-emerald-600">
                          {proyecto.porcentaje_ejecucion ?? 100}%
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        <FiCheckCircle size={11} />
                        Listo para finalizar
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium rounded-md flex items-center gap-1.5 text-xs transition-colors"
                          onClick={() => abrirVista(proyecto)}
                        >
                          <FiEye size={13} />
                          Ver
                        </button>

                        <button
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md flex items-center gap-1.5 text-xs transition-colors"
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
          )}
        </div>
      </main>

      {modalVistaOpen && proyectoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle
                    className="text-emerald-600"
                    size={18}
                  />

                  <h2 className="text-base font-semibold text-slate-800 m-0">
                    Finalizar proyecto
                  </h2>
                </div>

                <p className="text-xs text-slate-500 mt-1 m-0">
                  {proyectoSeleccionado.titulo}
                </p>
              </div>

              <button
                onClick={cerrarVista}
                disabled={confirmando}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <ReporteExpediente
                matrizSeleccionada={proyectoSeleccionado}
                showPrintButton={false}
              />
            </div>

            <div className="border-t border-slate-100 px-6 py-3 shrink-0 bg-white">
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FiAlertCircle size={14} />
                  <span>
                    El proyecto debe tener una ejecución del 100%.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cerrarVista}
                    disabled={confirmando}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleFinalizar}
                    disabled={confirmando}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {confirmando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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