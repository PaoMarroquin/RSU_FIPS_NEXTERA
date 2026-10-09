
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiFileText,
  FiDownload,
  FiSave,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiBookOpen,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { finalizacionApi } from "../hooks/informefinalizado";
const ESTADO_LABEL = {
  borrador: "Borrador",
  observado: "Observado",
  enviado: "En revisión",
  aprobado: "Aprobado",
  finalizado: "Finalizado",
};

const texto = (valor) =>
  valor === null || valor === undefined || valor === "" ? "—" : valor;

const obtenerMensajeError = (error) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.mensaje) return data.mensaje;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([campo, mensajes]) => {
        const detalle = Array.isArray(mensajes)
          ? mensajes.join(", ")
          : String(mensajes);

        return `${campo}: ${detalle}`;
      })
      .join("\n");
  }

  return error?.message || "Ocurrió un error inesperado.";
};

const crearFormulario = (respuesta = {}) => {
  const datosProyecto = respuesta.datos_proyecto || {};
  const finalizacion = respuesta.finalizacion || {};
  const textos = respuesta.textos || {};

  return {
    ...respuesta,
    datos_proyecto: datosProyecto,
    finalizacion,
    textos: {
      conclusiones: textos.conclusiones || "",
      recomendaciones: textos.recomendaciones || "",
      lecciones_aprendidas: textos.lecciones_aprendidas || "",
      medio_difusion: textos.medio_difusion || "",
    },
    metas_indicadores: (respuesta.metas_indicadores || []).map((meta) => ({
      ...meta,
      valor_alcanzado: meta.valor_alcanzado ?? "",
    })),
    partidas_presupuesto: (respuesta.partidas_presupuesto || []).map(
      (partida) => ({
        ...partida,
        monto_ejecutado: partida.monto_ejecutado ?? "",
      })
    ),
    actividades: respuesta.actividades || [],
    docentes_participantes: respuesta.docentes_participantes || [],
    revisiones_finalizacion: respuesta.revisiones_finalizacion || [],
  };
};

