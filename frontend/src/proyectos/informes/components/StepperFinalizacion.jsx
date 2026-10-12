import React from 'react';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function StepperFinalizacion({ currentStep, pasosCompletados = [], goToStep }) {
  const steps = [
    { id: 1, roman: 'I', label: 'Datos Generales' },
    { id: 2, roman: 'II', label: 'Fortalezas y Lim.' },
    { id: 3, roman: 'III', label: 'Resultados' },
    { id: 4, roman: 'IV', label: 'Lecciones' },
    { id: 5, roman: 'V', label: 'Conclusiones' },
    { id: 6, roman: 'VI', label: 'Recomendaciones' },
    { id: 7, roman: 'VII', label: 'Cronología' },
    { id: 8, roman: 'VIII', label: 'Metas e Ind.' },
    { id: 9, roman: 'IX', label: 'Presupuesto' },
    { id: 10, roman: 'X', label: 'Evidencias' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="flex items-start min-w-max pb-2">
        {steps.map((step, index) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = pasosCompletados.includes(step.id);
          const isClickable = true; 

          return (
            <React.Fragment key={step.id}>
              {/* Contenedor del Paso */}
              <div 
                onClick={() => isClickable && goToStep(step.id)}
                className={`flex flex-col items-center relative group w-20 md:w-24 shrink-0 transition-opacity ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
              >
                {/* Circulo */}
                <div 
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isCurrent 
                      ? 'bg-[#b1122b] text-white ring-4 ring-[#b1122b]/20' 
                      : isCompleted
                        ? 'bg-[#10b981] text-white hover:bg-emerald-600' 
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200' 
                    }`}
                >
                  {(isCompleted && !isCurrent) ? <CheckIcon /> : step.roman}
                </div>
                
                {/* Texto */}
                <span 
                  className={`text-[9px] md:text-[10px] uppercase tracking-wider mt-2 font-semibold text-center leading-tight
                    ${isCurrent ? 'text-slate-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}
                >
                  {step.label}
                </span>
              </div>

              {/* Linea Separadora */}
              {index < steps.length - 1 && (
                <div 
                  className={`h-0.5 w-4 md:w-6 mt-4 md:mt-5 transition-colors shrink-0
                    ${isCompleted ? 'bg-[#10b981]' : 'bg-slate-200'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}