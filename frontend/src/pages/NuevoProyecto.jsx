import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Stepper from "../components/Stepper";
import FormFooter from "../components/FormFooter";
import DatosGenerales from "../components/forms/DatosGenerales";
import { useFormRSU } from "../hooks/useFormRSU";

export default function NuevoProyecto() {
  const { step, formData, updateData, nextStep, prevStep, handleBorrador } = useFormRSU();

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. Sidebar Fijo a la izquierda */}
      <Sidebar />

      {/* 2. Contenido principal desplazado 230px a la derecha */}
      {/* El pb-24 (padding-bottom) asegura que el FormFooter fijo no tape el contenido del formulario */}
      <div className="ml-[230px] flex flex-col min-h-screen relative pb-24">
        
        <Topbar />

        {/* 3. Área de trabajo */}
        <div className="p-6 md:p-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Nuevo Proyecto RSU</h1>
              <p className="text-slate-500 text-sm m-0 mt-1">Formato Oficial OURS - Universidad Nacional de San Agustín</p>
            </div>
            <button className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <Stepper currentStep={step} />
            
            <div className="mt-6">
              {step === 1 && <DatosGenerales data={formData} updateData={updateData} />}
            </div>
          </div>
        </div>

        {/* 4. Footer Fijo */}
        <FormFooter 
          step={step} 
          nextStep={nextStep} 
          prevStep={prevStep} 
          handleBorrador={handleBorrador}
        />
        
      </div>
    </div>
  );
}