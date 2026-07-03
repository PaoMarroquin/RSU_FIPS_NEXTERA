import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSave, FiCheck } from 'react-icons/fi';

export default function FormFooter({ step, nextStep, prevStep, enviarProyectoBackend, guardarBorrador }) {
  return (
    <div className="fixed bottom-0 left-[230px] right-0 bg-white border-t border-slate-200 px-8 py-4 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div>
        <button 
          type="button"
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={prevStep} 
          disabled={step === 1}
        >
          <FiChevronLeft className="w-4 h-4" /> Anterior
        </button>
      </div>

      <div className="text-sm text-slate-500 font-medium">
        Sección {step} de 9
      </div>

      <div className="flex gap-3">
        {/* ✅ ACTIVADO: Permite guardar el borrador de manera rápida en pasos intermedios */}
        {step !== 9 && (
          <button 
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            onClick={guardarBorrador} //  Usa la nueva prop dedicada a Borrador
          >
            <FiSave className="w-4 h-4" /> Guardar Borrador
          </button>
        )}
        
        {/* Lógica condicional para el botón principal */}
        {step === 9 ? (
          <button 
            type="button"
            className="flex items-center gap-2 px-6 py-2 bg-[#b1122b] text-white rounded-md text-sm font-semibold hover:bg-[#8e0e22] transition-colors"
            onClick={enviarProyectoBackend} //  Ejecuta handleFinalizarYEnviar ('EN_REVISION')
          >
            <FiCheck className="w-4 h-4" /> Finalizar y Guardar
          </button>
        ) : (
          <button 
            type="button"
            className="flex items-center gap-2 px-6 py-2 bg-[#b1122b] text-white rounded-md text-sm font-semibold hover:bg-[#8e0e22] transition-colors"
            onClick={nextStep}
          >
            Siguiente <FiChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}