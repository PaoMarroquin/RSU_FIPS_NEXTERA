import React, { useEffect, useState } from "react";
import Layout from "../../shared/layout/Layout";

import {
  FiSearch,
  FiFileText,
  FiRefreshCw,
  FiFilter,
  FiPrinter,
  FiArrowLeft,
  FiAward,
  FiActivity,
} from "react-icons/fi";

import { useToast } from "../../shared/context/ToastContext";
import { useInformes } from "./hooks/useInformes";
import { useActividades } from "../actividades/hooks/useActividades";
import { usuarioApi } from "../../shared/api/usuario/usuarioApi";

import {
  obtenerInformeFinalizacion,
  descargarConstancia,
  descargarInformeFinalizacionPDF,
} from "./hooks/informefinalizado";

import {
  DocumentoCard,
  ModalDocumento,
} from "./components/ExpedienteUI";

// Normaliza los nombres de los roles.
const normalizarRol = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Obtiene los nombres de los roles sin asumir una única estructura.
const extraerNombresRol = (valor) => {
  if (!valor) return [];

  if (typeof valor === "string" || typeof valor === "number") {
    return [String(valor)];
  }

  if (Array.isArray(valor)) {
    return valor.flatMap(extraerNombresRol);
  }

  if (typeof valor === "object") {
    const camposNombre = [
      "nombre",
      "name",
      "label",
      "rol",
      "role",
      "nombre_rol",
      "rol_nombre",
    ];

    const nombres = camposNombre
      .filter((campo) => valor[campo] != null)
      .flatMap((campo) => extraerNombresRol(valor[campo]));

    return nombres;
  }

  return [];
};

// Busca los campos habituales que contienen el rol.
const obtenerRolesPerfil = (perfil) => {
  if (!perfil || typeof perfil !== "object") return [];

  const camposRol = [
    "rol",
    "role",
    "nombre_rol",
    "rol_nombre",
    "tipo_rol",
    "roles",
    "role_name",
    "user_role",
  ];

  const roles = camposRol.flatMap((campo) =>
    extraerNombresRol(perfil[campo])
  );

  // Algunos perfiles incluyen los datos dentro de usuario o user.
  for (const campo of ["usuario", "user"]) {
    const cuenta = perfil[campo];

    if (cuenta && typeof cuenta === "object") {
      roles.push(...obtenerRolesPerfil(cuenta));
    }
  }

  return [...new Set(roles.map(normalizarRol).filter(Boolean))];
};

