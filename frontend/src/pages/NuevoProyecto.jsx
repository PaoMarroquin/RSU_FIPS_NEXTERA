import React, { useEffect } from "react"; // 1. Importamos useEffect
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Stepper from "../components/Stepper";
import FormFooter from "../components/FormFooter";
import DatosGenerales from "../components/forms/DatosGenerales";
import Fundamentacion from "../components/forms/Fundamentacion";
import Diagnostico from "../components/forms/Diagnostico";
import Objetivos from "../components/forms/Objetivos";
import Resultados from "../components/forms/Resultados";
import Actividades from "../components/forms/Actividades";
import Cronograma from "../components/forms/Cronograma";
import Recursos from "../components/forms/Recursos";
import Financiamiento from "../components/forms/Financiamiento";

import { useFormRSU } from "../hooks/useFormRSU";
import { useNavigate } from 'react-router-dom';

export default function NuevoProyecto() {
  // Extraemos las funciones del hook (añadimos 'resetForm' o la función equivalente de tu hook si existe)
  const {
    step,
    highestStep,
    formData,
    pasosCompletados,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    handleCancelar,
    enviarProyectoBackend,
    resetForm // 2. Extrae la función de resetear del hook si la tiene
  } = useFormRSU();
  
  const navigate = useNavigate();

  // 3. EFECTO CRÍTICO: Al entrar a "Nuevo Proyecto", limpiamos todo rastro local y de estado
  useEffect(() => {
    // Limpiamos la caché física del formulario por si acaso (sólo si no estamos editando)
    // Pero NO podemos borrar el estado aquí porque destruimos los datos de EditarProyecto.jsx
    
    // Si tu hook useFormRSU exporta un método para volver al estado inicial, lo ejecutas aquí:
    if (resetForm) {
      // Evitar llamar resetForm incondicionalmente si estamos editando
    }
  }, []); // El arreglo vacío [] asegura que SOLO se ejecute UNA VEZ cuando entras a la pantalla

  // ACCIÓN BOTÓN CANCELAR: Guarda el avance actual como 'BORRADOR' en Django y redirige
  const handleCancelarYGuardarBorrador = async () => {
    if (!window.confirm("¿Deseas salir? Tu progreso se guardará automáticamente en el servidor como BORRADOR.")) return;
    
    const exito = await enviarProyectoBackend('BORRADOR');
    if (exito) {
      navigate('/proyectos'); 
    }
  };

  // ACCIÓN BOTÓN FINALIZAR: Guarda todo el proyecto como 'EN_REVISION' en Django y redirige
  const handleFinalizarYEnviar = async () => {
    const exito = await enviarProyectoBackend('EN_REVISION');
    if (exito) {
      navigate('/proyectos'); 
    }
  };

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
              onClick={handleCancelarYGuardarBorrador}
            >
              Cancelar
            </button>
          </div>

          <Stepper currentStep={step} pasosCompletados={pasosCompletados} goToStep={goToStep} />
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 min-h-[500px]">
            <div className="mt-6">
              {step === 1 && <DatosGenerales data={formData} updateData={updateData} />}
              {step === 2 && <Fundamentacion data={formData} updateData={updateData} />}
              {step === 3 && <Diagnostico data={formData} updateData={updateData} />}
              {step === 4 && <Objetivos data={formData} updateData={updateData} />}
              {step === 5 && <Resultados data={formData} updateData={updateData} />}
              {step === 6 && <Actividades data={formData} updateData={updateData} />}
              {step === 7 && <Cronograma data={formData} updateData={updateData} />}
              {step === 8 && <Recursos data={formData} updateData={updateData} />}
              {step === 9 && <Financiamiento data={formData} updateData={updateData} />}
            </div>
          </div>
        </div>

        <FormFooter
          step={step}
          nextStep={nextStep}
          prevStep={prevStep}
          enviarProyectoBackend={handleFinalizarYEnviar} 
          guardarBorrador={handleCancelarYGuardarBorrador}
        />
      </div>
    </div>
  );
}