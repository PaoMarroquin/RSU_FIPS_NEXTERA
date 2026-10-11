
import React, { useState } from "react";
import {
  FiRefreshCw,
  FiSave,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export default function FormFooterFinalizacion({
  step,
  totalSteps,
  nextStep,
  prevStep,
  guardarBorrador,
  enviarProyectoBackend,
  isSubmitting,
  puedeEditar,
}) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const botonBase =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const confirmarEnvio = async () => {
    await enviarProyectoBackend();
    setMostrarConfirmacion(false);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:left-64">
        <div className="mx-auto flex max-w-5xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`${botonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <FiChevronLeft />
            Anterior
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {puedeEditar && (
              <button
                type="button"
                onClick={guardarBorrador}
                disabled={isSubmitting}
                className={`${botonBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                {isSubmitting ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiSave />
                )}
                Guardar Borrador
              </button>
            )}

            {step === totalSteps ? (
              puedeEditar && (
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(true)}
                  disabled={isSubmitting}
                  className={`${botonBase} bg-[#b1122b] text-white hover:bg-[#8a0e21]`}
                >
                  <FiSend />
                  Finalizar y Enviar
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className={`${botonBase} bg-slate-800 text-white hover:bg-slate-700`}
              >
                Siguiente
                <FiChevronRight />
              </button>
            )}
          </div>
        </div>
      </footer>

      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-800">
              ¿Estás seguro de que deseas finalizar y enviar el informe?
            </h2>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={isSubmitting}
                className={`${botonBase} border border-slate-300 text-slate-700 hover:bg-slate-50`}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEnvio}
                disabled={isSubmitting}
                className={`${botonBase} bg-[#b1122b] text-white hover:bg-[#8a0e21]`}
              >
                {isSubmitting ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
