import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../shared/layout/Layout";

import {
  FiSearch,
  FiFileText,
  FiSave,
  FiSend,
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiUsers,
  FiCalendar,
  FiMapPin,
  FiTarget,
  FiDollarSign,
  FiBookOpen,
  FiActivity,
  FiEye,
  FiUpload,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import {
  obtenerInformeFinalizacion,
  guardarInformeFinalizacion,
  enviarInformeFinalizacion,
  descargarInformeFinalizacion,
  obtenerSeguimientoProyecto,
  registrarEvidenciaActividad,
} from "../hooks/informefinalizado";

import { useProyectosListado } from "../../listar/hooks/useProyectosListado";

// =========================================================
// INFORME DE FINALIZACIÓN
// SPRINT 8
// =========================================================

const InformeFinalizacion = () => {
  // =========================================================
  // PROYECTOS DEL DOCENTE
  // =========================================================

  const {
    projectsDb = [],
    proyectosTodos = [],
    proyectosFiltrados = [],
    loading = false,
    loadingTodos = false,
    searchTerm = "",
    setSearchTerm = () => {},
  } = useProyectosListado();

  const proyectosBase = useMemo(() => {
    if (Array.isArray(proyectosTodos) && proyectosTodos.length > 0) {
      return proyectosTodos;
    }

    if (Array.isArray(projectsDb)) {
      return projectsDb;
    }

    return [];
  }, [proyectosTodos, projectsDb]);

  // =========================================================
  // ESTADOS
  // =========================================================

  const [proyectoSeleccionado, setProyectoSeleccionado] =
    useState(null);

  const [mostrarProyectos, setMostrarProyectos] =
    useState(false);

  const [busquedaProyecto, setBusquedaProyecto] =
    useState(searchTerm || "");

  const [informe, setInforme] = useState(null);

  const [seguimiento, setSeguimiento] =
    useState(null);

  const [loadingInforme, setLoadingInforme] =
    useState(false);

  const [loadingSeguimiento, setLoadingSeguimiento] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [descargando, setDescargando] =
    useState(false);

  const [registrandoEvidencia, setRegistrandoEvidencia] =
    useState(null);

  const [archivoEvidencia, setArchivoEvidencia] =
    useState({});

  const [observacionEvidencia, setObservacionEvidencia] =
    useState({});

  const [error, setError] = useState("");

  const [mensaje, setMensaje] = useState("");

  const [seccionActiva, setSeccionActiva] =
    useState(0);

  // =========================================================
  // CAMPOS EDITABLES
  // =========================================================

  const [textos, setTextos] = useState({
    conclusiones: "",
    recomendaciones: "",
    lecciones_aprendidas: "",
    medio_difusion: "",
  });

  const [metas, setMetas] = useState([]);

  const [partidas, setPartidas] = useState([]);

  // =========================================================
  // SECCIONES
  // =========================================================

  const secciones = [
    {
      numero: "I",
      titulo: "Datos generales",
      icono: FiFileText,
    },
    {
      numero: "II",
      titulo: "Fortalezas y limitaciones",
      icono: FiActivity,
    },
    {
      numero: "III",
      titulo: "Resultados",
      icono: FiTarget,
    },
    {
      numero: "IV",
      titulo: "Lecciones aprendidas",
      icono: FiBookOpen,
    },
    {
      numero: "V",
      titulo: "Conclusiones",
      icono: FiFileText,
    },
    {
      numero: "VI",
      titulo: "Recomendaciones",
      icono: FiFileText,
    },
    {
      numero: "VII",
      titulo: "Cronología",
      icono: FiCalendar,
    },
    {
      numero: "VIII",
      titulo: "Metas e indicadores",
      icono: FiTarget,
    },
    {
      numero: "IX",
      titulo: "Ejecución presupuestal",
      icono: FiDollarSign,
    },
    {
      numero: "X",
      titulo: "Evidencias",
      icono: FiEye,
    },
    {
      numero: "XI",
      titulo: "Envío y revisión",
      icono: FiSend,
    },
  ];

  // =========================================================
  // FILTRAR PROYECTOS
  // =========================================================

  const proyectosParaMostrar = useMemo(() => {
    const lista =
      Array.isArray(proyectosFiltrados) &&
      proyectosFiltrados.length > 0
        ? proyectosFiltrados
        : proyectosBase;

    const termino = String(
      busquedaProyecto || ""
    )
      .trim()
      .toLowerCase();

    if (!termino) {
      return lista;
    }

    return lista.filter((proyecto) => {
      const codigo = String(
        proyecto?.codigo || ""
      ).toLowerCase();

      const titulo = String(
        proyecto?.titulo ||
          proyecto?.nombre ||
          ""
      ).toLowerCase();

      const estado = String(
        proyecto?.estado || ""
      ).toLowerCase();

      return (
        codigo.includes(termino) ||
        titulo.includes(termino) ||
        estado.includes(termino)
      );
    });
  }, [
    proyectosFiltrados,
    proyectosBase,
    busquedaProyecto,
  ]);

  // =========================================================
  // CARGAR INFORME
  // =========================================================

  const cargarInforme = async (proyectoId) => {
    if (
      proyectoId === undefined ||
      proyectoId === null ||
      proyectoId === ""
    ) {
      return;
    }

    setLoadingInforme(true);
    setError("");
    setMensaje("");

    try {
      const response =
        await obtenerInformeFinalizacion(
          proyectoId
        );

      const data =
        response?.data ?? response;

      setInforme(data || null);

      setTextos({
        conclusiones:
          data?.textos?.conclusiones || "",

        recomendaciones:
          data?.textos?.recomendaciones || "",

        lecciones_aprendidas:
          data?.textos?.lecciones_aprendidas ||
          "",

        medio_difusion:
          data?.textos?.medio_difusion || "",
      });

      setMetas(
        Array.isArray(
          data?.metas_indicadores
        )
          ? data.metas_indicadores.map(
              (meta) => ({
                ...meta,
                valor_alcanzado:
                  meta?.valor_alcanzado ??
                  "",
              })
            )
          : []
      );

      setPartidas(
        Array.isArray(
          data?.partidas_presupuesto
        )
          ? data.partidas_presupuesto.map(
              (partida) => ({
                ...partida,
                monto_ejecutado:
                  partida?.monto_ejecutado ??
                  "",
              })
            )
          : []
      );

      await cargarSeguimiento(
        proyectoId
      );
    } catch (err) {
      console.error(
        "Error cargando informe:",
        err
      );

      setInforme(null);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar el informe de finalización."
      );
    } finally {
      setLoadingInforme(false);
    }
  };

  // =========================================================
  // CARGAR SEGUIMIENTO
  // =========================================================

  const cargarSeguimiento = async (
    proyectoId
  ) => {
    if (
      proyectoId === undefined ||
      proyectoId === null ||
      proyectoId === ""
    ) {
      return;
    }

    setLoadingSeguimiento(true);

    try {
      const response =
        await obtenerSeguimientoProyecto(
          proyectoId
        );

      setSeguimiento(
        response?.data ?? response
      );
    } catch (err) {
      console.error(
        "Error cargando seguimiento:",
        err
      );

      setSeguimiento(null);
    } finally {
      setLoadingSeguimiento(false);
    }
  };

  // =========================================================
  // SELECCIONAR PROYECTO
  // =========================================================

  const seleccionarProyecto = async (
    proyecto
  ) => {
    if (!proyecto?.id) {
      return;
    }

    setProyectoSeleccionado(
      proyecto
    );

    setMostrarProyectos(false);
    setError("");
    setMensaje("");
    setInforme(null);
    setSeguimiento(null);
    setSeccionActiva(0);

    await cargarInforme(
      proyecto.id
    );
  };

  // =========================================================
  // ESTADO DEL INFORME
  // =========================================================

  const estadoInforme =
    informe?.finalizacion?.estado ||
    "borrador";

  const puedeEditar =
    estadoInforme === "borrador" ||
    estadoInforme === "observado";

  // =========================================================
  // DATOS DEL INFORME
  // =========================================================

  const datosProyecto =
    informe?.datos_proyecto || {};

  const finalizacion =
    informe?.finalizacion || {};

  const actividadesInforme =
    Array.isArray(informe?.actividades)
      ? informe.actividades
      : [];

  const docentes =
    Array.isArray(
      informe?.docentes_participantes
    )
      ? informe.docentes_participantes
      : [];

  const revisiones =
    Array.isArray(
      informe?.revisiones_finalizacion
    )
      ? informe.revisiones_finalizacion
      : [];

  // =========================================================
  // ACTIVIDADES DEL SEGUIMIENTO
  // =========================================================

  const actividadesSeguimiento =
    Array.isArray(
      seguimiento?.actividades
    )
      ? seguimiento.actividades
      : actividadesInforme;

  // =========================================================
  // AVANCE
  // =========================================================

  const porcentajeEjecucion =
    seguimiento?.porcentaje_ejecucion ??
    informe?.porcentaje_ejecucion ??
    informe?.ejecucion ??
    0;

  const actividadesCompletadas =
    actividadesSeguimiento.filter(
      (actividad) =>
        actividad?.estado ===
          "completada" ||
        actividad?.estado ===
          "completado"
    ).length;

  // =========================================================
  // ACTUALIZAR TEXTOS
  // =========================================================

  const cambiarTexto = (
    campo,
    valor
  ) => {
    setTextos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // =========================================================
  // ACTUALIZAR METAS
  // =========================================================

  const cambiarMeta = (
    index,
    valor
  ) => {
    setMetas((prev) =>
      prev.map(
        (meta, i) =>
          i === index
            ? {
                ...meta,
                valor_alcanzado:
                  valor,
              }
            : meta
      )
    );
  };

  // =========================================================
  // ACTUALIZAR PARTIDAS
  // =========================================================

  const cambiarPartida = (
    index,
    valor
  ) => {
    setPartidas((prev) =>
      prev.map(
        (partida, i) =>
          i === index
            ? {
                ...partida,
                monto_ejecutado:
                  valor,
              }
            : partida
      )
    );
  };

  // =========================================================
  // GUARDAR
  // =========================================================

  const guardar = async () => {
    if (!proyectoSeleccionado?.id) {
      setError(
        "Selecciona un proyecto antes de guardar."
      );
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const payload = {
        conclusiones:
          textos.conclusiones,

        recomendaciones:
          textos.recomendaciones,

        lecciones_aprendidas:
          textos.lecciones_aprendidas,

        medio_difusion:
          textos.medio_difusion,

        metas: metas.map(
          (meta) => ({
            id: meta.id,
            valor_alcanzado:
              meta.valor_alcanzado,
          })
        ),

        partidas: partidas.map(
          (partida) => ({
            id: partida.id,
            monto_ejecutado:
              partida.monto_ejecutado,
          })
        ),
      };

      await guardarInformeFinalizacion(
        proyectoSeleccionado.id,
        payload
      );

      setMensaje(
        "Borrador guardado correctamente."
      );

      await cargarInforme(
        proyectoSeleccionado.id
      );
    } catch (err) {
      console.error(
        "Error guardando informe:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo guardar el informe."
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // ENVIAR
  // =========================================================

  const enviar = async () => {
    if (!proyectoSeleccionado?.id) {
      setError(
        "Selecciona un proyecto antes de enviar."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Deseas enviar este informe al Departamento para su revisión?"
      )
    ) {
      return;
    }

    setEnviando(true);
    setError("");
    setMensaje("");

    try {
      await enviarInformeFinalizacion(
        proyectoSeleccionado.id
      );

      setMensaje(
        "Informe enviado correctamente al Departamento."
      );

      await cargarInforme(
        proyectoSeleccionado.id
      );

      setSeccionActiva(10);
    } catch (err) {
      console.error(
        "Error enviando informe:",
        err
      );

      const data =
        err?.response?.data;

      let mensajeError =
        data?.detail ||
        data?.message ||
        err?.message ||
        "No se pudo enviar el informe.";

      if (
        Array.isArray(
          data?.campos_pendientes
        )
      ) {
        mensajeError +=
          ` Campos pendientes: ${data.campos_pendientes.join(
            ", "
          )}`;
      }

      setError(
        mensajeError
      );
    } finally {
      setEnviando(false);
    }
  };

  // =========================================================
  // DESCARGAR PDF
  // =========================================================

  const descargarPDF = async () => {
    if (!proyectoSeleccionado?.id) {
      setError(
        "Selecciona un proyecto."
      );
      return;
    }

    setDescargando(true);
    setError("");

    try {
      const response =
        await descargarInformeFinalizacion(
          proyectoSeleccionado.id
        );

      const blob =
        response?.data instanceof Blob
          ? response.data
          : response instanceof Blob
          ? response
          : null;

      if (!blob) {
        throw new Error(
          "El servidor no devolvió un PDF válido."
        );
      }

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `informe-finalizacion-${
          proyectoSeleccionado.codigo ||
          proyectoSeleccionado.id
        }.pdf`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      console.error(
        "Error descargando PDF:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "No se pudo descargar el informe."
      );
    } finally {
      setDescargando(false);
    }
  };

  // =========================================================
  // EVIDENCIA
  // =========================================================

  const cambiarArchivo = (
    actividadId,
    archivo
  ) => {
    setArchivoEvidencia(
      (prev) => ({
        ...prev,
        [actividadId]: archivo,
      })
    );
  };

  const cambiarObservacionEvidencia = (
    actividadId,
    valor
  ) => {
    setObservacionEvidencia(
      (prev) => ({
        ...prev,
        [actividadId]: valor,
      })
    );
  };

  const registrarEvidencia = async (
    actividadId
  ) => {
    const archivo =
      archivoEvidencia[
        actividadId
      ];

    const observacion =
      observacionEvidencia[
        actividadId
      ] || "";

    if (!archivo) {
      setError(
        "Selecciona un archivo antes de registrar la evidencia."
      );
      return;
    }

    setRegistrandoEvidencia(
      actividadId
    );

    setError("");
    setMensaje("");

    try {
      const formData =
        new FormData();

      formData.append(
        "archivo",
        archivo
      );

      if (observacion.trim()) {
        formData.append(
          "observacion",
          observacion.trim()
        );
      }

      await registrarEvidenciaActividad(
        proyectoSeleccionado.id,
        actividadId,
        formData
      );

      setMensaje(
        "Evidencia registrada correctamente."
      );

      setArchivoEvidencia(
        (prev) => ({
          ...prev,
          [actividadId]: null,
        })
      );

      setObservacionEvidencia(
        (prev) => ({
          ...prev,
          [actividadId]: "",
        })
      );

      await cargarInforme(
        proyectoSeleccionado.id
      );
    } catch (err) {
      console.error(
        "Error registrando evidencia:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo registrar la evidencia."
      );
    } finally {
      setRegistrandoEvidencia(
        null
      );
    }
  };

  // =========================================================
  // PROGRESO DEL INFORME
  // =========================================================

  const seccionesCompletadas =
    useMemo(() => {
      let total = 1;

      if (
        textos.lecciones_aprendidas?.trim()
      ) {
        total++;
      }

      if (
        textos.conclusiones?.trim()
      ) {
        total++;
      }

      if (
        textos.recomendaciones?.trim()
      ) {
        total++;
      }

      if (metas.length > 0) {
        total++;
      }

      if (partidas.length > 0) {
        total++;
      }

      if (
        actividadesSeguimiento.length >
        0
      ) {
        total++;
      }

      if (
        estadoInforme ===
          "enviado" ||
        estadoInforme ===
          "aprobado"
      ) {
        total++;
      }

      return Math.min(
        total,
        secciones.length
      );
    }, [
      textos,
      metas,
      partidas,
      actividadesSeguimiento,
      estadoInforme,
    ]);

  // =========================================================
  // RENDER SECCIÓN
  // =========================================================

  const renderSeccion = () => {
    switch (seccionActiva) {
      // =====================================================
      // I
      // =====================================================

      case 0:
        return (
          <SectionCard
            numero="I"
            titulo="Datos generales"
            descripcion="Datos heredados del proyecto aprobado y datos del informe."
          >
            <div className="mb-7">
              <h4 className="text-sm font-bold text-slate-800 mb-4">
                Encabezado del informe
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <CampoLectura
                  label="Código del proyecto"
                  value={
                    informe?.codigo ||
                    proyectoSeleccionado?.codigo
                  }
                />

                <CampoLectura
                  label="Título del proyecto"
                  value={
                    informe?.titulo ||
                    proyectoSeleccionado?.titulo ||
                    proyectoSeleccionado?.nombre
                  }
                />

                <CampoLectura
                  label="Periodo"
                  value={
                    datosProyecto?.periodo
                  }
                />

                <CampoLectura
                  label="Fecha de inicio"
                  value={
                    datosProyecto?.fecha_inicio
                  }
                />

                <CampoLectura
                  label="Fecha de término"
                  value={
                    datosProyecto?.fecha_termino
                  }
                />

                <CampoLectura
                  label="Lugar de ejecución"
                  value={
                    datosProyecto?.lugar_ejecucion
                  }
                />

                <CampoLectura
                  label="Número de beneficiarios"
                  value={
                    datosProyecto?.nro_beneficiarios
                  }
                />

                <CampoLectura
                  label="Eje RSU"
                  value={
                    datosProyecto?.eje_rsu
                  }
                />

              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">
                Docentes participantes
              </h4>

              {docentes.length ===
              0 ? (
                <p className="text-xs text-slate-400">
                  No hay docentes participantes registrados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">

                  {docentes.map(
                    (
                      docente,
                      index
                    ) => (
                      <span
                        key={
                          docente?.id ||
                          index
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600"
                      >
                        <FiUsers className="text-[#b1122b]" />

                        {typeof docente ===
                        "string"
                          ? docente
                          : docente?.nombre ||
                            docente?.nombre_completo ||
                            docente?.name ||
                            "Docente"}
                      </span>
                    )
                  )}

                </div>
              )}
            </div>
          </SectionCard>
        );

      // =====================================================
      // II
      // =====================================================

      case 1:
        return (
          <SectionCard
            numero="II"
            titulo="Fortalezas y limitaciones"
            descripcion="Información relacionada con la ejecución del proyecto."
          >
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">

              <div className="flex items-start gap-3">

                <FiActivity className="text-[#b1122b] mt-0.5" />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Información del proyecto
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Esta sección se muestra dentro del formato del informe. Los campos editables disponibles en el Sprint 8 son los definidos por el endpoint de Informe de Finalización.
                  </p>

                </div>

              </div>

            </div>
          </SectionCard>
        );

      // =====================================================
      // III
      // =====================================================

      case 2:
        return (
          <SectionCard
            numero="III"
            titulo="Resultados"
            descripcion="Resultados derivados de las actividades y del avance registrado."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              <Indicador
                icon={<FiActivity />}
                titulo="Avance de ejecución"
                valor={`${porcentajeEjecucion}%`}
              />

              <Indicador
                icon={<FiCheckCircle />}
                titulo="Actividades completadas"
                valor={`${actividadesCompletadas}/${actividadesSeguimiento.length}`}
              />

              <Indicador
                icon={<FiTarget />}
                titulo="Metas registradas"
                valor={metas.length}
              />

            </div>

            <h4 className="text-sm font-bold text-slate-800 mb-3">
              Actividades
            </h4>

            {actividadesSeguimiento.length ===
            0 ? (
              <EmptyState texto="No hay actividades registradas." />
            ) : (
              <div className="space-y-3">

                {actividadesSeguimiento.map(
                  (
                    actividad,
                    index
                  ) => (
                    <div
                      key={
                        actividad?.id ||
                        index
                      }
                      className="border border-slate-200 rounded-xl p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-semibold text-slate-700">
                          {
                            actividad?.nombre ||
                            actividad?.titulo ||
                            "Actividad"
                          }
                        </p>

                        <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {
                            actividad?.estado ||
                            "—"
                          }
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}
          </SectionCard>
        );

      // =====================================================
      // IV
      // =====================================================

      case 3:
        return (
          <SectionCard
            numero="IV"
            titulo="Lecciones aprendidas"
            descripcion="Registra las principales lecciones aprendidas durante la ejecución."
          >
            <CampoTexto
              label="Lecciones aprendidas"
              obligatorio
              disabled={!puedeEditar}
              value={
                textos.lecciones_aprendidas
              }
              onChange={(value) =>
                cambiarTexto(
                  "lecciones_aprendidas",
                  value
                )
              }
              placeholder="Escribe las lecciones aprendidas..."
            />
          </SectionCard>
        );

      // =====================================================
      // V
      // =====================================================

      case 4:
        return (
          <SectionCard
            numero="V"
            titulo="Conclusiones"
            descripcion="Conclusiones finales del proyecto."
          >
            <CampoTexto
              label="Conclusiones"
              obligatorio
              disabled={!puedeEditar}
              value={
                textos.conclusiones
              }
              onChange={(value) =>
                cambiarTexto(
                  "conclusiones",
                  value
                )
              }
              placeholder="Escribe las conclusiones..."
            />
          </SectionCard>
        );

      // =====================================================
      // VI
      // =====================================================

      case 5:
        return (
          <SectionCard
            numero="VI"
            titulo="Recomendaciones"
            descripcion="Recomendaciones derivadas de la ejecución."
          >
            <CampoTexto
              label="Recomendaciones"
              obligatorio
              disabled={!puedeEditar}
              value={
                textos.recomendaciones
              }
              onChange={(value) =>
                cambiarTexto(
                  "recomendaciones",
                  value
                )
              }
              placeholder="Escribe las recomendaciones..."
            />

            <div className="mt-5">

              <CampoTexto
                label="Medio de difusión"
                disabled={!puedeEditar}
                value={
                  textos.medio_difusion
                }
                onChange={(value) =>
                  cambiarTexto(
                    "medio_difusion",
                    value
                  )
                }
                placeholder="Indica el medio de difusión..."
              />

            </div>
          </SectionCard>
        );

      // =====================================================
      // VII
      // =====================================================

      case 6:
        return (
          <SectionCard
            numero="VII"
            titulo="Cronología"
            descripcion="Actividades, avances y fechas registradas en el proyecto."
          >
            {loadingSeguimiento ? (
              <LoadingState texto="Cargando seguimiento..." />
            ) : actividadesSeguimiento.length ===
              0 ? (
              <EmptyState texto="No hay actividades registradas." />
            ) : (
              <div className="space-y-5">

                {actividadesSeguimiento.map(
                  (
                    actividad,
                    index
                  ) => {

                    const avances =
                      Array.isArray(
                        actividad?.avances
                      )
                        ? actividad.avances
                        : [];

                    return (
                      <div
                        key={
                          actividad?.id ||
                          index
                        }
                        className="border-l-2 border-[#b1122b]/20 pl-5"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <h4 className="text-sm font-bold text-slate-700">
                            {
                              actividad?.nombre ||
                              actividad?.titulo ||
                              "Actividad"
                            }
                          </h4>

                          <span className="text-[9px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {
                              actividad?.estado ||
                              "—"
                            }
                          </span>

                        </div>

                        {avances.length >
                        0 && (
                          <div className="mt-3 space-y-2">

                            {avances.map(
                              (
                                avance,
                                avanceIndex
                              ) => (
                                <div
                                  key={
                                    avance?.id ||
                                    avanceIndex
                                  }
                                  className="bg-slate-50 border border-slate-100 rounded-lg p-3"
                                >

                                  <p className="text-xs text-slate-600">
                                    {
                                      avance?.descripcion ||
                                      "Sin descripción"
                                    }
                                  </p>

                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {
                                      avance?.fecha_registro ||
                                      "—"
                                    }
                                  </p>

                                </div>
                              )
                            )}

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}
          </SectionCard>
        );

      // =====================================================
      // VIII
      // =====================================================

      case 7:
        return (
          <SectionCard
            numero="VIII"
            titulo="Metas e indicadores"
            descripcion="Valores de las metas registrados en el informe."
          >
            {metas.length ===
            0 ? (
              <EmptyState texto="No hay metas e indicadores registrados." />
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">

                <table className="w-full">

                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Descripción
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Línea base
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Valor meta
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Valor alcanzado
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {metas.map(
                      (
                        meta,
                        index
                      ) => (
                        <tr
                          key={
                            meta?.id ||
                            index
                          }
                          className="border-b border-slate-100"
                        >

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {
                              meta?.descripcion ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {
                              meta?.linea_base ??
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {
                              meta?.valor_meta ??
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3">

                            {puedeEditar ? (
                              <input
                                type="number"
                                value={
                                  meta?.valor_alcanzado ??
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  cambiarMeta(
                                    index,
                                    event.target
                                      .value
                                  )
                                }
                                className="w-36 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#b1122b]"
                              />
                            ) : (
                              <span className="text-xs text-slate-600">
                                {
                                  meta?.valor_alcanzado ??
                                  "—"
                                }
                              </span>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}
          </SectionCard>
        );

      // =====================================================
      // IX
      // =====================================================

      case 8:
        return (
          <SectionCard
            numero="IX"
            titulo="Ejecución presupuestal"
            descripcion="Montos presupuestados y ejecutados."
          >
            {partidas.length ===
            0 ? (
              <EmptyState texto="No hay partidas presupuestales registradas." />
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">

                <table className="w-full">

                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Partida
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Monto
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">
                        Ejecutado
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {partidas.map(
                      (
                        partida,
                        index
                      ) => (
                        <tr
                          key={
                            partida?.id ||
                            index
                          }
                          className="border-b border-slate-100"
                        >

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {
                              partida?.partida ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            S/{" "}
                            {
                              partida?.monto ??
                              "0.00"
                            }
                          </td>

                          <td className="px-4 py-3">

                            {puedeEditar ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  partida?.monto_ejecutado ??
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  cambiarPartida(
                                    index,
                                    event.target
                                      .value
                                  )
                                }
                                className="w-36 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#b1122b]"
                              />
                            ) : (
                              <span className="text-xs text-slate-600">
                                S/{" "}
                                {
                                  partida?.monto_ejecutado ??
                                  "—"
                                }
                              </span>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}
          </SectionCard>
        );

      // =====================================================
      // X
      // =====================================================

      case 9:
        return (
          <SectionCard
            numero="X"
            titulo="Evidencias"
            descripcion="Evidencias registradas y carga de nuevas evidencias."
          >
            {loadingSeguimiento ? (
              <LoadingState texto="Cargando evidencias..." />
            ) : actividadesSeguimiento.length ===
              0 ? (
              <EmptyState texto="No hay actividades disponibles." />
            ) : (
              <div className="space-y-4">

                {actividadesSeguimiento.map(
                  (
                    actividad,
                    index
                  ) => {

                    const actividadId =
                      actividad?.id;

                    const avances =
                      Array.isArray(
                        actividad?.avances
                      )
                        ? actividad.avances
                        : [];

                    return (
                      <div
                        key={
                          actividadId ||
                          index
                        }
                        className="border border-slate-200 rounded-xl p-5"
                      >

                        <div className="flex items-center justify-between gap-3 mb-4">

                          <div>
                            <h4 className="text-sm font-bold text-slate-700">
                              {
                                actividad?.nombre ||
                                actividad?.titulo ||
                                "Actividad"
                              }
                            </h4>

                            <p className="text-[10px] text-slate-400 mt-1">
                              Estado:{" "}
                              {
                                actividad?.estado ||
                                "—"
                              }
                            </p>
                          </div>

                          <FiEye className="text-slate-400" />

                        </div>

                        {avances.length >
                        0 && (
                          <div className="space-y-3 mb-4">

                            {avances.map(
                              (
                                avance,
                                avanceIndex
                              ) => {

                                const evidencias =
                                  Array.isArray(
                                    avance?.evidencias
                                  )
                                    ? avance.evidencias
                                    : [];

                                return (
                                  <div
                                    key={
                                      avance?.id ||
                                      avanceIndex
                                    }
                                    className="bg-slate-50 rounded-lg p-3"
                                  >

                                    <p className="text-xs text-slate-600">
                                      {
                                        avance?.descripcion ||
                                        "Sin descripción"
                                      }
                                    </p>

                                    {evidencias.length >
                                    0 ? (
                                      <div className="mt-3 flex flex-wrap gap-2">

                                        {evidencias.map(
                                          (
                                            evidencia,
                                            evidenciaIndex
                                          ) => {

                                            const url =
                                              evidencia?.archivo ||
                                              evidencia?.enlace_drive ||
                                              evidencia?.url;

                                            if (
                                              !url
                                            ) {
                                              return null;
                                            }

                                            return (
                                              <a
                                                key={
                                                  evidencia?.id ||
                                                  evidenciaIndex
                                                }
                                                href={
                                                  url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-[#b1122b]"
                                              >
                                                <FiEye />
                                                Ver evidencia
                                              </a>
                                            );
                                          }
                                        )}

                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 mt-2">
                                        No hay evidencias registradas.
                                      </p>
                                    )}

                                  </div>
                                );
                              }
                            )}

                          </div>
                        )}

                        {puedeEditar &&
                          actividadId && (
                            <div className="border-t border-slate-100 pt-4">

                              <p className="text-xs font-semibold text-slate-700 mb-3">
                                Registrar evidencia
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">

                                <div>

                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Archivo
                                  </label>

                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(
                                      event
                                    ) =>
                                      cambiarArchivo(
                                        actividadId,
                                        event
                                          .target
                                          .files?.[0] ||
                                          null
                                      )
                                    }
                                    className="w-full text-[10px] text-slate-500 border border-slate-200 rounded-lg p-2"
                                  />

                                </div>

                                <div>

                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Observación
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      observacionEvidencia[
                                        actividadId
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      cambiarObservacionEvidencia(
                                        actividadId,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Observación opcional"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#b1122b]"
                                  />

                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    registrarEvidencia(
                                      actividadId
                                    )
                                  }
                                  disabled={
                                    registrandoEvidencia ===
                                    actividadId
                                  }
                                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21] disabled:opacity-50"
                                >

                                  {registrandoEvidencia ===
                                  actividadId ? (
                                    <FiRefreshCw className="animate-spin" />
                                  ) : (
                                    <FiUpload />
                                  )}

                                  Registrar

                                </button>

                              </div>

                            </div>
                          )}

                      </div>
                    );
                  }
                )}

              </div>
            )}
          </SectionCard>
        );

      // =====================================================
      // XI
      // =====================================================

      case 10:
        return (
          <SectionCard
            numero="XI"
            titulo="Envío y revisión"
            descripcion="Estado del informe de finalización."
          >

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#b1122b]">

                  {estadoInforme ===
                  "aprobado" ? (
                    <FiCheckCircle />
                  ) : estadoInforme ===
                    "enviado" ? (
                    <FiSend />
                  ) : estadoInforme ===
                    "observado" ? (
                    <FiAlertCircle />
                  ) : (
                    <FiClock />
                  )}

                </div>

                <div>

                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Estado actual
                  </p>

                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {estadoInforme ===
                    "aprobado"
                      ? "Aprobado"
                      : estadoInforme ===
                        "enviado"
                      ? "Enviado al Departamento"
                      : estadoInforme ===
                        "observado"
                      ? "Observado"
                      : "Borrador"}
                  </p>

                </div>

              </div>

            </div>

            {estadoInforme ===
              "observado" &&
              revisiones.length >
                0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">

                  <div className="flex items-start gap-3">

                    <FiAlertCircle className="text-amber-600 mt-0.5" />

                    <div>

                      <p className="text-xs font-bold text-amber-800">
                        Observación del Departamento
                      </p>

                      <p className="text-xs text-amber-700 mt-1">
                        {
                          revisiones[
                            revisiones.length -
                              1
                          ]?.comentario ||
                          revisiones[
                            revisiones.length -
                              1
                          ]?.observacion ||
                          "Revisa la observación registrada."
                        }
                      </p>

                    </div>

                  </div>

                </div>
              )}

            <div className="mt-5 flex flex-wrap gap-3">

              {puedeEditar && (
                <>
                  <button
                    type="button"
                    onClick={
                      guardar
                    }
                    disabled={
                      guardando
                    }
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >

                    {guardando ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiSave />
                    )}

                    Guardar borrador

                  </button>

                  <button
                    type="button"
                    onClick={
                      enviar
                    }
                    disabled={
                      enviando
                    }
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21] disabled:opacity-50"
                  >

                    {enviando ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiSend />
                    )}

                    Enviar al Departamento

                  </button>
                </>
              )}

              {(estadoInforme ===
                "enviado" ||
                estadoInforme ===
                  "aprobado") && (
                <button
                  type="button"
                  onClick={
                    descargarPDF
                  }
                  disabled={
                    descargando
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50"
                >

                  {descargando ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiDownload />
                  )}

                  Descargar informe PDF

                </button>
              )}

            </div>

          </SectionCard>
        );

      default:
        return null;
    }
  };

  // =========================================================
  // SIN PROYECTO
  // =========================================================

  if (!proyectoSeleccionado) {
    return (
      <Layout>
        <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Informe de Finalización
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Informe de ejecución de actividades vinculadas a RSU · Formato OURS DS-PM03.02-01
            </p>

          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">

              <FiAlertCircle className="text-red-500 mt-0.5" />

              <p className="text-xs text-red-600">
                {error}
              </p>

            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">

            <div className="mb-4">

              <p className="text-xs font-bold text-slate-700">
                Proyecto en ejecución
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Busca y selecciona uno de tus proyectos.
              </p>

            </div>

            <div className="relative">

              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5">

                <FiSearch className="text-slate-400 mr-2" />

                <input
                  type="text"
                  value={
                    busquedaProyecto
                  }
                  onFocus={() =>
                    setMostrarProyectos(
                      true
                    )
                  }
                  onChange={(
                    event
                  ) => {
                    const valor =
                      event.target
                        .value;

                    setBusquedaProyecto(
                      valor
                    );

                    setSearchTerm(
                      valor
                    );

                    setMostrarProyectos(
                      true
                    );
                  }}
                  placeholder="Buscar proyectos..."
                  className="w-full outline-none text-sm text-slate-700"
                />

                {mostrarProyectos ? (
                  <FiChevronUp className="text-slate-400" />
                ) : (
                  <FiChevronDown className="text-slate-400" />
                )}

              </div>

              {mostrarProyectos && (
                <div className="absolute z-40 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">

                  {loading ||
                  loadingTodos ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-400">

                      <FiRefreshCw className="animate-spin text-[#b1122b]" />

                      Cargando proyectos...

                    </div>
                  ) : proyectosParaMostrar.length ===
                    0 ? (
                    <div className="p-8 text-center">

                      <FiFileText className="mx-auto text-2xl text-slate-300" />

                      <p className="text-xs text-slate-500 mt-2">
                        No se encontraron proyectos.
                      </p>

                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">

                      {proyectosParaMostrar.map(
                        (
                          proyecto
                        ) => (
                          <button
                            type="button"
                            key={
                              proyecto.id
                            }
                            onClick={() =>
                              seleccionarProyecto(
                                proyecto
                              )
                            }
                            className="w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50"
                          >

                            <p className="text-xs font-bold text-[#b1122b]">
                              {
                                proyecto?.codigo ||
                                `ID ${proyecto?.id}`
                              }
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {
                                proyecto?.titulo ||
                                proyecto?.nombre ||
                                "Sin título"
                              }
                            </p>

                            {proyecto?.estado && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {
                                  proyecto.estado
                                }
                              </p>
                            )}

                          </button>
                        )
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

          <div className="flex-1 flex items-center justify-center">

            <div className="text-center">

              <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-300">

                <FiFileText className="text-2xl" />

              </div>

              <h3 className="text-base font-bold text-slate-700 mt-4">
                Selecciona un proyecto
              </h3>

              <p className="text-xs text-slate-400 mt-2">
                El informe se cargará con la información real del proyecto seleccionado.
              </p>

            </div>

          </div>

        </div>
      </Layout>
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loadingInforme &&
    !informe
  ) {
    return (
      <Layout>
        <div className="p-8 flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">

          <div className="text-center">

            <FiRefreshCw className="animate-spin text-2xl text-[#b1122b] mx-auto" />

            <p className="text-sm font-semibold text-slate-600 mt-3">
              Cargando informe...
            </p>

          </div>

        </div>
      </Layout>
    );
  }

  // =========================================================
  // VISTA PRINCIPAL
  // =========================================================

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <h2 className="text-2xl font-bold text-slate-800">
              Informe de Finalización
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Informe de ejecución de actividades vinculadas a RSU · Formato OURS DS-PM03.02-01
            </p>

          </div>

          <div className="flex items-center gap-2">

            {puedeEditar && (
              <button
                type="button"
                onClick={
                  guardar
                }
                disabled={
                  guardando
                }
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:opacity-50"
              >

                {guardando ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiSave />
                )}

                {guardando
                  ? "Guardando..."
                  : "Guardar borrador"}

              </button>
            )}

            {(estadoInforme ===
              "enviado" ||
              estadoInforme ===
                "aprobado") && (
              <button
                type="button"
                onClick={
                  descargarPDF
                }
                disabled={
                  descargando
                }
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:opacity-50"
              >

                {descargando ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiDownload />
                )}

                Descargar PDF

              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            ALERTAS
        ==================================================== */}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">

            <FiAlertCircle className="text-red-500 mt-0.5" />

            <div>

              <p className="text-xs font-semibold text-red-700">
                Se produjo un error
              </p>

              <p className="text-xs text-red-600 mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {mensaje && (
          <div className="mb-5 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">

            <FiCheckCircle className="text-green-600" />

            <p className="text-xs font-semibold text-green-700">
              {mensaje}
            </p>

          </div>
        )}

        {/* ===================================================
            PROYECTO SELECCIONADO
        ==================================================== */}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-5">

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(400px,1.6fr)_1fr] gap-6 items-center">

            <div>

              <p className="text-xs font-semibold text-slate-600 mb-2">
                Proyecto en ejecución
              </p>

              <button
                type="button"
                onClick={() =>
                  setMostrarProyectos(
                    !mostrarProyectos
                  )
                }
                className="w-full min-h-[48px] px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center justify-between text-left hover:border-slate-300"
              >

                <div className="min-w-0">

                  <p className="text-xs font-bold text-slate-700 truncate">
                    {
                      proyectoSeleccionado?.codigo ||
                      `ID ${proyectoSeleccionado?.id}`
                    }
                  </p>

                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {
                      proyectoSeleccionado?.titulo ||
                      proyectoSeleccionado?.nombre ||
                      "Sin título"
                    }
                  </p>

                </div>

                {mostrarProyectos ? (
                  <FiChevronUp className="shrink-0 text-slate-400" />
                ) : (
                  <FiChevronDown className="shrink-0 text-slate-400" />
                )}

              </button>

              {mostrarProyectos && (
                <div className="relative">

                  <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">

                    <div className="p-3 border-b border-slate-100">

                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg">

                        <FiSearch className="text-slate-400" />

                        <input
                          type="text"
                          value={
                            busquedaProyecto
                          }
                          onChange={(
                            event
                          ) => {
                            const valor =
                              event.target
                                .value;

                            setBusquedaProyecto(
                              valor
                            );

                            setSearchTerm(
                              valor
                            );
                          }}
                          placeholder="Buscar proyecto..."
                          className="w-full outline-none text-xs"
                          autoFocus
                        />

                      </div>

                    </div>

                    <div className="max-h-72 overflow-y-auto">

                      {proyectosParaMostrar.length ===
                      0 ? (
                        <p className="p-6 text-center text-xs text-slate-400">
                          No se encontraron proyectos.
                        </p>
                      ) : (
                        proyectosParaMostrar.map(
                          (
                            proyecto
                          ) => (
                            <button
                              type="button"
                              key={
                                proyecto.id
                              }
                              onClick={() =>
                                seleccionarProyecto(
                                  proyecto
                                )
                              }
                              className="w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50"
                            >

                              <p className="text-xs font-bold text-[#b1122b]">
                                {
                                  proyecto?.codigo ||
                                  `ID ${proyecto?.id}`
                                }
                              </p>

                              <p className="text-sm font-semibold text-slate-700 mt-1">
                                {
                                  proyecto?.titulo ||
                                  proyecto?.nombre ||
                                  "Sin título"
                                }
                              </p>

                            </button>
                          )
                        )
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>

            <div className="grid grid-cols-3 gap-5">

              <div>

                <p className="text-[10px] text-slate-400">
                  Semestre
                </p>

                <p className="text-sm font-bold text-slate-700 mt-1">
                  {
                    datosProyecto?.periodo ||
                    "—"
                  }
                </p>

              </div>

              <div>

                <p className="text-[10px] text-slate-400">
                  Término
                </p>

                <p className="text-sm font-bold text-slate-700 mt-1">
                  {
                    datosProyecto?.fecha_termino ||
                    "—"
                  }
                </p>

              </div>

              <div>

                <p className="text-[10px] text-slate-400">
                  Avance del informe
                </p>

                <p className="text-sm font-bold text-slate-700 mt-1">
                  {seccionesCompletadas} de{" "}
                  {secciones.length} secciones
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            CONTENIDO
        ==================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)] gap-5 flex-1">

          {/* =================================================
              SIDEBAR
          ================================================== */}

          <aside>

            <div className="space-y-1">

              {secciones.map(
                (
                  seccion,
                  index
                ) => {

                  const Icon =
                    seccion.icono;

                  const activa =
                    seccionActiva ===
                    index;

                  return (
                    <button
                      type="button"
                      key={
                        seccion.numero
                      }
                      onClick={() =>
                        setSeccionActiva(
                          index
                        )
                      }
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        activa
                          ? "bg-[#eee7e9] border border-[#d9c8cc] text-[#6f1825]"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >

                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          activa
                            ? "bg-[#6f1825] text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {
                          seccion.numero
                        }
                      </span>

                      <Icon
                        className={`text-sm ${
                          activa
                            ? "text-[#6f1825]"
                            : "text-slate-400"
                        }`}
                      />

                      <span className="text-xs font-medium">
                        {
                          seccion.titulo
                        }
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </aside>

          {/* =================================================
              CONTENIDO SECCIÓN
          ================================================== */}

          <main className="min-w-0">

            {renderSeccion()}

            {/* =================================================
                NAVEGACIÓN
            ================================================== */}

            <div className="mt-4 flex items-center justify-between">

              <button
                type="button"
                disabled={
                  seccionActiva ===
                  0
                }
                onClick={() =>
                  setSeccionActiva(
                    (prev) =>
                      Math.max(
                        0,
                        prev - 1
                      )
                  )
                }
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 disabled:opacity-40"
              >
                <FiChevronDown className="rotate-90" />
                Anterior
              </button>

              <span className="text-[11px] text-slate-400">
                Sección{" "}
                {seccionActiva + 1} de{" "}
                {secciones.length}
              </span>

              {seccionActiva <
              secciones.length -
                1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSeccionActiva(
                      (prev) =>
                        Math.min(
                          secciones.length -
                            1,
                          prev + 1
                        )
                    )
                  }
                  className="px-4 py-2 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21]"
                >
                  Siguiente
                </button>
              ) : (
                puedeEditar && (
                  <button
                    type="button"
                    onClick={
                      enviar
                    }
                    disabled={
                      enviando
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[#b1122b] text-white rounded-lg text-xs font-semibold hover:bg-[#8a0e21] disabled:opacity-50"
                  >

                    {enviando ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiSend />
                    )}

                    Enviar informe

                  </button>
                )
              )}

            </div>

          </main>

        </div>

      </div>
    </Layout>
  );
};

// =============================================================
// COMPONENTES AUXILIARES
// =============================================================

const SectionCard = ({
  numero,
  titulo,
  descripcion,
  children,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      <div className="px-7 py-5 border-b border-slate-100">

        <p className="text-[10px] font-bold text-[#b1122b] uppercase tracking-wide">
          Sección {numero}
        </p>

        <h3 className="text-xl font-bold text-slate-800 mt-1">
          {titulo}
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          {descripcion}
        </p>

      </div>

      <div className="p-7">
        {children}
      </div>

    </div>
  );
};

// =============================================================

const CampoLectura = ({
  label,
  value,
}) => {
  return (
    <div>

      <label className="block text-xs font-semibold text-slate-700 mb-2">
        {label}
      </label>

      <div className="min-h-[42px] px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-600 flex items-center">
        {value || "—"}
      </div>

    </div>
  );
};

// =============================================================

const CampoTexto = ({
  label,
  obligatorio = false,
  disabled = false,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div>

      <label className="block text-xs font-semibold text-slate-700 mb-2">

        {label}

        {obligatorio && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}

      </label>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full min-h-[220px] px-3 py-3 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none resize-y focus:border-[#b1122b] disabled:bg-slate-50 disabled:text-slate-400"
      />

    </div>
  );
};

// =============================================================

const EmptyState = ({
  texto,
}) => {
  return (
    <div className="py-12 text-center">

      <FiFileText className="mx-auto text-2xl text-slate-300" />

      <p className="text-xs text-slate-400 mt-3">
        {texto}
      </p>

    </div>
  );
};

// =============================================================

const LoadingState = ({
  texto,
}) => {
  return (
    <div className="py-12 flex flex-col items-center justify-center">

      <FiRefreshCw className="animate-spin text-xl text-[#b1122b]" />

      <p className="text-xs text-slate-400 mt-3">
        {texto}
      </p>

    </div>
  );
};

// =============================================================

const Indicador = ({
  icon,
  titulo,
  valor,
}) => {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">

      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#b1122b] mb-3">
        {icon}
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {titulo}
      </p>

      <p className="text-xl font-bold text-slate-800 mt-1">
        {valor}
      </p>

    </div>
  );
};

export default InformeFinalizacion;