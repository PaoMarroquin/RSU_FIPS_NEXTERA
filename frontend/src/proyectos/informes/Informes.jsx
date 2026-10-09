import React, { useEffect, useState } from "react";
import Layout from "../../shared/layout/Layout";

import {
  FiSearch,
  FiFileText,
  FiRefreshCw,
  FiFilter,
  FiEye,
  FiX,
  FiPrinter,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";

import ReporteExpediente from "../../shared/components/ReporteExpediente";

import { useInformes } from "./hooks/useInformes";

import {
  obtenerInformeFinalizacion,
  descargarConstancia,
} from "./hooks/informefinalizado";

const Informes = () => {
  const {
    searchTerm,
    setSearchTerm,
    matrizSeleccionada,
    setMatrizSeleccionada,
    loading,
    error,
    filteredMatrices,
  } = useInformes();

  // =========================================================
  // MODAL
  // =========================================================

  const [documentoModal, setDocumentoModal] =
    useState(null);

  /*
    Valores posibles:

    null
    "planificacion"
    "finalizacion"
    "constancia"
  */

  // =========================================================
  // INFORME DE FINALIZACIÓN
  // =========================================================

  const [informeFinalizacion, setInformeFinalizacion] =
    useState(null);

  const [loadingFinalizacion, setLoadingFinalizacion] =
    useState(false);

  const [errorFinalizacion, setErrorFinalizacion] =
    useState(null);

  // =========================================================
  // CONSTANCIA
  // =========================================================

  const [loadingConstancia, setLoadingConstancia] =
    useState(false);

  const [errorConstancia, setErrorConstancia] =
    useState(null);

  // =========================================================
  // CARGAR INFORME DE FINALIZACIÓN
  // =========================================================

  useEffect(() => {
    const cargarInformeFinalizacion = async () => {
      if (!matrizSeleccionada?.id) {
        setInformeFinalizacion(null);
        setErrorFinalizacion(null);
        return;
      }

      try {
        setLoadingFinalizacion(true);
        setErrorFinalizacion(null);

        const data =
          await obtenerInformeFinalizacion(
            matrizSeleccionada.id
          );

        setInformeFinalizacion(data);
      } catch (err) {
        console.error(
          "Error cargando informe de finalización:",
          err
        );

        setInformeFinalizacion(null);

        if (err?.response?.status === 404) {
          setErrorFinalizacion(
            "Este proyecto todavía no tiene informe de finalización."
          );
        } else {
          setErrorFinalizacion(
            "No se pudo cargar el informe de finalización."
          );
        }
      } finally {
        setLoadingFinalizacion(false);
      }
    };

    cargarInformeFinalizacion();

    // Al cambiar de proyecto se cierra cualquier modal.
    setDocumentoModal(null);
    setErrorConstancia(null);
  }, [matrizSeleccionada?.id]);

  // =========================================================
  // ESTADO INFORME FINALIZACIÓN
  // =========================================================

  const estadoInforme =
    informeFinalizacion?.finalizacion?.estado ||
    informeFinalizacion?.estado ||
    "";

  const informeFinalizacionAprobado =
    estadoInforme === "aprobado";

  const informeFinalizacionEnviado =
    estadoInforme === "enviado";

  const informeFinalizacionObservado =
    estadoInforme === "observado";

  // =========================================================
  // CONSTANCIA
  // =========================================================

  /*
   * Según Sprint 8, la constancia solo puede visualizarse
   * cuando el informe ya fue aprobado y la constancia
   * también está aprobada.
   */

  const constanciaAprobada =
    informeFinalizacion?.constancia_aprobada === true;

  const constanciaDisponible =
    informeFinalizacionAprobado &&
    constanciaAprobada;

  // =========================================================
  // ABRIR MODAL
  // =========================================================

  const abrirDocumento = (tipo) => {
    if (tipo === "planificacion") {
      setDocumentoModal("planificacion");
      return;
    }

    if (
      tipo === "finalizacion" &&
      informeFinalizacionAprobado
    ) {
      setDocumentoModal("finalizacion");
      return;
    }

    if (
      tipo === "constancia" &&
      constanciaDisponible
    ) {
      setDocumentoModal("constancia");
      return;
    }
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const cerrarModal = () => {
    setDocumentoModal(null);
    setErrorConstancia(null);
  };

  // =========================================================
  // CONSTANCIA
  // =========================================================

  const abrirConstancia = async () => {
    if (
      !matrizSeleccionada?.id ||
      !constanciaDisponible
    ) {
      return;
    }

    try {
      setLoadingConstancia(true);
      setErrorConstancia(null);

      const response =
        await descargarConstancia(
          matrizSeleccionada.id
        );

      /*
       * Si el endpoint devuelve un Blob,
       * lo mostramos dentro del modal.
       */

      if (response instanceof Blob) {
        const blobUrl =
          window.URL.createObjectURL(response);

        setDocumentoModal({
          tipo: "constancia",
          url: blobUrl,
        });

        return;
      }

      /*
       * Si devuelve una URL.
       */

      if (typeof response === "string") {
        setDocumentoModal({
          tipo: "constancia",
          url: response,
        });

        return;
      }

      if (response?.url) {
        setDocumentoModal({
          tipo: "constancia",
          url: response.url,
        });

        return;
      }

      setErrorConstancia(
        "No se pudo obtener el documento de la constancia."
      );
    } catch (err) {
      console.error(
        "Error cargando constancia:",
        err
      );

      setErrorConstancia(
        "No se pudo cargar la constancia."
      );
    } finally {
      setLoadingConstancia(false);
    }
  };

  // =========================================================
  // CLICK OJITO CONSTANCIA
  // =========================================================

  const handleVerConstancia = async () => {
    if (!constanciaDisponible) {
      return;
    }

    setDocumentoModal("constancia");
    await abrirConstancia();
  };

  // =========================================================
  // DATOS DEL PROYECTO
  // =========================================================

  const codigo =
    matrizSeleccionada?.codigo ||
    `PRY-${matrizSeleccionada?.id || ""}`;

  const titulo =
    matrizSeleccionada?.titulo ||
    "Proyecto";

  const periodo =
    matrizSeleccionada?.semestre_academico ||
    matrizSeleccionada?.periodo_nombre ||
    matrizSeleccionada?.periodo ||
    "S/A";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

        {/* =====================================================
            ENCABEZADO
        ====================================================== */}

        <div className="mb-6 flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold text-slate-800 m-0">
              Informes Completos de Ejecución
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Expediente oficial consolidado del Proyecto de Responsabilidad Social
            </p>

          </div>

        </div>

        {/* =====================================================
            CONTENIDO PRINCIPAL
        ====================================================== */}

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* ===================================================
              PANEL IZQUIERDO
          ==================================================== */}

          <div className="xl:col-span-4 flex flex-col gap-4 w-full">

            {/* BUSCADOR */}

            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">

                <FiFilter />

                Búsqueda de Expedientes

              </div>

              <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">

                <FiSearch className="text-slate-400 shrink-0" />

                <input
                  type="text"
                  placeholder="Buscar por título o código..."
                  className="w-full text-xs outline-none bg-transparent text-slate-700"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />

              </div>

            </div>

            {/* LISTADO DE PROYECTOS */}

            <div className="flex flex-col gap-3">

              {loading ? (

                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex flex-col items-center gap-2">

                  <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />

                  <span>
                    Leyendo expedientes en la base de datos...
                  </span>

                </div>

              ) : error ? (

                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">

                  {error}

                </div>

              ) : !Array.isArray(
                  filteredMatrices
                ) ||
                filteredMatrices.length === 0 ? (

                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2 italic">

                  No se encontraron expedientes con ese filtro.

                </div>

              ) : (

                filteredMatrices.map(
                  (matriz) => (

                    <div
                      key={matriz.id}
                      onClick={() =>
                        setMatrizSeleccionada(
                          matriz
                        )
                      }
                      className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        matrizSeleccionada?.id ===
                        matriz.id
                          ? "border-[#b1122b] ring-2 ring-[#b1122b]/5 shadow-md"
                          : "border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >

                      <div>

                        <div className="flex items-center justify-between">

                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">

                            {matriz.codigo ||
                              `ID-BACK: #${matriz.id}`}

                          </span>

                          <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase">

                            {matriz.estado ||
                              "activo"}

                          </span>

                        </div>

                        <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">

                          {matriz.titulo}

                        </h3>

                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">

                        <span>
                          Semestre:{" "}

                          <b className="text-slate-600">
                            {matriz.semestre_academico ||
                              matriz.periodo_nombre ||
                              "S/A"}
                          </b>
                        </span>

                        <span
                          className={`${
                            matrizSeleccionada?.id ===
                            matriz.id
                              ? "text-[#b1122b]"
                              : "text-slate-400"
                          } font-semibold text-[10px]`}
                        >
                          Seleccionar →
                        </span>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

          {/* ===================================================
              PANEL DERECHO
          ==================================================== */}

          <div className="xl:col-span-8 w-full">

            {!matrizSeleccionada ? (

              <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs">

                <FiFileText className="w-12 h-12 text-slate-300 mb-2" />

                <span className="font-semibold text-slate-500">
                  Selecciona un proyecto para visualizar sus documentos
                </span>

              </div>

            ) : (

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                {/* CABECERA */}

                <div className="p-5 border-b border-slate-100">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {codigo}
                      </span>

                      <h2 className="text-lg font-bold text-slate-800 mt-1">
                        {titulo}
                      </h2>

                      <p className="text-xs text-slate-400 mt-1">
                        Datos vinculados al usuario autenticado · Semestre{" "}
                        {periodo}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        window.print()
                      }
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >

                      <FiPrinter />

                      Imprimir expediente

                    </button>

                  </div>

                </div>

                {/* =================================================
                    DOCUMENTOS
                ================================================== */}

                <div className="p-5 bg-slate-50">

                  {/* ===============================================
                      PLANIFICACIÓN
                  ================================================ */}

                  <DocumentoCard
                    icon={<FiFileText />}
                    titulo="Informe de planificación"
                    descripcion="Proyecto RSU aprobado"
                    estado="Aprobado"
                    disponible={true}
                    onView={() =>
                      abrirDocumento(
                        "planificacion"
                      )
                    }
                  />

                  {/* ===============================================
                      FINALIZACIÓN
                  ================================================ */}

                  <DocumentoCard
                    icon={<FiFileText />}
                    titulo="Informe de finalización"
                    descripcion={
                      loadingFinalizacion
                        ? "Cargando información..."
                        : "Informe de ejecución y cierre del proyecto"
                    }
                    estado={
                      loadingFinalizacion
                        ? "Cargando"
                        : informeFinalizacionAprobado
                        ? "Aprobado"
                        : informeFinalizacionEnviado
                        ? "En revisión"
                        : informeFinalizacionObservado
                        ? "Observado"
                        : "Pendiente"
                    }
                    disponible={
                      informeFinalizacionAprobado
                    }
                    loading={
                      loadingFinalizacion
                    }
                    onView={() =>
                      abrirDocumento(
                        "finalizacion"
                      )
                    }
                  />

                  {/* ===============================================
                      CONSTANCIA
                  ================================================ */}

                  <DocumentoCard
                    icon={<FiAward />}
                    titulo="Constancia de ejecución"
                    descripcion="Emitida después de aprobar el informe de finalización"
                    estado={
                      constanciaDisponible
                        ? "Disponible"
                        : "Pendiente"
                    }
                    disponible={
                      constanciaDisponible
                    }
                    loading={
                      loadingConstancia
                    }
                    onView={
                      handleVerConstancia
                    }
                    ultimo
                  />

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* =========================================================
          MODAL
      ========================================================= */}

      {documentoModal && (
        <ModalDocumento
          tipo={documentoModal}
          proyecto={matrizSeleccionada}
          informeFinalizacion={
            informeFinalizacion
          }
          loadingConstancia={
            loadingConstancia
          }
          errorConstancia={
            errorConstancia
          }
          cerrar={cerrarModal}
        />
      )}

    </Layout>
  );
};

// =============================================================
// TARJETA DOCUMENTO
// =============================================================

const DocumentoCard = ({
  icon,
  titulo,
  descripcion,
  estado,
  disponible,
  loading,
  onView,
  ultimo = false,
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl ${
        ultimo ? "" : "mb-3"
      }`}
    >

      <div className="min-h-[82px] px-5 py-4 flex items-center gap-4">

        {/* ICONO */}

        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            disponible
              ? "bg-[#f5e9eb] text-[#6f1825]"
              : "bg-slate-50 text-slate-300"
          }`}
        >
          {icon}
        </div>

        {/* INFORMACIÓN */}

        <div className="flex-1 min-w-0">

          <div className="flex items-center gap-2 flex-wrap">

            <h3 className="text-sm font-bold text-slate-700">
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

          <p className="text-xs text-slate-400 mt-1">
            {descripcion}
          </p>

        </div>

        {/* =====================================================
            OJITO
        ====================================================== */}

        <button
          type="button"
          disabled={
            !disponible || loading
          }
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
};

// =============================================================
// MODAL DOCUMENTO
// =============================================================

const ModalDocumento = ({
  tipo,
  proyecto,
  informeFinalizacion,
  loadingConstancia,
  errorConstancia,
  cerrar,
}) => {

  const titulo =
    tipo === "planificacion"
      ? "Informe de planificación"
      : tipo === "finalizacion"
      ? "Informe de finalización"
      : "Constancia de ejecución";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          cerrar();
        }
      }}
    >

      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">

        {/* =====================================================
            CABECERA MODAL
        ====================================================== */}

        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">

          <div>

            <div className="flex items-center gap-2">

              <FiFileText className="text-[#b1122b]" />

              <h2 className="text-sm font-bold text-slate-800">
                {titulo}
              </h2>

            </div>

            <p className="text-[10px] text-slate-400 mt-1">

              {proyecto?.codigo || "—"} ·{" "}
              {proyecto?.titulo || "Proyecto"}

            </p>

          </div>

          <button
            type="button"
            onClick={cerrar}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#b1122b] hover:bg-slate-50"
          >

            <FiX className="text-lg" />

          </button>

        </div>

        {/* =====================================================
            CONTENIDO MODAL
        ====================================================== */}

        <div className="flex-1 overflow-y-auto bg-slate-100">

          {/* ================================================
              INFORME PLANIFICACIÓN
          ================================================= */}

          {tipo === "planificacion" && (

            <div className="p-5">

              <ReporteExpediente
                matrizSeleccionada={
                  proyecto
                }
                showPrintButton={
                  true
                }
              />

            </div>

          )}

          {/* ================================================
              INFORME FINALIZACIÓN
          ================================================= */}

          {tipo === "finalizacion" && (

            <DocumentoFinalizacion
              informe={
                informeFinalizacion
              }
              proyecto={proyecto}
            />

          )}

          {/* ================================================
              CONSTANCIA
          ================================================= */}

          {tipo === "constancia" && (

            <div className="min-h-[500px] flex flex-col items-center justify-center p-8">

              {loadingConstancia ? (

                <>
                  <FiRefreshCw className="text-3xl text-[#b1122b] animate-spin" />

                  <p className="text-sm font-semibold text-slate-600 mt-4">
                    Cargando constancia...
                  </p>
                </>

              ) : errorConstancia ? (

                <>
                  <FiAlertCircle className="text-3xl text-red-400" />

                  <p className="text-sm font-semibold text-red-600 mt-3">
                    {errorConstancia}
                  </p>
                </>

              ) : (

                <>
                  <FiAward className="text-4xl text-[#b1122b]" />

                  <p className="text-sm font-bold text-slate-700 mt-4">
                    Constancia de ejecución
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Documento oficial del proyecto
                  </p>

                </>

              )}

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

// =============================================================
// DOCUMENTO FINALIZACIÓN - SOLO LECTURA
// =============================================================

const DocumentoFinalizacion = ({
  informe,
  proyecto,
}) => {

  if (!informe) {
    return (
      <div className="p-10 text-center">

        <FiAlertCircle className="mx-auto text-3xl text-slate-300" />

        <p className="text-xs text-slate-500 mt-3">
          No existe información del informe.
        </p>

      </div>
    );
  }

  const datosProyecto =
    informe?.datos_proyecto || {};

  const textos =
    informe?.textos || {};

  const docentes =
    Array.isArray(
      informe?.docentes_participantes
    )
      ? informe.docentes_participantes
      : [];

  const actividades =
    Array.isArray(
      informe?.actividades
    )
      ? informe.actividades
      : [];

  const metas =
    Array.isArray(
      informe?.metas_indicadores
    )
      ? informe.metas_indicadores
      : [];

  const partidas =
    Array.isArray(
      informe?.partidas_presupuesto
    )
      ? informe.partidas_presupuesto
      : [];

  return (
    <div className="bg-white max-w-5xl mx-auto p-8 md:p-12">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <div className="text-center border-b-2 border-slate-800 pb-5 mb-7">

        <p className="text-[10px] font-bold uppercase">
          UNIVERSIDAD NACIONAL DE SAN AGUSTÍN
        </p>

        <p className="text-[9px] text-slate-500 mt-1">
          RESPONSABILIDAD SOCIAL UNIVERSITARIA
        </p>

        <h1 className="text-lg font-bold uppercase mt-5">
          INFORME DE FINALIZACIÓN
        </h1>

        <p className="text-xs text-slate-500 mt-2">
          Expediente oficial del proyecto RSU
        </p>

      </div>

      {/* =====================================================
          1. DATOS GENERALES
      ====================================================== */}

      <SeccionDocumento titulo="1. DATOS GENERALES">

        <TablaDocumento
          filas={[
            [
              "Título del proyecto",
              informe?.titulo ||
                proyecto?.titulo ||
                "—",
            ],
            [
              "Código de registro",
              informe?.codigo ||
                proyecto?.codigo ||
                "—",
            ],
            [
              "Periodo",
              datosProyecto?.periodo ||
                proyecto?.periodo ||
                proyecto?.periodo_nombre ||
                "—",
            ],
            [
              "Fecha de inicio",
              datosProyecto?.fecha_inicio ||
                "—",
            ],
            [
              "Fecha de término",
              datosProyecto?.fecha_termino ||
                "—",
            ],
            [
              "Lugar de ejecución",
              datosProyecto?.lugar_ejecucion ||
                "—",
            ],
            [
              "Número de beneficiarios",
              datosProyecto?.nro_beneficiarios ??
                "—",
            ],
            [
              "Eje RSU",
              datosProyecto?.eje_rsu ||
                "—",
            ],
            [
              "Porcentaje de ejecución",
              informe?.porcentaje_ejecucion != null
                ? `${informe.porcentaje_ejecucion}%`
                : "—",
            ],
          ]}
        />

      </SeccionDocumento>

      {/* =====================================================
          2. DOCENTES
      ====================================================== */}

      <SeccionDocumento titulo="2. DOCENTES PARTICIPANTES">

        {docentes.length > 0 ? (

          <div className="border border-slate-300">

            {docentes.map(
              (docente, index) => (

                <div
                  key={index}
                  className="px-4 py-3 border-b border-slate-200 last:border-b-0 text-xs"
                >
                  {docente}
                </div>

              )
            )}

          </div>

        ) : (

          <VacioDocumento />

        )}

      </SeccionDocumento>

      {/* =====================================================
          3. ACTIVIDADES
      ====================================================== */}

      <SeccionDocumento titulo="3. ACTIVIDADES Y AVANCES">

        {actividades.length > 0 ? (

          <div className="border border-slate-300">

            {actividades.map(
              (actividad, index) => {

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
                    className="p-4 border-b border-slate-200 last:border-b-0"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-xs font-bold text-slate-800">
                          {actividad?.nombre ||
                            "Actividad"}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-1">
                          Estado:{" "}
                          {actividad?.estado ||
                            "—"}
                        </p>

                      </div>

                      {actividad?.estado ===
                        "completada" && (

                        <FiCheckCircle className="text-emerald-500" />

                      )}

                    </div>

                    {avances.length > 0 && (

                      <div className="mt-3 space-y-2">

                        {avances.map(
                          (avance) => (

                            <div
                              key={
                                avance?.id
                              }
                              className="bg-slate-50 border border-slate-200 p-3"
                            >

                              <p className="text-[10px] text-slate-700">
                                {avance?.descripcion ||
                                  "Sin descripción"}
                              </p>

                              {avance?.fecha_registro && (

                                <p className="text-[9px] text-slate-400 mt-1">
                                  Fecha:{" "}
                                  {
                                    avance.fecha_registro
                                  }
                                </p>

                              )}

                              {Array.isArray(
                                avance?.evidencias
                              ) &&
                                avance.evidencias.length >
                                  0 && (

                                  <p className="text-[9px] text-slate-400 mt-1">

                                    Evidencias:{" "}
                                    {
                                      avance
                                        .evidencias
                                        .length
                                    }

                                  </p>

                                )}

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

        ) : (

          <VacioDocumento />

        )}

      </SeccionDocumento>

      {/* =====================================================
          4. METAS
      ====================================================== */}

      <SeccionDocumento titulo="4. METAS E INDICADORES">

        {metas.length > 0 ? (

          <div className="overflow-x-auto">

            <table className="w-full border-collapse border border-slate-300">

              <thead>

                <tr className="bg-slate-100">

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Descripción
                  </th>

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Línea base
                  </th>

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Valor meta
                  </th>

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Alcanzado
                  </th>

                </tr>

              </thead>

              <tbody>

                {metas.map(
                  (meta, index) => (

                    <tr
                      key={
                        meta?.id ||
                        index
                      }
                    >

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        {meta?.descripcion ||
                          "—"}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        {meta?.linea_base ??
                          "—"}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        {meta?.valor_meta ??
                          "—"}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        {meta?.valor_alcanzado ??
                          "—"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <VacioDocumento />

        )}

      </SeccionDocumento>

      {/* =====================================================
          5. PRESUPUESTO
      ====================================================== */}

      <SeccionDocumento titulo="5. EJECUCIÓN PRESUPUESTAL">

        {partidas.length > 0 ? (

          <div className="overflow-x-auto">

            <table className="w-full border-collapse border border-slate-300">

              <thead>

                <tr className="bg-slate-100">

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Partida
                  </th>

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Presupuestado
                  </th>

                  <th className="border border-slate-300 px-3 py-2 text-left text-[9px]">
                    Ejecutado
                  </th>

                </tr>

              </thead>

              <tbody>

                {partidas.map(
                  (partida, index) => (

                    <tr
                      key={
                        partida?.id ||
                        index
                      }
                    >

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        {partida?.partida ||
                          "—"}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        S/{" "}
                        {partida?.monto ??
                          "0.00"}
                      </td>

                      <td className="border border-slate-300 px-3 py-2 text-[10px]">
                        S/{" "}
                        {partida?.monto_ejecutado ??
                          "0.00"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <VacioDocumento />

        )}

      </SeccionDocumento>

      {/* =====================================================
          6. CONCLUSIONES
      ====================================================== */}

      <SeccionDocumento titulo="6. CONCLUSIONES">

        <TextoDocumento
          texto={textos?.conclusiones}
        />

      </SeccionDocumento>

      {/* =====================================================
          7. RECOMENDACIONES
      ====================================================== */}

      <SeccionDocumento titulo="7. RECOMENDACIONES">

        <TextoDocumento
          texto={textos?.recomendaciones}
        />

      </SeccionDocumento>

      {/* =====================================================
          8. LECCIONES
      ====================================================== */}

      <SeccionDocumento titulo="8. LECCIONES APRENDIDAS">

        <TextoDocumento
          texto={
            textos?.lecciones_aprendidas
          }
        />

      </SeccionDocumento>

      {/* =====================================================
          9. MEDIO DE DIFUSIÓN
      ====================================================== */}

      <SeccionDocumento titulo="9. MEDIO DE DIFUSIÓN">

        <TextoDocumento
          texto={
            textos?.medio_difusion
          }
        />

      </SeccionDocumento>

    </div>
  );
};

// =============================================================
// SECCIÓN DOCUMENTO
// =============================================================

const SeccionDocumento = ({
  titulo,
  children,
}) => {
  return (
    <section className="mb-7">

      <div className="bg-slate-800 text-white px-4 py-2 mb-3">

        <h2 className="text-[10px] font-bold uppercase tracking-wide">
          {titulo}
        </h2>

      </div>

      {children}

    </section>
  );
};

// =============================================================
// TABLA DOCUMENTO
// =============================================================

const TablaDocumento = ({
  filas = [],
}) => {
  return (
    <div className="border border-slate-300">

      {Array.isArray(filas) &&
        filas.map(
          ([label, value], index) => (

            <div
              key={index}
              className="grid grid-cols-[180px_1fr] border-b border-slate-300 last:border-b-0"
            >

              <div className="bg-slate-50 border-r border-slate-300 px-3 py-2">

                <p className="text-[9px] font-bold text-slate-700">
                  {label}
                </p>

              </div>

              <div className="px-3 py-2">

                <p className="text-[10px] text-slate-700 whitespace-pre-wrap">
                  {value ?? "—"}
                </p>

              </div>

            </div>

          )
        )}

    </div>
  );
};

// =============================================================
// TEXTO DOCUMENTO
// =============================================================

const TextoDocumento = ({
  texto,
}) => {

  if (
    !texto ||
    String(texto).trim() === ""
  ) {
    return <VacioDocumento />;
  }

  return (
    <div className="border border-slate-300 p-4">

      <p className="text-[10px] leading-relaxed whitespace-pre-wrap">
        {texto}
      </p>

    </div>
  );
};

// =============================================================
// VACÍO
// =============================================================

const VacioDocumento = () => {
  return (
    <div className="border border-slate-300 bg-slate-50 p-4">

      <p className="text-[10px] text-slate-400 italic">
        No hay información registrada.
      </p>

    </div>
  );
};

export default Informes;