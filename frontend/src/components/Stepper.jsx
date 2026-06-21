import React from 'react';

// Componente simple de icono Check
const CheckIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Stepper({ currentStep, highestStep, goToStep }) {
  const steps = [
    { id: 1, label: 'DATOS GENERALES' },
    { id: 2, label: 'FUNDAMENTACIÓN' },
    { id: 3, label: 'DIAGNÓSTICO' },
    { id: 4, label: 'OBJETIVOS' },
    { id: 5, label: 'RESULTADOS' },
    { id: 6, label: 'ACTIVIDADES' },
    { id: 7, label: 'CRONOGRAMA' },
    { id: 8, label: 'RECURSOS' },
    { id: 9, label: 'FINANCIAMIENTO' },
  ];

  return (
    <div className="flex items-center w-full mb-6 pb-4 overflow-x-auto border-b border-slate-100 px-2">
      {steps.map((step, index) => {
        // Lógica de estados para coincidir con tu imagen
        const isCurrent = currentStep === step.id;
        const isCompleted = step.id < currentStep || (step.id < highestStep && !isCurrent);
        const isClickable = step.id <= highestStep;

        return (
          <React.Fragment key={step.id}>
            {/* Contenedor del Círculo y Texto */}
            <div className="flex flex-col items-center min-w-[100px]">
              <button
                onClick={() => goToStep(step.id)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300
                  ${isCurrent
                    ? 'bg-[#b1122b] text-white ring-4 ring-red-100 shadow-md' // Estado activo (Rojo)
                    : isCompleted
                      ? 'bg-[#10b981] text-white cursor-pointer hover:bg-emerald-600' // Completado (Verde)
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed' // Pendiente (Gris)
                  }`}
              >
                {isCompleted ? <CheckIcon /> : step.id}
              </button>
              <span
                className={`text-[10px] font-bold text-center tracking-wider transition-colors duration-300 uppercase
                  ${isCurrent ? 'text-slate-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}
              >
                {step.label}
              </span>
            </div>

            {/* Línea conectora (se omite después del último paso) */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-[2px] mx-2 transition-colors duration-300 -mt-6
                  ${step.id < highestStep && step.id < currentStep ? 'bg-[#10b981]' : 'bg-slate-200'}`} 
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}