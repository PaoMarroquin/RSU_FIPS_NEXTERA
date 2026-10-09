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
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";

import ReporteExpediente from "../../shared/components/ReporteExpediente";
import { useInformes } from "./hooks/useInformes";
import { finalizacionApi } from "./hooks/informefinalizado";

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

  const [documentoModal, setDocumentoModal] = useState(null);

  const [informeFinalizacion, setInformeFinalizacion] = useState(null);
  const [loadingFinalizacion, setLoadingFinalizacion] = useState(false);
  const [errorFinalizacion, setErrorFinalizacion] = useState(null);

  const [loadingDocumento, setLoadingDocumento] = useState(false);
  const [errorDocumento, setErrorDocumento] = useState(null);
  const [urlDocumento, setUrlDocumento] = useState(null);

  // Cargar información del informe de finalización
  useEffect(() => {
    let cancelado = false;

    const cargarInforme = async () => {
      if (!matrizSeleccionada?.id) {
        setInformeFinalizacion(null);
        setErrorFinalizacion(null);
        return;
      }

      setLoadingFinalizacion(true);
      setErrorFinalizacion(null);
      setInformeFinalizacion(null);

      try {
        const data = await finalizacionApi.obtenerInforme(
          matrizSeleccionada.id
        );

        if (!cancelado) {
          setInformeFinalizacion(data);
        }
      } catch (err) {
        console.error("Error cargando informe de finalización:", err);

        if (!cancelado) {
          setErrorFinalizacion(
            err?.response?.status === 404
              ? "El proyecto todavía no tiene un informe de finalización."
              : "No se pudo cargar el informe de finalización."
          );
        }
      } finally {
        if (!cancelado) {
          setLoadingFinalizacion(false);
        }
      }
    };

    setDocumentoModal(null);
    setErrorDocumento(null);
    cargarInforme();

    return () => {
      cancelado = true;
    };
  }, [matrizSeleccionada?.id]);

  // Liberar la URL temporal del PDF
  useEffect(() => {
    return () => {
      if (urlDocumento) {
        window.URL.revokeObjectURL(urlDocumento);
      }
    };
  }, [urlDocumento]);

  // Estados del informe
  const estadoInforme =
    informeFinalizacion?.finalizacion?.estado ||
    informeFinalizacion?.estado ||
    "";

  const informeAprobado = estadoInforme === "aprobado";
  const informeEnviado = estadoInforme === "enviado";
  const informeObservado = estadoInforme === "observado";

  const constanciaAprobada =
    informeFinalizacion?.constancia_aprobada === true;

  const constanciaDisponible =
    informeAprobado && constanciaAprobada;

  // Abrir informe PDF o constancia
  const abrirPDF = async (tipo) => {
    if (!matrizSeleccionada?.id) return;

    if (tipo === "constancia" && !constanciaDisponible) return;
    if (tipo === "finalizacion" && !informeAprobado) return;

    setDocumentoModal(tipo);
    setLoadingDocumento(true);
    setErrorDocumento(null);
    setUrlDocumento(null);

    try {
      const blob =
        tipo === "constancia"
          ? await finalizacionApi.obtenerConstanciaPdf(
              matrizSeleccionada.id
            )
          : await finalizacionApi.obtenerInformePdf(
              matrizSeleccionada.id
            );

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("El servidor no devolvió un PDF válido.");
      }

      const nuevaUrl = window.URL.createObjectURL(blob);
      setUrlDocumento(nuevaUrl);
    } catch (err) {
      console.error("Error cargando PDF:", err);

      setErrorDocumento(
        err?.response?.status === 403
          ? "No tienes permisos para visualizar este documento."
          : err?.response?.status === 404
          ? "El PDF todavía no está disponible en el servidor."
          : "No se pudo cargar el documento. Inténtalo nuevamente."
      );
    } finally {
      setLoadingDocumento(false);
    }
  };

  const cerrarModal = () => {
    setDocumentoModal(null);
    setErrorDocumento(null);
    setUrlDocumento(null);
  };

  const descargarPDF = () => {
    if (!urlDocumento) return;

    const enlace = document.createElement("a");
    enlace.href = urlDocumento;
    enlace.download =
      documentoModal === "constancia"
        ? `Constancia-${matrizSeleccionada?.codigo || matrizSeleccionada?.id}.pdf`
        : `Informe-finalizacion-${matrizSeleccionada?.codigo || matrizSeleccionada?.id}.pdf`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  };

  const codigo =
    matrizSeleccionada?.codigo ||
    `PRY-${matrizSeleccionada?.id || ""}`;

  const titulo = matrizSeleccionada?.titulo || "Proyecto";

  const periodo =
    matrizSeleccionada?.semestre_academico ||
    matrizSeleccionada?.periodo_nombre ||
    matrizSeleccionada?.periodo ||
    "S/A";

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        {/* ENCABEZADO */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Informes Completos de Ejecución
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Expediente oficial consolidado del Proyecto de
            Responsabilidad Social
          </p>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LISTA DE PROYECTOS */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                <FiFilter />
                Búsqueda de expedientes
              </div>

              <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b]">
                <FiSearch className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por título o código..."
                  className="w-full text-xs outline-none bg-transparent text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                <EstadoPanel>
                  <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />
                  Cargando expedientes...
                </EstadoPanel>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              ) : !Array.isArray(filteredMatrices) ||
                filteredMatrices.length === 0 ? (
                <EstadoPanel>
                  No se encontraron expedientes.
                </EstadoPanel>
              ) : (
                filteredMatrices.map((matriz) => (
                  <button
                    type="button"
                    key={matriz.id}
                    onClick={() => setMatrizSeleccionada(matriz)}
                    className={`text-left p-4 bg-white rounded-xl border transition-all ${
                      matrizSeleccionada?.id === matriz.id
                        ? "border-[#b1122b] ring-2 ring-[#b1122b]/5 shadow-md"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {matriz.codigo || `ID: ${matriz.id}`}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-full uppercase">
                        {matriz.estado || "Activo"}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-800 mt-2">
                      {matriz.titulo || "Proyecto sin título"}
                    </h3>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Periodo:{" "}
                        <b className="text-slate-600">
                          {matriz.semestre_academico ||
                            matriz.periodo_nombre ||
                            "S/A"}
                        </b>
                      </span>
                      <span className="font-semibold">
                        Seleccionar →
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* DETALLE DEL PROYECTO */}
          <div className="xl:col-span-8 w-full">
            {!matrizSeleccionada ? (
              <div className="w-full min-h-[450px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs">
                <FiFileText className="w-12 h-12 text-slate-300 mb-3" />
                <span className="font-semibold text-slate-500">
                  Selecciona un proyecto para visualizar sus documentos
                </span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {codigo}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 mt-1">
                      {titulo}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Expediente del proyecto · Periodo {periodo}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300"
                  >
                    <FiPrinter />
                    Imprimir
                  </button>
                </div>

                <div className="p-5 bg-slate-50">
                  <DocumentoCard
                    icon={<FiFileText />}
                    titulo="Informe de planificación"
                    descripcion="Expediente del proyecto RSU"
                    estado="Disponible"
                    disponible
                    onView={() => setDocumentoModal("planificacion")}
                  />

                  <DocumentoCard
                    icon={<FiFileText />}
                    titulo="Informe de finalización"
                    descripcion={
                      loadingFinalizacion
                        ? "Cargando informe..."
                        : errorFinalizacion ||
                          "Informe de ejecución y cierre del proyecto"
                    }
                    estado={
                      loadingFinalizacion
                        ? "Cargando"
                        : informeAprobado
                        ? "Aprobado"
                        : informeEnviado
                        ? "En revisión"
                        : informeObservado
                        ? "Observado"
                        : "Pendiente"
                    }
                    disponible={informeAprobado}
                    loading={loadingFinalizacion}
                    onView={() => abrirPDF("finalizacion")}
                  />

                  <DocumentoCard
                    icon={<FiAward />}
                    titulo="Constancia de ejecución"
                    descripcion="Constancia oficial del proyecto finalizado"
                    estado={
                      constanciaDisponible ? "Disponible" : "Pendiente"
                    }
                    disponible={constanciaDisponible}
                    onView={() => abrirPDF("constancia")}
                    ultimo
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DOCUMENTOS */}
      {documentoModal && (
        <ModalDocumento
          tipo={documentoModal}
          proyecto={matrizSeleccionada}
          loading={loadingDocumento}
          error={errorDocumento}
          urlDocumento={urlDocumento}
          descargar={descargarPDF}
          cerrar={cerrarModal}
        />
      )}
    </Layout>
  );
};

// COMPONENTE: ESTADO VACÍO
const EstadoPanel = ({ children }) => (
  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2">
    {children}
  </div>
);

// COMPONENTE: TARJETA DE DOCUMENTO
const DocumentoCard = ({
  icon,
  titulo,
  descripcion,
  estado,
  disponible,
  loading = false,
  onView,
  ultimo = false,
}) => (
  <div
    className={`bg-white border border-slate-200 rounded-xl ${
      ultimo ? "" : "mb-3"
    }`}
  >
    <div className="min-h-[82px] px-5 py-4 flex items-center gap-4">
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
        <p className="text-xs text-slate-400 mt-1">{descripcion}</p>
      </div>

      <button
        type="button"
        disabled={!disponible || loading}
        onClick={onView}
        title={disponible ? "Ver documento" : "Documento no disponible"}
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
          disponible
            ? "border-slate-200 text-slate-500 hover:text-[#b1122b] hover:border-[#b1122b]"
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

// COMPONENTE: MODAL
const ModalDocumento = ({
  tipo,
  proyecto,
  loading,
  error,
  urlDocumento,
  descargar,
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
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-[#b1122b]" />
              <h2 className="text-sm font-bold text-slate-800">
                {titulo}
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {proyecto?.codigo || `Proyecto ${proyecto?.id || ""}`} ·{" "}
              {proyecto?.titulo || ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {tipo !== "planificacion" && urlDocumento && (
              <button
                type="button"
                onClick={descargar}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#b1122b] text-white text-xs font-semibold hover:bg-[#8f0e22]"
              >
                <FiDownload />
                Descargar PDF
              </button>
            )}

            <button
              type="button"
              onClick={cerrar}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#b1122b] hover:bg-slate-50"
              aria-label="Cerrar documento"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[65vh] overflow-auto bg-slate-100">
          {tipo === "planificacion" ? (
            <div className="p-5">
              <ReporteExpediente
                matrizSeleccionada={proyecto}
                showPrintButton
              />
            </div>
          ) : loading ? (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
              <FiRefreshCw className="animate-spin text-3xl text-[#b1122b]" />
              <p className="text-sm">Cargando documento PDF...</p>
            </div>
          ) : error ? (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-3 p-6">
              <FiAlertCircle className="text-4xl text-red-500" />
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          ) : urlDocumento ? (
            <iframe
              src={urlDocumento}
              title={titulo}
              className="w-full h-[75vh] border-0 bg-white"
            />
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
              <FiFileText className="text-4xl" />
              <p className="text-sm">No hay un documento para mostrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Informes;
