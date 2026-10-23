import React, { useState } from "react";
import Layout from "../../../shared/layout/Layout";
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiRefreshCw,
  FiDownload,
  FiInfo,
} from "react-icons/fi";
import { useToast } from "../../../shared/context/ToastContext";

import { useProyectosListado } from "../../listar/hooks/useProyectosListado";
import {
  useInformeFinalizacionForm,
  MAX_MEDIO_DIFUSION,
} from "../hooks/useInformeFinalizacionForm";
import { descargarInformeFinalizacionPDF } from "../hooks/informefinalizado";

import { BuscadorProyectos } from "../components/BuscadorProyectos";
import StepperFinalizacion from "../components/StepperFinalizacion";
import FormFooterFinalizacion from "../components/FormFooterFinalizacion";

import {
  SeccionDatosGenerales,
  SeccionFortalezas,
  SeccionResultados,
  SeccionLecciones,
  SeccionTextosSimple,
  SeccionCronologia,
  SeccionRecursos,
  SeccionMetas,
  SeccionPresupuesto,
  SeccionEvidencias,
  PanelObservaciones,
} from "../components/SeccionesInforme";

export default function InformeFinalizacion() {
  const { showToast } = useToast();

  // La API devuelve los proyectos en ejecución.
  const {
    projectsDb = [],
    loading: loadingProyectos,
    searchTerm = "",
    setSearchTerm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
  } = useProyectosListado({ estado: "en_ejecucion" });

  const [busquedaProyecto, setBusquedaProyecto] = useState(
    searchTerm || ""
  );

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // Mostrar proyectos con todas sus actividades completadas
  // o que ya tengan un informe enviado/aprobado.
  const proyectosElegibles = projectsDb.filter((proyecto) => {
    const actividades = proyecto.actividades ?? [];
    const estadoInforme = proyecto.informe_finalizacion_estado;

    const todasActividadesCompletadas =
      actividades.length > 0 &&
      actividades.every(
        (actividad) => actividad.estado === "completada"
      );

    const informeYaEnviado = ["enviado", "aprobado"].includes(
      estadoInforme
    );

    return todasActividadesCompletadas || informeYaEnviado;
  });

  // Formulario de finalización.
  const {
    step,
    nextStep,
    prevStep,
    goToStep,
    pasosCompletados,
    informeData,
    puedeEditar,
    textos,
    metas,
    partidas,
    cambiarTexto,
    cambiarMeta,
    cambiarPartida,
    loading: loadingInforme,
    isSubmitting,
    error,
    setError,
    cargarInforme,
    guardarBorrador,
    enviarRevision,
  } = useInformeFinalizacionForm();

  // Seleccionar proyecto.
  const handleSeleccionarProyecto = async (proyecto) => {
    if (!proyecto?.id) return;

    setProyectoSeleccionado(proyecto);
    await cargarInforme(proyecto.id);
  };

  // Volver al listado.
  const handleVolver = () => {
    setProyectoSeleccionado(null);
    setError(null);
  };

  // Guardar borrador.
  const handleGuardarBorrador = async () => {
    if (!proyectoSeleccionado?.id) return;

    const exito = await guardarBorrador(proyectoSeleccionado.id);

    if (exito) {
      showToast("success", "Borrador guardado exitosamente.");
    }
  };

  // Enviar informe a revisión.
  const handleFinalizarYEnviar = async () => {
    if (!proyectoSeleccionado?.id) return;

    const exito = await enviarRevision(proyectoSeleccionado.id);

    if (exito) {
      showToast("success", "Informe enviado correctamente.");
      setProyectoSeleccionado(null);
    }
  };

  const finalizacion = informeData?.finalizacion;
  const estadoInforme = finalizacion?.estado || "borrador";

  // Descargar el PDF oficial del informe.
  const handleDescargarPDF = async () => {
    if (!proyectoSeleccionado?.id) return;

    try {
      const response = await descargarInformeFinalizacionPDF(
        proyectoSeleccionado.id
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `informe-finalizacion-${proyectoSeleccionado.codigo || proyectoSeleccionado.id
        }.pdf`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar el PDF:", err);
      showToast("error", "No se pudo descargar el PDF del informe.");
    }
  };

  // Mensaje que explica por qué el formulario está bloqueado.
  const avisoBloqueo = (() => {
    if (!finalizacion || finalizacion.editable) return null;

    if (informeData?.estado === "finalizado") {
      return "El proyecto ya está finalizado: su Informe de Finalización ya no se puede modificar.";
    }

    if (!finalizacion.habilitado) {
      return "El Informe de Finalización se habilita cuando todas las actividades del proyecto están completadas.";
    }

    if (estadoInforme === "enviado") {
      return "El informe fue enviado al Departamento y está en revisión. No se puede modificar.";
    }

    if (estadoInforme === "aprobado") {
      return "El informe ya fue aprobado y no se puede modificar.";
    }

    return "El informe no se puede modificar en este momento.";
  })();

  // Renderizar el paso actual.
  const renderCurrentStep = () => {
    if (loadingInforme) {
      return (
        <div className="py-20 text-center">
          <FiRefreshCw className="animate-spin text-3xl text-[#b1122b] mx-auto mb-3" />
          <span className="text-slate-500 text-sm">
            Cargando expediente...
          </span>
        </div>
      );
    }

    switch (step) {
      // PASO 1: Datos generales
      case 1:
        return <SeccionDatosGenerales informe={informeData} />;

      // PASO 2: Fortalezas y limitaciones
      case 2:
        return (
          <SeccionFortalezas
            textos={textos}
            onChange={cambiarTexto}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 3: Resultados
      case 3:
        return (
          <SeccionResultados
            avance={informeData?.resultados_alcanzados?.avance}
            esperados={informeData?.resultados_esperados}
            textos={textos}
            onChange={cambiarTexto}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 4: Lecciones aprendidas
      case 4:
        return (
          <SeccionLecciones
            textos={textos}
            onChange={cambiarTexto}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 5: Conclusiones
      case 5:
        return (
          <SeccionTextosSimple
            titulo="Conclusiones"
            descripcion="Cierre descriptivo de la intervención."
            label="Conclusiones"
            valor={textos.conclusiones}
            onChange={(v) => cambiarTexto("conclusiones", v)}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 6: Recomendaciones y medio de difusión
      case 6:
        return (
          <div className="space-y-6">
            <SeccionTextosSimple
              titulo="Recomendaciones"
              descripcion="Sugerencias para futuros proyectos."
              label="Recomendaciones"
              valor={textos.recomendaciones}
              onChange={(v) => cambiarTexto("recomendaciones", v)}
              puedeEditar={puedeEditar}
            />

            <SeccionTextosSimple
              titulo="Medio de Difusión"
              descripcion="Cómo se difundieron los resultados de este proyecto."
              label="Medio de difusión"
              valor={textos.medio_difusion}
              onChange={(v) => cambiarTexto("medio_difusion", v)}
              puedeEditar={puedeEditar}
              maxLength={MAX_MEDIO_DIFUSION}
            />
          </div>
        );

      // PASO 7: Cronología
      case 7:
        return (
          <SeccionCronologia
            actividades={informeData?.ejecucion?.actividades}
          />
        );

      // PASO 8: Recursos humanos y materiales
      case 8:
        return (
          <SeccionRecursos
            recursos={informeData?.recursos}
          />
        );

      // PASO 9: Metas e indicadores
      case 9:
        return (
          <SeccionMetas
            metas={metas}
            cambiarMeta={cambiarMeta}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 10: Ejecución presupuestal
      case 10:
        return (
          <SeccionPresupuesto
            partidas={partidas}
            cambiarPartida={cambiarPartida}
            puedeEditar={puedeEditar}
          />
        );

      // PASO 11: Evidencias
      case 11:
        return (
          <SeccionEvidencias
            actividades={informeData?.ejecucion?.actividades}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">
        {!proyectoSeleccionado ? (
          <>
            {/* Encabezado del listado */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 m-0">
                Informe de Finalización
              </h1>

              <p className="text-slate-500 text-sm m-0 mt-1">
                Selecciona un proyecto para emitir o consultar su informe de cierre.
              </p>
            </div>

            {/* Buscador con proyectos elegibles */}
            <BuscadorProyectos
              busquedaProyecto={busquedaProyecto}
              setBusquedaProyecto={setBusquedaProyecto}
              setSearchTerm={setSearchTerm}
              loading={loadingProyectos}
              proyectos={proyectosElegibles}
              seleccionarProyecto={handleSeleccionarProyecto}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </>
        ) : (
          <>
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 m-0">
                  Informe de Finalización
                </h1>

                <p className="text-slate-500 text-sm m-0 mt-1">
                  Expediente de Cierre RSU · {proyectoSeleccionado.codigo}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {informeData && (
                  <button
                    type="button"
                    onClick={handleDescargarPDF}
                    className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiDownload />
                    Descargar PDF
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleVolver}
                  className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FiArrowLeft />
                  Volver a proyectos
                </button>
              </div>
            </div>

            {/* Estado del informe */}
            {avisoBloqueo && !loadingInforme && (
              <div className="flex gap-3 p-4 mb-6 rounded-xl border border-blue-200 bg-blue-50">
                <FiInfo className="text-blue-600 text-xl shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 m-0">
                  {avisoBloqueo}
                </p>
              </div>
            )}

            {/* Comentarios del Departamento */}
            {!loadingInforme && (
              <PanelObservaciones
                observaciones={informeData?.observaciones}
              />
            )}

            {/* Alerta de errores */}
            {error && (
              <div className="flex gap-3 p-4 mb-6 rounded-xl border border-red-300 bg-red-50">
                <FiAlertTriangle className="text-red-500 text-xl shrink-0 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-red-800 m-0">
                    Ocurrió un problema
                  </p>

                  <p className="text-sm text-red-900 m-0 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Navegación por pasos */}
            <div className="mb-6">
              <StepperFinalizacion
                currentStep={step}
                pasosCompletados={pasosCompletados}
                goToStep={goToStep}
              />
            </div>

            {/* Contenido del formulario */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 min-h-[500px]">
              {renderCurrentStep()}
            </div>
          </>
        )}

        {/* Footer de navegación y guardado */}
        {proyectoSeleccionado && !loadingInforme && (
          <FormFooterFinalizacion
            step={step}
            totalSteps={11}
            nextStep={nextStep}
            prevStep={prevStep}
            guardarBorrador={handleGuardarBorrador}
            enviarProyectoBackend={handleFinalizarYEnviar}
            isSubmitting={isSubmitting}
            puedeEditar={puedeEditar}
          />
        )}
      </div>
    </Layout>
  );
}