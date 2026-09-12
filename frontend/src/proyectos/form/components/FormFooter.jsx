import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSave, FiCheck, FiLoader } from 'react-icons/fi';

// Agregamos isSubmitting a las props para bloquear los botones mientras carga
export default function FormFooter({ step, nextStep, prevStep, enviarProyectoBackend, guardarBorrador, isSubmitting }) {
  return (
    // Cambiamos left-[230px] por md:left-[230px] left-0 para que en móviles no se rompa el layout
    <div className="fixed bottom-0 left-0 md:left-[230px] right-0 bg-white border-t border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div>
        <button 
          type="button"
          className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={prevStep} 
          disabled={step === 1 || isSubmitting}
        >
          <FiChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Anterior</span>
        </button>
      </div>

      <div className="text-sm text-slate-500 font-medium hidden sm:block">
        Sección {step} de 9
      </div>

      <div className="flex gap-2 md:gap-3">
        {/* Guardar Borrador (En cualquier paso menos el 9) */}
        {step !== 9 && (
          <button 
            type="button"
            className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={guardarBorrador}
            disabled={isSubmitting}
          >
            {isSubmitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSubmitting ? 'Guardando...' : 'Guardar Borrador'}</span>
          </button>
        )}
        
        {/* Finalizar (Paso 9) vs Siguiente (Otros pasos) */}
        {step === 9 ? (
          <button 
            type="button"
            className="flex items-center gap-2 px-4 md:px-6 py-2 bg-[#b1122b] text-white rounded-md text-sm font-semibold hover:bg-[#8e0e22] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={enviarProyectoBackend}
            disabled={isSubmitting}
          >
            {isSubmitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
            {isSubmitting ? 'Enviando...' : 'Finalizar y Guardar'}
          </button>
        ) : (
          <button 
            type="button"
            className="flex items-center gap-2 px-4 md:px-6 py-2 bg-[#b1122b] text-white rounded-md text-sm font-semibold hover:bg-[#8e0e22] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={nextStep}
            disabled={isSubmitting}
          >
            Siguiente <FiChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}