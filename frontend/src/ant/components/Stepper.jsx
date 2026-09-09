import React from 'react';

// Icono Check circular
const CheckIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Stepper({ currentStep, pasosCompletados = [], goToStep }) {
  const steps = [
    { id: 1, roman: 'I', label: 'Datos Generales' },
    { id: 2, roman: 'II', label: 'Fundamentación' },
    { id: 3, roman: 'III', label: 'Diagnóstico' },
    { id: 4, roman: 'IV', label: 'Objetivos' },
    { id: 5, roman: 'V', label: 'Resultados' },
    { id: 6, roman: 'VI', label: 'Actividades' },
    { id: 7, roman: 'VII', label: 'Cronograma' },
    { id: 8, roman: 'VIII', label: 'Recursos' },
    { id: 9, roman: 'IX', label: 'Financiamiento' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="flex items-start min-w-max">
        {steps.map((step, index) => {
          const isCurrent = currentStep === step.id;
          
          // La validación ahora viene del arreglo que escupe el Hook (Verde solo si cumple las reglas)
          const isCompleted = pasosCompletados.includes(step.id);
          
          // Navegación libre habilitada para todas las secciones
          const isClickable = true; 

          return (
            <React.Fragment key={step.id}>
              
              {/* Contenedor del Paso */}
              <div 
                onClick={() => isClickable && goToStep(step.id)}
                className={`flex flex-col items-center relative group w-24 shrink-0 transition-opacity ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
              >
                {/* Círculo */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isCurrent 
                      ? 'bg-[#b1122b] text-white ring-4 ring-[#b1122b]/20' // Activo (Rojo UNSA)
                      : isCompleted
                        ? 'bg-[#10b981] text-white hover:bg-emerald-600' // Completado y validado (Verde)
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200' // Incompleto (Gris/Plomito)
                    }`}
                >
                  {/* Muestra el check solo si está completado y no lo estás editando ahora mismo */}
                  {(isCompleted && !isCurrent) ? <CheckIcon /> : step.roman}
                </div>
                
                {/* Texto */}
                <span 
                  className={`text-[10px] uppercase tracking-wider mt-2 font-semibold text-center leading-tight
                    ${isCurrent ? 'text-slate-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}
                >
                  {step.label}
                </span>
              </div>

              {/* Línea Separadora (Directamente entre los flex items como en tu HTML) */}
              {index < steps.length - 1 && (
                <div 
                  className={`h-0.5 w-6 mt-5 transition-colors shrink-0
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