const Informes = () => {
  const { showToast } = useToast();

  const {
    searchTerm,
    setSearchTerm,
    matrizSeleccionada,
    setMatrizSeleccionada,
    loading,
    error,
    filteredMatrices,
  } = useInformes();

  const {
    actividades,
    avances,
    evidencias,
    loadingDetalle,
    seleccionarProyecto,
  } = useActividades();

  const [documentoModal, setDocumentoModal] = useState(null);
  const [informeFinalizacion, setInformeFinalizacion] = useState(null);
  const [loadingFinalizacion, setLoadingFinalizacion] = useState(false);
  const [errorFinalizacion, setErrorFinalizacion] = useState(null);
  const [loadingConstancia, setLoadingConstancia] = useState(false);
  const [errorConstancia, setErrorConstancia] = useState(null);
  const [loadingDetalleAvance, setLoadingDetalleAvance] = useState(false);

  // PERFIL Y ROL DEL USUARIO AUTENTICADO
  const [rolesUsuario, setRolesUsuario] = useState([]);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const cargarPerfil = async () => {
      try {
        setCargandoPerfil(true);

        const perfil = await usuarioApi.obtenerMiPerfil();

        if (!cancelado) {
          console.log("Perfil autenticado:", perfil);

          setRolesUsuario(obtenerRolesPerfil(perfil));
        }
      } catch (err) {
        console.error("Error al obtener el perfil del usuario:", err);

        if (!cancelado) {
          setRolesUsuario([]);
        }
      } finally {
        if (!cancelado) {
          setCargandoPerfil(false);
        }
      }
    };

    cargarPerfil();

    return () => {
      cancelado = true;
    };
  }, []);

  // Solo Departamento y Jefatura RSU pueden ver Estado de avance.
  const puedeVerEstadoAvance = rolesUsuario.some((rol) => {
    return (
      rol === "departamento" ||
      rol.includes("departamento") ||
      rol === "jefatura rsu" ||
      rol.includes("jefatura rsu")
    );
  });

  const estadoProyecto = String(matrizSeleccionada?.estado || "")
    .trim()
    .toLowerCase();

  const proyectoAprobado = [
    "aprobado",
    "en_ejecucion",
    "finalizado",
  ].includes(estadoProyecto);

  // CARGAR INFORME DE FINALIZACIÓN
  useEffect(() => {
    let cancelado = false;

    const cargarInformeFinalizacion = async () => {
      if (!matrizSeleccionada?.id) {
        setInformeFinalizacion(null);
        setErrorFinalizacion(null);
        setErrorConstancia(null);
        setLoadingFinalizacion(false);
        return;
      }

      setInformeFinalizacion(null);
      setErrorFinalizacion(null);
      setErrorConstancia(null);

      try {
        setLoadingFinalizacion(true);

        const data = await obtenerInformeFinalizacion(
          matrizSeleccionada.id
        );

        if (!cancelado) {
          setInformeFinalizacion(data);
        }
      } catch (err) {
        if (cancelado) return;

        console.error("Error cargando informe de finalización:", err);

        setInformeFinalizacion(null);

        setErrorFinalizacion(
          err?.response?.status === 404
            ? "Este proyecto todavía no tiene informe de finalización."
            : "No se pudo cargar el informe de finalización."
        );
      } finally {
        if (!cancelado) {
          setLoadingFinalizacion(false);
        }
      }
    };

    cargarInformeFinalizacion();

    return () => {
      cancelado = true;
    };
  }, [matrizSeleccionada?.id]);

  // ESTADOS DEL INFORME
  const estadoInforme = String(
    informeFinalizacion?.finalizacion?.estado ||
      informeFinalizacion?.estado ||
      matrizSeleccionada?.informe_finalizacion_estado ||
      ""
  )
    .trim()
    .toLowerCase();

  const proyectoFinalizado = estadoProyecto === "finalizado";

  const informeFinalizacionAprobado =
    estadoInforme === "aprobado" && proyectoFinalizado;

  const informeFinalizacionEnviado = estadoInforme === "enviado";
  const informeFinalizacionObservado = estadoInforme === "observado";
  const constanciaDisponible = proyectoFinalizado;

  // CERRAR MODAL
  const cerrarModal = () => {
    if (documentoModal?.url) {
      window.URL.revokeObjectURL(documentoModal.url);
    }

    setDocumentoModal(null);
    setErrorConstancia(null);
  };

  // ESTADO DE AVANCE
  const abrirEstadoAvance = async () => {
    if (
      !puedeVerEstadoAvance ||
      !matrizSeleccionada?.id ||
      loadingDetalleAvance
    ) {
      return;
    }

    setDocumentoModal({ tipo: "avance" });
    setLoadingDetalleAvance(true);

    try {
      await seleccionarProyecto(matrizSeleccionada);
    } catch (err) {
      console.error("Error cargando actividades y evidencias:", err);

      showToast(
        "error",
        "No se pudieron cargar las actividades y evidencias."
      );
    } finally {
      setLoadingDetalleAvance(false);
    }
  };

  // PLANIFICACIÓN
  const abrirDocumentoPlanificacion = () => {
    setDocumentoModal({ tipo: "planificacion" });
  };

  // INFORME DE FINALIZACIÓN
  const handleVerFinalizacionPDF = async () => {
    if (
      !matrizSeleccionada?.id ||
      !informeFinalizacionAprobado ||
      loadingFinalizacion
    ) {
      return;
    }

    try {
      setLoadingFinalizacion(true);

      const response = await descargarInformeFinalizacionPDF(
        matrizSeleccionada.id
      );

      const blob = response?.data ?? response;
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );

      setDocumentoModal({ tipo: "finalizacion", url });
    } catch (err) {
      console.error("Error cargando PDF de finalización:", err);

      showToast(
        "error",
        "No se pudo cargar el PDF del informe de finalización."
      );
    } finally {
      setLoadingFinalizacion(false);
    }
  };

  // CONSTANCIA
  const handleVerConstanciaPDF = async () => {
    if (
      !matrizSeleccionada?.id ||
      !constanciaDisponible ||
      loadingConstancia
    ) {
      return;
    }

    try {
      setLoadingConstancia(true);
      setErrorConstancia(null);

      const response = await descargarConstancia(
        matrizSeleccionada.id
      );

      const blob = response?.data ?? response;
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );

      setDocumentoModal({ tipo: "constancia", url });
    } catch (err) {
      console.error("Error descargando constancia:", err);

      let mensaje = "No se pudo descargar la constancia.";

      if (err?.response?.status === 403) {
        mensaje = "No tienes permiso para descargar esta constancia.";
      } else if (err?.response?.status === 404) {
        mensaje = "La constancia todavía no está disponible.";
      } else if (err?.response?.status === 401) {
        mensaje = "Tu sesión ha expirado. Inicia sesión nuevamente.";
      }

      setErrorConstancia(mensaje);
      showToast("error", mensaje);
    } finally {
      setLoadingConstancia(false);
    }
  };

  const codigo =
    matrizSeleccionada?.codigo || `PRY-${matrizSeleccionada?.id || ""}`;

  const titulo = matrizSeleccionada?.titulo || "Proyecto";

  const periodo =
    matrizSeleccionada?.semestre_academico ||
    matrizSeleccionada?.periodo_nombre ||
    matrizSeleccionada?.periodo ||
    "S/A";

  return (
    <Layout>
      <div className="p-4 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 m-0">
              Informes
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Expediente oficial consolidado del Proyecto de
              Responsabilidad Social
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LISTA DE PROYECTOS */}
          <div
            className={`${
              matrizSeleccionada ? "hidden xl:flex" : "flex"
            } xl:col-span-4 flex-col gap-4 w-full`}
          >
            <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FiFilter />
                Búsqueda de expedientes
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
                  <span>Cargando expedientes...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              ) : !Array.isArray(filteredMatrices) ||
                filteredMatrices.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                  No se encontraron expedientes con ese filtro.
                </div>
              ) : (
                filteredMatrices.map((matriz) => (
                  <div
                    key={matriz.id}
                    onClick={() => {
                      cerrarModal();
                      setMatrizSeleccionada(matriz);
                    }}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      matrizSeleccionada?.id === matriz.id
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
                      <span>
                        Semestre:{" "}
                        <b className="text-slate-600">
                          {matriz.semestre_academico ||
                            matriz.periodo_nombre ||
                            "S/A"}
                        </b>
                      </span>

                      <span className="font-semibold text-[10px]">
                        Seleccionar →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DETALLE */}
          <div
            className={`${
              !matrizSeleccionada ? "hidden xl:block" : "block"
            } xl:col-span-8 w-full`}
          >
            {matrizSeleccionada && (
              <button
                onClick={() => {
                  cerrarModal();
                  setMatrizSeleccionada(null);
                }}
                className="xl:hidden flex items-center gap-2 mb-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors w-fit"
              >
                <FiArrowLeft className="text-[#b1122b]" />
                Volver a expedientes
              </button>
            )}

            {!matrizSeleccionada ? (
              <div className="w-full min-h-[500px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 bg-white text-slate-400 text-xs text-center">
                <FiFileText className="w-12 h-12 text-slate-300 mb-2" />
                <span className="font-semibold text-slate-500">
                  Selecciona un proyecto para visualizar sus documentos
                </span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {codigo}
                      </span>

                      <h2 className="text-lg font-bold text-slate-800 mt-1">
                        {titulo}
                      </h2>

                      <p className="text-xs text-slate-400 mt-1">
                        Proyecto seleccionado · Semestre {periodo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-slate-300 w-full sm:w-auto"
                    >
                      <FiPrinter />
                      Imprimir expediente
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50">
                  {/* ESTADO DE AVANCE: SOLO DEPARTAMENTO Y JEFATURA RSU */}
                  {!cargandoPerfil && puedeVerEstadoAvance && proyectoAprobado && (
                    <DocumentoCard
                      icon={<FiActivity className="text-xl" />}
                      titulo="Actividades"
                      descripcion="Avance, porcentaje de ejecución y evidencias registradas."
                      estado="Consultar"
                      disponible
                      loading={loadingDetalleAvance}
                      onView={abrirEstadoAvance}
                    />
                  )}

                  <DocumentoCard
                    icon={<FiFileText className="text-xl" />}
                    titulo="Informe de planificación"
                    descripcion={
                      proyectoAprobado
                        ? "Proyecto RSU aprobado"
                        : estadoProyecto === "en_revision"
                        ? "Proyecto pendiente de revisión y aprobación"
                        : "Proyecto aún no aprobado"
                    }
                    estado={
                      proyectoAprobado
                        ? "Aprobado"
                        : estadoProyecto === "en_revision"
                        ? "En revisión"
                        : "Pendiente"
                    }
                    disponible={proyectoAprobado}
                    onView={abrirDocumentoPlanificacion}
                  />

                  <DocumentoCard
                    icon={<FiFileText className="text-xl" />}
                    titulo="Informe de finalización"
                    descripcion={
                      loadingFinalizacion
                        ? "Cargando información..."
                        : errorFinalizacion ||
                          (!proyectoFinalizado &&
                          estadoInforme === "aprobado"
                            ? "El informe figura aprobado, pero el proyecto aún no está finalizado."
                            : "Informe de ejecución y cierre del proyecto")
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
                    disponible={informeFinalizacionAprobado}
                    loading={loadingFinalizacion}
                    onView={handleVerFinalizacionPDF}
                  />

                  <DocumentoCard
                    icon={<FiAward className="text-xl" />}
                    titulo="Constancia de ejecución"
                    descripcion={
                      errorConstancia ||
                      "PDF de constancia de ejecución del proyecto."
                    }
                    estado={
                      loadingConstancia
                        ? "Descargando"
                        : constanciaDisponible
                        ? "Disponible"
                        : "Pendiente"
                    }
                    disponible={constanciaDisponible}
                    loading={loadingConstancia}
                    onView={handleVerConstanciaPDF}
                    ultimo
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
          cerrar={cerrarModal}
          actividades={actividades}
          avances={avances}
          evidencias={evidencias}
          loadingDetalle={
            documentoModal.tipo === "avance" &&
            (loadingDetalleAvance || loadingDetalle)
          }
        />
      )}
    </Layout>
  );
};

export default Informes;
