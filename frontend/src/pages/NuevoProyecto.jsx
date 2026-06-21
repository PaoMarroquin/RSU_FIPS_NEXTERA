import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Stepper from "../components/Stepper";
import FormFooter from "../components/FormFooter";
import DatosGenerales from "../components/forms/DatosGenerales";
import Fundamentacion from "../components/forms/Fundamentacion";
import Diagnostico from "../components/forms/Diagnostico";
import Objetivos from "../components/forms/Objetivos";
import { useFormRSU } from "../hooks/useFormRSU";
import { useNavigate } from 'react-router-dom';

export default function NuevoProyecto() {
  // Extraemos las nuevas funciones y variables del hook
  const { 
    step, 
    highestStep, 
    formData, 
    updateData, 
    nextStep, 
    prevStep, 
    goToStep, 
    handleBorrador 
  } = useFormRSU();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-[230px] flex flex-col min-h-screen relative pb-24">
        <Topbar />

        <div className="max-w-5xl mx-auto space-y-6 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Nuevo Proyecto RSU</h1>
              <p className="text-slate-500 text-sm m-0 mt-1">Formato Oficial OURS - Universidad Nacional de San Agustín</p>
            </div>
            <button 
            className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            onClick={() => navigate('/proyectos')}>
              Cancelar
            </button>
          </div>
     
          <Stepper currentStep={step} highestStep={highestStep} goToStep={goToStep} />
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 min-h-[500px]"> 
            <div className="mt-6">
              {step === 1 && <DatosGenerales data={formData} updateData={updateData} />}
              {step === 2 && <Fundamentacion data={formData} updateData={updateData} />}
              {step === 3 && <Diagnostico data={formData} updateData={updateData} />}
              {step === 4 && <Objetivos data={formData} updateData={updateData} />}
              {/* {step === 2 && <Fundamentacion ... />}  ACA MAS PASOS*/}
            </div>
          </div>
        </div>

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