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
    <div className="layout">
      <Sidebar />

      <div className="content relative pb-24 min-h-screen bg-slate-50">
        <Topbar />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Nuevo Proyecto RSU</h1>
              <p className="text-slate-500 text-sm m-0 mt-1">Formato Oficial OURS - Universidad Nacional de San Agustín</p>
            </div>
            <button className="h-9 px-4 border border-slate-300 bg-white rounded-md text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <Stepper currentStep={step} />
            
            <div className="mt-6">
              {step === 1 && <DatosGenerales data={formData} updateData={updateData} />}
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