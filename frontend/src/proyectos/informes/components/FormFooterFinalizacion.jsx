import React from 'react';
import { FiRefreshCw, FiSave, FiSend, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function FormFooterFinalizacion({ 
  step, 
  totalSteps,
  nextStep, 
  prevStep, 
  guardarBorrador, 
  enviarProyectoBackend, 
  isSubmitting,
  puedeEditar
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        
        {/* Boton Anterior */}
        <button
          onClick={prevStep}
          disabled={step === 1 || isSubmitting}
          className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiChevronLeft /> Anterior
        </button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {puedeEditar && (
            <button
              onClick={guardarBorrador}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <FiRefreshCw className="animate-spin" /> : <FiSave />} 
              Guardar Borrador
            </button>
          )}

          {step === totalSteps ? (
            puedeEditar && (
              <button
                onClick={enviarProyectoBackend}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8a0e21] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? <FiRefreshCw className="animate-spin" /> : <FiSend />} 
                Finalizar y Enviar
              </button>
            )
          ) : (
            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Siguiente <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}