import React, { useEffect, useState } from "react";
import Layout from "../../shared/layout/Layout";

import {
  FiSearch,
  FiFileText,
  FiRefreshCw,
  FiFilter,
  FiPrinter,
  FiArrowLeft,
  FiAward
} from "react-icons/fi";

import { useInformes } from "./hooks/useInformes";
import {
  obtenerInformeFinalizacion,
  descargarConstancia,
} from "./hooks/informefinalizado";

// Importamos la UI corregida
import { DocumentoCard, ModalDocumento } from "./components/ExpedienteUI";

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
  const [loadingConstancia, setLoadingConstancia] = useState(false);
  const [errorConstancia, setErrorConstancia] = useState(null);

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
        const data = await obtenerInformeFinalizacion(matrizSeleccionada.id);
        setInformeFinalizacion(data);
      } catch (err) {
        console.error("Error cargando informe de finalización:", err);
        setInformeFinalizacion(null);
        if (err?.response?.status === 404) {
          setErrorFinalizacion("Este proyecto todavía no tiene informe de finalización.");
        } else {
          setErrorFinalizacion("No se pudo cargar el informe de finalización.");
        }
      } finally {
        setLoadingFinalizacion(false);
      }
    };
    cargarInformeFinalizacion();
    setDocumentoModal(null);
    setErrorConstancia(null);
  }, [matrizSeleccionada?.id]);

  const estadoInforme = informeFinalizacion?.finalizacion?.estado || informeFinalizacion?.estado || "";
  const informeFinalizacionAprobado = estadoInforme === "aprobado";
  const informeFinalizacionEnviado = estadoInforme === "enviado";
  const informeFinalizacionObservado = estadoInforme === "observado";

  const constanciaAprobada = informeFinalizacion?.constancia_aprobada === true;
  const constanciaDisponible = informeFinalizacionAprobado && constanciaAprobada;

  const abrirDocumento = (tipo) => {
    if (tipo === "planificacion") { setDocumentoModal("planificacion"); return; }
    if (tipo === "finalizacion" && informeFinalizacionAprobado) { setDocumentoModal("finalizacion"); return; }
    if (tipo === "constancia" && constanciaDisponible) { setDocumentoModal("constancia"); return; }
  };

  const cerrarModal = () => {
    setDocumentoModal(null);
    setErrorConstancia(null);
  };

  const abrirConstancia = async () => {
    if (!matrizSeleccionada?.id || !constanciaDisponible) return;
    try {
      setLoadingConstancia(true);
      setErrorConstancia(null);
      const response = await descargarConstancia(matrizSeleccionada.id);
      if (response instanceof Blob) {
        setDocumentoModal({ tipo: "constancia", url: window.URL.createObjectURL(response) });
        return;
      }
      if (typeof response === "string") {
        setDocumentoModal({ tipo: "constancia", url: response });
        return;
      }
      if (response?.url) {
        setDocumentoModal({ tipo: "constancia", url: response.url });
        return;
      }
      setErrorConstancia("No se pudo obtener el documento de la constancia.");
    } catch (err) {
      console.error("Error cargando constancia:", err);
      setErrorConstancia("No se pudo cargar la constancia.");
    } finally {
      setLoadingConstancia(false);
    }
  };

  const handleVerConstancia = async () => {
    if (!constanciaDisponible) return;
    setDocumentoModal("constancia");
    await abrirConstancia();
  };

  const codigo = matrizSeleccionada?.codigo || `PRY-${matrizSeleccionada?.id || ""}`;
  const titulo = matrizSeleccionada?.titulo || "Proyecto";
  const periodo = matrizSeleccionada?.semestre_academico || matrizSeleccionada?.periodo_nombre || matrizSeleccionada?.periodo || "S/A";

  return (
    <Layout>
      <div className="p-4 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden">

        {/* ENCABEZADO */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 m-0">Informes Completos de Ejecución</h2>
            <p className="text-sm text-slate-500 mt-1">Expediente oficial consolidado del Proyecto de Responsabilidad Social</p>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL CON LOGICA RESPONSIVA MAESTRO-DETALLE */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* PANEL IZQUIERDO: LISTA (Se oculta en movil si hay un proyecto seleccionado) */}
          <div className={`${matrizSeleccionada ? 'hidden xl:flex' : 'flex'} xl:col-span-4 flex-col gap-4 w-full`}>
            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FiFilter /> Búsqueda de Expedientes
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
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
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <FiRefreshCw className="animate-spin text-lg text-[#b1122b]" />
                  <span>Leyendo expedientes en la base de datos...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              ) : !Array.isArray(filteredMatrices) || filteredMatrices.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-2 italic">
                  No se encontraron expedientes con ese filtro.
                </div>
              ) : (
                filteredMatrices.map((matriz) => (
                  <div
                    key={matriz.id}
                    onClick={() => setMatrizSeleccionada(matriz)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${matrizSeleccionada?.id === matriz.id
                        ? "border-[#b1122b] ring-2 ring-[#b1122b]/5 shadow-md"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {matriz.codigo || `ID-BACK: #${matriz.id}`}
                        </span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                          {matriz.estado || "activo"}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-2">
                        {matriz.titulo}
                      </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Semestre: <b className="text-slate-600">{matriz.semestre_academico || matriz.periodo_nombre || "S/A"}</b></span>
                      <span className={`${matrizSeleccionada?.id === matriz.id ? "text-[#b1122b]" : "text-slate-400"} font-semibold text-[10px]`}>
                        Seleccionar →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANEL DERECHO: DETALLES (Se oculta en movil si NO hay proyecto seleccionado) */}
          <div className={`${!matrizSeleccionada ? 'hidden xl:block' : 'block'} xl:col-span-8 w-full`}>

            {/* BOTON VOLVER PARA PANTALLAS PEQUENAS */}
            {matrizSeleccionada && (
              <button
                onClick={() => setMatrizSeleccionada(null)}
                className="xl:hidden flex items-center gap-2 mb-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors w-fit"
              >
                <FiArrowLeft className="text-[#b1122b]" /> Volver a expedientes
              </button>
            )}

            {!matrizSeleccionada ? (
              <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs text-center">
                <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-500">Selecciona un proyecto para visualizar sus documentos</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{codigo}</span>
                      <h2 className="text-lg font-bold text-slate-800 mt-1">{titulo}</h2>
                      <p className="text-xs text-slate-400 mt-1">Datos vinculados al usuario autenticado · Semestre {periodo}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 w-full sm:w-auto"
                    >
                      <FiPrinter /> Imprimir expediente
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50">
                  <DocumentoCard
                    icon={<FiFileText className="text-xl" />} titulo="Informe de planificación" descripcion="Proyecto RSU aprobado" estado="Aprobado" disponible={true} onView={() => abrirDocumento("planificacion")}
                  />
                  <DocumentoCard
                    icon={<FiFileText className="text-xl" />} titulo="Informe de finalización" descripcion={loadingFinalizacion ? "Cargando información..." : "Informe de ejecución y cierre del proyecto"} estado={loadingFinalizacion ? "Cargando" : informeFinalizacionAprobado ? "Aprobado" : informeFinalizacionEnviado ? "En revisión" : informeFinalizacionObservado ? "Observado" : "Pendiente"} disponible={informeFinalizacionAprobado} loading={loadingFinalizacion} onView={() => abrirDocumento("finalizacion")}
                  />
                  <DocumentoCard
                    icon={<FiAward className="text-xl" />} titulo="Constancia de ejecución" descripcion="Emitida después de aprobar el informe de finalización" estado={constanciaDisponible ? "Disponible" : "Pendiente"} disponible={constanciaDisponible} loading={loadingConstancia} onView={handleVerConstancia}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {documentoModal && (
        <ModalDocumento
          tipo={documentoModal}
          proyecto={matrizSeleccionada}
          informeFinalizacion={informeFinalizacion}
          loadingConstancia={loadingConstancia}
          errorConstancia={errorConstancia}
          cerrar={cerrarModal}
        />
      )}
    </Layout>
  );
};

export default Informes;