const InformeFinalizacion = ({
  proyectos = [],
  proyectoIdInicial = "",
  esDepartamento = false,
}) => {
  const [proyectoId, setProyectoId] = useState(
    proyectoIdInicial ? String(proyectoIdInicial) : ""
  );
  const [informe, setInforme] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarContinuacion, setMostrarContinuacion] = useState(false);

  const [continuacion, setContinuacion] = useState({
    periodo: "",
    docentes_adicionales: [],
  });

  const [nuevoDocente, setNuevoDocente] = useState({
    docente: "",
    rol_en_proyecto: "Colaborador",
  });

  const cargarInforme = useCallback(async (id = proyectoId) => {
    if (!id) {
      setInforme(null);
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta = await finalizacionApi.obtenerInforme(id);
      setInforme(crearFormulario(respuesta));
    } catch (err) {
      setInforme(null);
      setError(obtenerMensajeError(err));
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    if (proyectoId) {
      cargarInforme(proyectoId);
    } else {
      setInforme(null);
    }
  }, [proyectoId, cargarInforme]);

  const estado = String(
    informe?.finalizacion?.estado || informe?.estado_finalizacion || "borrador"
  ).toLowerCase();

  const bloqueado = ["enviado", "aprobado"].includes(estado);
  const habilitado = informe?.finalizacion?.habilitado !== false;
  const esFinalizado = String(informe?.estado || "").toLowerCase() === "finalizado";

  const camposPendientes = informe?.finalizacion?.campos_pendientes || [];

  const progresoFormulario = useMemo(() => {
    if (!informe) return 0;

    const campos = [
      informe.textos?.conclusiones,
      informe.textos?.recomendaciones,
      informe.textos?.lecciones_aprendidas,
      informe.textos?.medio_difusion,
    ];

    const completados = campos.filter(
      (campo) => String(campo || "").trim().length > 0
    ).length;

    return Math.round((completados / campos.length) * 100);
  }, [informe]);

  const actualizarTexto = (campo, valor) => {
    setInforme((actual) => ({
      ...actual,
      textos: {
        ...actual.textos,
        [campo]: valor,
      },
    }));
  };

  const actualizarMeta = (id, valor) => {
    setInforme((actual) => ({
      ...actual,
      metas_indicadores: actual.metas_indicadores.map((meta) =>
        meta.id === id ? { ...meta, valor_alcanzado: valor } : meta
      ),
    }));
  };

  const actualizarPartida = (id, valor) => {
    setInforme((actual) => ({
      ...actual,
      partidas_presupuesto: actual.partidas_presupuesto.map((partida) =>
        partida.id === id ? { ...partida, monto_ejecutado: valor } : partida
      ),
    }));
  };

  const construirPayload = () => ({
    conclusiones: informe.textos.conclusiones,
    recomendaciones: informe.textos.recomendaciones,
    lecciones_aprendidas: informe.textos.lecciones_aprendidas,
    medio_difusion: informe.textos.medio_difusion,
    metas: informe.metas_indicadores.map((meta) => ({
      id: meta.id,
      valor_alcanzado:
        meta.valor_alcanzado === "" ? null : Number(meta.valor_alcanzado),
    })),
    partidas: informe.partidas_presupuesto.map((partida) => ({
      id: partida.id,
      monto_ejecutado:
        partida.monto_ejecutado === ""
          ? null
          : Number(partida.monto_ejecutado),
    })),
  });

  const guardarInforme = async ({ silencioso = false } = {}) => {
    if (!proyectoId || !informe) return false;

    setGuardando(true);
    setError("");
    if (!silencioso) setMensaje("");

    try {
      await finalizacionApi.actualizarInforme(
        proyectoId,
        construirPayload()
      );

      // El PATCH puede no devolver contenido: recuperar el estado real.
      const actualizado = await finalizacionApi.obtenerInforme(proyectoId);
      setInforme(crearFormulario(actualizado));

      if (!silencioso) {
        setMensaje("Informe guardado correctamente.");
      }

      return true;
    } catch (err) {
      setError(obtenerMensajeError(err));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const enviarInforme = async () => {
    if (!proyectoId || !informe) return;

    const confirmar = window.confirm(
      "¿Deseas enviar el informe para revisión? Verifica que todos los campos estén completos."
    );

    if (!confirmar) return;

    setEnviando(true);
    setError("");
    setMensaje("");

    try {
      // Primero guarda los cambios del formulario.
      await finalizacionApi.actualizarInforme(
        proyectoId,
        construirPayload()
      );

      // Después solicita la revisión.
      await finalizacionApi.enviarInforme(proyectoId);

      // No depender de la respuesta del POST: consultar nuevamente.
      const actualizado = await finalizacionApi.obtenerInforme(proyectoId);
      setInforme(crearFormulario(actualizado));

      setMensaje("Informe enviado para revisión correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const descargarPdf = async (tipo) => {
    if (!proyectoId) return;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const archivo =
        tipo === "informe"
          ? await finalizacionApi.obtenerInformePdf(proyectoId)
          : await finalizacionApi.obtenerConstanciaPdf(proyectoId);

      const blob =
        archivo instanceof Blob
          ? archivo
          : new Blob([archivo], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download =
        tipo === "informe"
          ? `informe-finalizacion-${proyectoId}.pdf`
          : `constancia-${proyectoId}.pdf`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const finalizarProyecto = async () => {
    if (!proyectoId) return;

    const confirmar = window.confirm(
      "¿Confirmas la aprobación del informe y la finalización del proyecto? Esta acción también inicia la generación de la constancia."
    );

    if (!confirmar) return;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      await finalizacionApi.finalizarProyecto(proyectoId);
      await cargarInforme(proyectoId);
      setMensaje(
        "Solicitud procesada. Se actualizó la información del proyecto."
      );
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const aprobarConstancia = async () => {
    if (!proyectoId) return;

    const confirmar = window.confirm(
      "¿Deseas aprobar la constancia de este proyecto?"
    );

    if (!confirmar) return;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      await finalizacionApi.aprobarConstancia(proyectoId);
      await cargarInforme(proyectoId);
      setMensaje("Solicitud de aprobación de constancia procesada.");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const agregarDocente = () => {
    if (!nuevoDocente.docente || !nuevoDocente.rol_en_proyecto.trim()) {
      setError("Ingresa el identificador del docente y su rol.");
      return;
    }

    setContinuacion((actual) => ({
      ...actual,
      docentes_adicionales: [
        ...actual.docentes_adicionales,
        {
          docente: Number(nuevoDocente.docente),
          rol_en_proyecto: nuevoDocente.rol_en_proyecto.trim(),
        },
      ],
    }));

    setNuevoDocente({
      docente: "",
      rol_en_proyecto: "Colaborador",
    });
    setError("");
  };

  const continuarProyecto = async (event) => {
    event.preventDefault();

    if (!proyectoId || !continuacion.periodo.trim()) {
      setError("Debes ingresar el periodo de continuación.");
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      await finalizacionApi.continuarProyecto(proyectoId, {
        periodo: continuacion.periodo.trim(),
        docentes_adicionales: continuacion.docentes_adicionales,
      });

      setMostrarContinuacion(false);
      setContinuacion({
        periodo: "",
        docentes_adicionales: [],
      });

      await cargarInforme(proyectoId);
      setMensaje("Solicitud de continuación registrada correctamente.");
    } catch (err) {
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };

  const datos = informe?.datos_proyecto || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-sm font-medium text-[#701d2a]">
              RSU · Gestión de proyectos
            </p>
            <h1 className="text-2xl font-bold">
              Informe de finalización
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Registra los resultados, las metas alcanzadas y la ejecución
              presupuestal del proyecto.
            </p>
          </div>

          <button
            type="button"
            onClick={() => cargarInforme()}
            disabled={!proyectoId || cargando}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mensaje && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <FiCheckCircle className="mt-0.5 shrink-0" />
            <span>{mensaje}</span>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="proyecto"
            className="mb-2 block text-sm font-semibold"
          >
            Seleccionar proyecto
          </label>

          <select
            id="proyecto"
            value={proyectoId}
            onChange={(event) => {
              setProyectoId(event.target.value);
              setMensaje("");
              setError("");
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-[#701d2a] focus:ring-2 focus:ring-[#701d2a]/10"
          >
            <option value="">Selecciona un proyecto</option>
            {proyectos.map((proyecto) => (
              <option
                key={proyecto.id}
                value={String(proyecto.id)}
              >
                {proyecto.codigo ? `${proyecto.codigo} — ` : ""}
                {proyecto.titulo || proyecto.nombre || `Proyecto ${proyecto.id}`}
              </option>
            ))}
          </select>

          {proyectos.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              No se recibieron proyectos para el selector. Verifica que el
              componente padre envíe la propiedad proyectos.
            </p>
          )}
        </section>

        {cargando ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-slate-500">
            <FiRefreshCw className="animate-spin" />
            Cargando información del proyecto...
          </div>
        ) : !informe ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FiFileText className="mx-auto mb-3 text-3xl text-slate-400" />
            <h2 className="font-semibold">Selecciona un proyecto</h2>
            <p className="mt-1 text-sm text-slate-500">
              Aquí se mostrarán sus datos y el formulario de finalización.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {texto(informe.codigo)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {texto(informe.titulo)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Periodo: {texto(datos.periodo)}
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  {ESTADO_LABEL[estado] || estado}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Dato
                  icon={<FiCalendar />}
                  titulo="Fecha de inicio"
                  valor={datos.fecha_inicio}
                />
                <Dato
                  icon={<FiCalendar />}
                  titulo="Fecha de término"
                  valor={datos.fecha_termino}
                />
                <Dato
                  icon={<FiUsers />}
                  titulo="Beneficiarios"
                  valor={datos.nro_beneficiarios}
                />
                <Dato
                  icon={<FiBookOpen />}
                  titulo="Eje RSU"
                  valor={datos.eje_rsu}
                />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">Completitud de los textos</span>
                  <span className="font-semibold">{progresoFormulario}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#701d2a] transition-all"
                    style={{ width: `${progresoFormulario}%` }}
                  />
                </div>
              </div>
            </section>

            {camposPendientes.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Campos pendientes</p>
                <p className="mt-1">
                  {camposPendientes.join(", ")}
                </p>
              </div>
            )}

            {estado === "observado" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Informe observado</p>
                <p className="mt-1">
                  Revisa las observaciones del Departamento, corrige el informe
                  y vuelve a enviarlo.
                </p>

                {(informe.revisiones_finalizacion || []).map((revision, index) => (
                  <div
                    key={revision.id ?? index}
                    className="mt-3 border-t border-amber-200 pt-3"
                  >
                    <p>{revision.comentario || revision.observacion || "Sin comentario registrado."}</p>
                    {revision.fecha && (
                      <p className="mt-1 text-xs">
                        Fecha: {revision.fecha}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-lg bg-[#701d2a]/10 p-3 text-[#701d2a]">
                  <FiFileText size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Desarrollo del informe</h2>
                  <p className="text-sm text-slate-500">
                    Completa los resultados y aprendizajes del proyecto.
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <CampoTexto
                  label="Conclusiones"
                  value={informe.textos.conclusiones}
                  onChange={(value) => actualizarTexto("conclusiones", value)}
                  disabled={bloqueado}
                  placeholder="Describe los principales resultados y conclusiones..."
                />

                <CampoTexto
                  label="Recomendaciones"
                  value={informe.textos.recomendaciones}
                  onChange={(value) => actualizarTexto("recomendaciones", value)}
                  disabled={bloqueado}
                  placeholder="Registra las recomendaciones para futuras iniciativas..."
                />

                <CampoTexto
                  label="Lecciones aprendidas"
                  value={informe.textos.lecciones_aprendidas}
                  onChange={(value) =>
                    actualizarTexto("lecciones_aprendidas", value)
                  }
                  disabled={bloqueado}
                  placeholder="Describe las dificultades, aprendizajes y mejoras..."
                />

                <CampoTexto
                  label="Medio de difusión"
                  value={informe.textos.medio_difusion}
                  onChange={(value) => actualizarTexto("medio_difusion", value)}
                  disabled={bloqueado}
                  placeholder="Indica cómo se difundieron los resultados..."
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-3 text-blue-700">
                  <FiTarget size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Metas e indicadores</h2>
                  <p className="text-sm text-slate-500">
                    Registra el valor alcanzado para cada indicador.
                  </p>
                </div>
              </div>

              {informe.metas_indicadores.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  El proyecto no tiene metas o indicadores registrados.
                </p>
              ) : (
                <div className="space-y-4">
                  {informe.metas_indicadores.map((meta) => (
                    <div
                      key={meta.id}
                      className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_130px_130px_160px]"
                    >
                      <div>
                        <p className="font-semibold">
                          {texto(meta.descripcion)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Línea base: {texto(meta.linea_base)} · Meta:
                          {" "}{texto(meta.valor_meta)}
                        </p>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-slate-500">
                          Línea base
                        </label>
                        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                          {texto(meta.linea_base)}
                        </p>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-slate-500">
                          Valor meta
                        </label>
                        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                          {texto(meta.valor_meta)}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`meta-${meta.id}`}
                          className="mb-1 block text-xs font-medium text-slate-600"
                        >
                          Valor alcanzado
                        </label>
                        <input
                          id={`meta-${meta.id}`}
                          type="number"
                          step="any"
                          value={meta.valor_alcanzado}
                          disabled={bloqueado}
                          onChange={(event) =>
                            actualizarMeta(meta.id, event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#701d2a] disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <FiDollarSign size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Ejecución presupuestal</h2>
                  <p className="text-sm text-slate-500">
                    Registra el monto ejecutado por partida.
                  </p>
                </div>
              </div>

              {informe.partidas_presupuesto.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  El proyecto no tiene partidas presupuestales registradas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 font-medium">Partida</th>
                        <th className="px-3 py-3 font-medium">Monto asignado</th>
                        <th className="px-3 py-3 font-medium">Monto ejecutado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informe.partidas_presupuesto.map((partida) => (
                        <tr
                          key={partida.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-3 py-4 font-medium">
                            {texto(partida.partida)}
                          </td>
                          <td className="px-3 py-4">
                            S/ {texto(partida.monto)}
                          </td>
                          <td className="px-3 py-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              aria-label={`Monto ejecutado: ${partida.partida}`}
                              value={partida.monto_ejecutado}
                              disabled={bloqueado}
                              onChange={(event) =>
                                actualizarPartida(
                                  partida.id,
                                  event.target.value
                                )
                              }
                              className="w-full max-w-48 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#701d2a] disabled:bg-slate-100"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Actividades y evidencias</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consulta las actividades y los avances registrados en el proyecto.
                </p>
              </div>

              {informe.actividades.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No hay actividades registradas.
                </p>
              ) : (
                <div className="space-y-4">
                  {informe.actividades.map((actividad) => (
                    <details
                      key={actividad.id}
                      className="rounded-lg border border-slate-200"
                    >
                      <summary className="cursor-pointer list-none p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <span className="font-semibold">
                            {actividad.nombre}
                          </span>
                          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs">
                            {texto(actividad.estado)}
                          </span>
                        </div>
                      </summary>

                      <div className="space-y-3 border-t border-slate-200 p-4">
                        {(actividad.avances || []).length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No hay avances registrados.
                          </p>
                        ) : (
                          actividad.avances.map((avance) => (
                            <div
                              key={avance.id}
                              className="rounded-lg bg-slate-50 p-3"
                            >
                              <p className="text-sm">
                                {avance.descripcion}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Fecha: {texto(avance.fecha_registro)}
                              </p>

                              {(avance.evidencias || []).length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {avance.evidencias.map((evidencia, index) => (
                                    evidencia.archivo ? (
                                      <a
                                        key={evidencia.id ?? index}
                                        href={evidencia.archivo}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#701d2a] hover:bg-slate-100"
                                      >
                                        <FiFileText />
                                        Ver evidencia {index + 1}
                                      </a>
                                    ) : (
                                      <span
                                        key={evidencia.id ?? index}
                                        className="text-xs text-slate-500"
                                      >
                                        Evidencia: {texto(evidencia.tipo)}
                                      </span>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>

            {informe.docentes_participantes.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold">
                  Docentes participantes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {informe.docentes_participantes.map((docente, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-slate-100 px-3 py-2 text-sm"
                    >
                      {typeof docente === "string"
                        ? docente
                        : docente.nombre_completo ||
                          docente.nombre ||
                          `Docente ${docente.id || index + 1}`}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Acciones del informe</h2>
              <p className="mt-1 text-sm text-slate-500">
                Las operaciones disponibles dependen del estado del proyecto y
                de los permisos del usuario.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {!bloqueado && (
                  <>
                    <button
                      type="button"
                      onClick={() => guardarInforme()}
                      disabled={guardando || enviando}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#701d2a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#581622] disabled:opacity-50"
                    >
                      <FiSave />
                      {guardando ? "Guardando..." : "Guardar borrador"}
                    </button>

                    <button
                      type="button"
                      onClick={enviarInforme}
                      disabled={guardando || enviando || !habilitado}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#701d2a] px-4 py-2.5 text-sm font-semibold text-[#701d2a] hover:bg-[#701d2a]/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiSend />
                      {enviando ? "Enviando..." : "Enviar para revisión"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => descargarPdf("informe")}
                  disabled={procesando}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiDownload />
                  Descargar informe PDF
                </button>

                {esDepartamento && estado === "enviado" && (
                  <button
                    type="button"
                    onClick={finalizarProyecto}
                    disabled={procesando}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <FiCheckCircle />
                    Aprobar y finalizar proyecto
                  </button>
                )}

                {esDepartamento && esFinalizado && (
                  <button
                    type="button"
                    onClick={aprobarConstancia}
                    disabled={procesando}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#701d2a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#581622] disabled:opacity-50"
                  >
                    <FiCheckCircle />
                    Aprobar constancia
                  </button>
                )}

                {esFinalizado && (
                  <button
                    type="button"
                    onClick={() => descargarPdf("constancia")}
                    disabled={procesando}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    <FiDownload />
                    Descargar constancia
                  </button>
                )}

                {esFinalizado && (
                  <button
                    type="button"
                    onClick={() => setMostrarContinuacion((actual) => !actual)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    <FiPlus />
                    Continuar en otro periodo
                  </button>
                )}
              </div>

              {!habilitado && !bloqueado && (
                <p className="mt-4 text-sm text-amber-700">
                  El backend indica que el proyecto todavía no está habilitado
                  para enviar el informe.
                </p>
              )}
            </section>

            {mostrarContinuacion && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      Continuar proyecto
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Registra el nuevo periodo y, opcionalmente, docentes adicionales.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarContinuacion(false)}
                    aria-label="Cerrar formulario"
                    className="rounded-lg p-2 hover:bg-slate-100"
                  >
                    <FiX />
                  </button>
                </div>

                <form onSubmit={continuarProyecto} className="space-y-5">
                  <div>
                    <label
                      htmlFor="periodo-continuacion"
                      className="mb-1 block text-sm font-medium"
                    >
                      Nuevo periodo
                    </label>
                    <input
                      id="periodo-continuacion"
                      value={continuacion.periodo}
                      onChange={(event) =>
                        setContinuacion((actual) => ({
                          ...actual,
                          periodo: event.target.value,
                        }))
                      }
                      required
                      placeholder="Ej. 2027-I"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#701d2a]"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label
                        htmlFor="docente-adicional"
                        className="mb-1 block text-sm font-medium"
                      >
                        ID del docente
                      </label>
                      <input
                        id="docente-adicional"
                        type="number"
                        min="1"
                        value={nuevoDocente.docente}
                        onChange={(event) =>
                          setNuevoDocente((actual) => ({
                            ...actual,
                            docente: event.target.value,
                          }))
                        }
                        placeholder="ID de usuario"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#701d2a]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="rol-docente"
                        className="mb-1 block text-sm font-medium"
                      >
                        Rol en el proyecto
                      </label>
                      <input
                        id="rol-docente"
                        value={nuevoDocente.rol_en_proyecto}
                        onChange={(event) =>
                          setNuevoDocente((actual) => ({
                            ...actual,
                            rol_en_proyecto: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#701d2a]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={agregarDocente}
                      className="self-end rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                    >
                      Agregar
                    </button>
                  </div>

                  {continuacion.docentes_adicionales.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Docentes adicionales
                      </p>

                      {continuacion.docentes_adicionales.map((docente, index) => (
                        <div
                          key={`${docente.docente}-${index}`}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span>
                            ID {docente.docente} · {docente.rol_en_proyecto}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setContinuacion((actual) => ({
                                ...actual,
                                docentes_adicionales:
                                  actual.docentes_adicionales.filter(
                                    (_, i) => i !== index
                                  ),
                              }))
                            }
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            aria-label="Eliminar docente"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={procesando}
                    className="rounded-lg bg-[#701d2a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#581622] disabled:opacity-50"
                  >
                    {procesando
                      ? "Procesando..."
                      : "Registrar continuación"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const Dato = ({ icon, titulo, valor }) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <div className="mb-2 flex items-center gap-2 text-slate-500">
      {icon}
      <span className="text-xs">{titulo}</span>
    </div>
    <p className="text-sm font-semibold">{texto(valor)}</p>
  </div>
);

const CampoTexto = ({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}) => (
  <div>
    <label className="mb-2 block text-sm font-semibold">{label}</label>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      rows={4}
      placeholder={placeholder}
      className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#701d2a] focus:ring-2 focus:ring-[#701d2a]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  </div>
);

export default InformeFinalizacion;