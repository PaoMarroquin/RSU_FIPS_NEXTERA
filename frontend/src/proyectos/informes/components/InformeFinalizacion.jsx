import React, { useState } from "react";
import Layout from "../../../shared/layout/Layout";
import { FiArrowLeft, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../shared/context/ToastContext";

import { useProyectosListado } from "../../listar/hooks/useProyectosListado";
import { useInformeFinalizacionForm } from "../hooks/useInformeFinalizacionForm";

import { BuscadorProyectos } from "../components/BuscadorProyectos";
import StepperFinalizacion from "../components/StepperFinalizacion";
import FormFooterFinalizacion from "../components/FormFooterFinalizacion";

import {
  SeccionDatosGenerales, SeccionFortalezas, SeccionResultados,
  SeccionTextosSimple, SeccionCronologia, SeccionMetas, SeccionPresupuesto, SeccionEvidencias
} from "../components/SeccionesInforme";

export default function InformeFinalizacion() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Hook del Buscador de proyectos finalizados
  const { projectsDb = [], loading: loadingProyectos, searchTerm = "", setSearchTerm } = useProyectosListado({ estado: "en_ejecucion" });
  const [busquedaProyecto, setBusquedaProyecto] = useState(searchTerm || "");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // Hook del Formulario (Stepper)
  const {
    step, nextStep, prevStep, goToStep, pasosCompletados,
    informeData, textos, metas, partidas, cambiarTexto, cambiarMeta, cambiarPartida,
    loading: loadingInforme, isSubmitting, error, setError,
    cargarInforme, guardarBorrador, enviarRevision
  } = useInformeFinalizacionForm();

  const handleSeleccionarProyecto = async (proyecto) => {
    if (!proyecto?.id) return;
    setProyectoSeleccionado(proyecto);
    await cargarInforme(proyecto.id);
  };

  const handleVolver = () => {
    setProyectoSeleccionado(null);
  };

  const handleGuardarBorrador = async () => {
    if (!proyectoSeleccionado?.id) return;
    const exito = await guardarBorrador(proyectoSeleccionado.id);
    if (exito) {
      showToast("success", "Borrador guardado exitosamente.");
      setProyectoSeleccionado(null); // Esto te devuelve a la lista
    }
  };

  const handleFinalizarYEnviar = async () => {
    if (!proyectoSeleccionado?.id || !window.confirm("¿Deseas enviar este informe al Departamento? Ya no podrás editarlo.")) return;
    const exito = await enviarRevision(proyectoSeleccionado.id);
    if (exito) {
      showToast("success", "Informe enviado correctamente.");
      setProyectoSeleccionado(null); // Vuelve a la lista
    }
  };

  const estadoInforme = informeData?.finalizacion?.estado || "borrador";
  const puedeEditar = estadoInforme === "borrador" || estadoInforme === "observado";

  const renderCurrentStep = () => {
    if (loadingInforme) return <div className="py-20 text-center"><FiRefreshCw className="animate-spin text-3xl text-[#b1122b] mx-auto mb-3" /> <span className="text-slate-500 text-sm">Cargando expediente...</span></div>;

    switch (step) {
      case 1: return <SeccionDatosGenerales informe={informeData} />;
      case 2: return <SeccionFortalezas />;
      case 3: return <SeccionResultados avance={informeData?.resultados_alcanzados?.avance} esperados={informeData?.resultados_esperados} />;
      case 4: return <SeccionTextosSimple titulo="Lecciones Aprendidas" descripcion="Analice la experiencia, obstáculos superados y aprendizajes." label="Lecciones aprendidas" valor={textos.lecciones_aprendidas} onChange={(v) => cambiarTexto("lecciones_aprendidas", v)} puedeEditar={puedeEditar} />;
      case 5: return <SeccionTextosSimple titulo="Conclusiones" descripcion="Cierre descriptivo de la intervención." label="Conclusiones" valor={textos.conclusiones} onChange={(v) => cambiarTexto("conclusiones", v)} puedeEditar={puedeEditar} />;
      case 6: return (
        <div className="space-y-6">
          <SeccionTextosSimple titulo="Recomendaciones" descripcion="Sugerencias para futuros proyectos." label="Recomendaciones" valor={textos.recomendaciones} onChange={(v) => cambiarTexto("recomendaciones", v)} puedeEditar={puedeEditar} />
          <SeccionTextosSimple titulo="Medio de Difusión" descripcion="Cómo se difundieron los resultados de este proyecto." label="Medio de difusión" valor={textos.medio_difusion} onChange={(v) => cambiarTexto("medio_difusion", v)} puedeEditar={puedeEditar} />
        </div>
      );
      case 7: return <SeccionCronologia actividades={informeData?.ejecucion?.actividades} />;
      case 8: return <SeccionMetas metas={metas} cambiarMeta={cambiarMeta} puedeEditar={puedeEditar} />;
      case 9: return <SeccionPresupuesto partidas={partidas} cambiarPartida={cambiarPartida} puedeEditar={puedeEditar} />;
      case 10: return <SeccionEvidencias />;
      default: return null;
    }
  };

  if (!proyectoSeleccionado) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6 pb-24 px-4 pt-6 w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0">Informe de Finalización</h1>
            <p className="text-slate-500 text-sm m-0 mt-1">Selecciona un proyecto finalizado para emitir su informe de cierre.</p>
          </div>
          <BuscadorProyectos
            busquedaProyecto={busquedaProyecto} setBusquedaProyecto={setBusquedaProyecto}
            setSearchTerm={setSearchTerm} loading={loadingProyectos}
            proyectos={projectsDb} seleccionarProyecto={handleSeleccionarProyecto}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Contenedor principal responsive clonando la lógica de NuevoProyecto */}
      <div className="max-w-5xl mx-auto space-y-6 pb-32 px-4 pt-6 w-full relative">

        {/* Cabecera Responsiva */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0">Informe de Finalización</h1>
            <p className="text-slate-500 text-sm m-0 mt-1">Expediente de Cierre RSU · {proyectoSeleccionado.codigo}</p>
          </div>
          <button
            className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            onClick={handleVolver}
          >
            <FiArrowLeft /> Volver a proyectos
          </button>
        </div>

        {/* Alerta de Errores Globales */}
        {error && (
          <div className="flex gap-3 p-4 rounded-xl border border-red-300 bg-red-50">
            <FiAlertTriangle className="text-red-500 text-xl shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 m-0">Ocurrió un problema</p>
              <p className="text-sm text-red-900 m-0 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stepper Horizontal Scrollable */}
        <StepperFinalizacion currentStep={step} pasosCompletados={pasosCompletados} goToStep={goToStep} />

        {/* Area Principal Formulario (Fondo Blanco Limpio) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 min-h-[500px]">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Footer Fijo con Botones */}
      {!loadingInforme && (
        <FormFooterFinalizacion
          step={step} totalSteps={10}
          nextStep={nextStep} prevStep={prevStep}
          guardarBorrador={handleGuardarBorrador}
          enviarProyectoBackend={handleFinalizarYEnviar}
          isSubmitting={isSubmitting} puedeEditar={puedeEditar}
        />
      )}
    </Layout>
  );
}