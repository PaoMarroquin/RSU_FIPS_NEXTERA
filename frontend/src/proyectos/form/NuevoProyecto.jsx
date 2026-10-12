
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { useFormRSU } from "./hooks/useFormRSU";
import Layout from "../../shared/layout/Layout";

import Stepper from "./components/Stepper";
import FormFooter from "./components/FormFooter";
import DatosGenerales from "./components/forms/DatosGenerales";
import Fundamentacion from "./components/forms/Fundamentacion";
import Diagnostico from "./components/forms/Diagnostico";
import Objetivos from "./components/forms/Objetivos";
import Resultados from "./components/forms/Resultados";
import Actividades from "./components/forms/Actividades";
import Cronograma from "./components/forms/Cronograma";
import Recursos from "./components/forms/Recursos";
import Financiamiento from "./components/forms/Financiamiento";

export default function NuevoProyecto() {
  const {
    step,
    formData,
    pasosCompletados,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    handleCancelar,
    enviarProyectoBackend,
    isSubmitting,
  } = useFormRSU();

  const navigate = useNavigate();

  const handleCancelarYGuardarBorrador = () => {
    handleCancelar();
  };

  const handleFinalizarYEnviar = async () => {
    const exito = await enviarProyectoBackend("EN_REVISION");

    if (exito) {
      navigate("/proyectos");
    }
  };

  const handleGuardarBorrador = async () => {
    const exito = await enviarProyectoBackend("BORRADOR");

    if (exito) {
      navigate("/proyectos");
    }
  };

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-64px)] w-full flex-1 flex-col space-y-6 p-6 md:p-8">
        {/* ENCABEZADO */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
              Nuevo Proyecto RSU
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Formato Oficial OURS - Universidad Nacional de San Agustín
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelarYGuardarBorrador}
            className="flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>

        {/* AVISO DE PROYECTO OBSERVADO */}
        {formData.estado === "observado" &&
          formData.ultima_observacion && (
            <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-xl text-amber-500" />

              <div className="min-w-0">
                <p className="m-0 text-sm font-bold text-amber-800">
                  Este proyecto fue observado
                  {formData.ultima_observacion.revisor
                    ? ` por ${formData.ultima_observacion.revisor}`
                    : ""}
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                  {formData.ultima_observacion.comentario}
                </p>

                <p className="mt-2 text-xs text-amber-600">
                  Corrige lo indicado antes de volver a enviarlo a revisión.
                </p>
              </div>
            </div>
          )}

        {/* PASOS DEL FORMULARIO */}
        <Stepper
          currentStep={step}
          pasosCompletados={pasosCompletados}
          goToStep={goToStep}
        />

        {/* CONTENIDO DEL FORMULARIO */}
        <section className="w-full flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[500px] p-4 md:p-6 lg:p-8">
            <div>
              {step === 1 && (
                <DatosGenerales
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 2 && (
                <Fundamentacion
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 3 && (
                <Diagnostico
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 4 && (
                <Objetivos
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 5 && (
                <Resultados
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 6 && (
                <Actividades
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 7 && (
                <Cronograma
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 8 && (
                <Recursos
                  data={formData}
                  updateData={updateData}
                />
              )}

              {step === 9 && (
                <Financiamiento
                  data={formData}
                  updateData={updateData}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* NAVEGACIÓN Y ACCIONES DEL FORMULARIO */}
      <FormFooter
        step={step}
        nextStep={nextStep}
        prevStep={prevStep}
        enviarProyectoBackend={handleFinalizarYEnviar}
        guardarBorrador={handleGuardarBorrador}
        isSubmitting={isSubmitting}
      />
    </Layout>
  );
}