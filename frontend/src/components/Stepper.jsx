import React from 'react';

export default function Stepper({ currentStep }) {
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
    <div className="flex items-center justify-between w-full mb-6 pb-4 overflow-x-auto border-b border-slate-100">
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col items-center min-w-[90px] px-1">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300
              ${currentStep === step.id 
                ? 'bg-[#b1122b] text-white shadow-md shadow-red-900/20' 
                : currentStep > step.id 
                  ? 'bg-slate-200 text-slate-600' 
                  : 'bg-slate-100 text-slate-400'}`}
          >
            {step.id}
          </div>
          <span 
            className={`text-[10px] font-bold text-center tracking-wider transition-colors duration-300
              ${currentStep === step.id ? 'text-slate-800' : 'text-slate-400'}`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}