import { useState, useEffect } from 'react';

const mockInitialData = {
  // Paso 1: Datos Generales
  facultad: '', escuela: '', departamento: '', semestre: '',
  facultad_nombre: '', escuela_nombre: '', departamento_nombre: '', //Solo para ver
  asignaturas: '', titulo: '', numDocentes: null, numEstudiantes: null, lugar: '',
  beneficiarios: '', 
  eje_rsu: null, ejes_subitems: [], eje_detalle: "",
  tipoActividad: '',
  meta: '', indicador: '',
  fechaInicio: '', fechaEvaluacion: '', fechaTermino: '',
  encuestaDocentes: '', encuestaEstudiantes: '', encuestaDestinatarios: '',

  // Paso 2
  fund_razonGrupo: '',
  fund_proposito: '',
  fund_metodologia: '',

  // Paso 3
  diag_estadoActual: '',
  diag_problemas: '',
  diag_aportes: '',
  diag_justificacion: '',

  // Paso 4
  obj_lograrBeneficiario: '', 
  obj_mejorarCurricular: '',

  // Paso 5: Resultados
  res_beneficiario: '',
  res_curricular: '',

  // Paso 6: Actividades
  actividades: [
    {
      actividad: '',
      descripcion: '',
      curso: '',
      responsable: '',
      fecha: '',
      evidencia: '',
    }
  ],

  //Paso 7: Cronograma
  cronograma: [
    {
      accion: "",
      fechaInicio: "",
      fechaFin: "",
      responsable: "",
      estado: "Pendiente",
    }
  ],

  // Paso 8: Recursos
  recursos: {
    rec_hum_docentes: 0,
    rec_hum_administrativos: 0,
    rec_hum_estudiantes: 0,
    rec_hum_egresados: 0,
    rec_hum_voluntarios: 0,
    rec_hum_otros: 0,

    rec_mat_material_didactico: "",
    rec_mat_afiches: "",
    rec_mat_equipos: "",
    rec_mat_utiles: "",
    rec_mat_otros: "",
  },

  // Paso 9: Financiamiento
  financiamiento: {
    monto_financiamiento: "",
    fuente_financiamiento: "",
    descripcion_gastos: "",
    observaciones_financiamiento: "",
  },

};

const isTextValid = (value) => typeof value === 'string' && value.trim() !== '';
const isIdValid = (value) => value !== null && value !== '' && value !== 0;
const isNumberValid = (value) => value !== null && value >= 0;

const VALIDACIONES = {
  1: {
    facultad: (data) => isIdValid(data.facultad),
    escuela: (data) => isIdValid(data.escuela),
    departamento: (data) => isIdValid(data.departamento),
    semestre: (data) => isTextValid(data.semestre),
    asignaturas: (data) => isTextValid(data.asignaturas),
    titulo: (data) => isTextValid(data.titulo),
    beneficiarios: (data) => isTextValid(data.beneficiarios),
    numDocentes: (data) => isNumberValid(data.numDocentes),
    numEstudiantes: (data) => isNumberValid(data.numEstudiantes),
    eje_rsu: (data) => isIdValid(data.eje_rsu),
    meta: (data) => isTextValid(data.meta),
    indicador: (data) => isTextValid(data.indicador),
    fechaInicio: (data) => isTextValid(data.fechaInicio),
    fechaTermino: (data) => isTextValid(data.fechaTermino),
  },
  2: {
    fund_razonGrupo: (data) => isTextValid(data.fund_razonGrupo),
    fund_proposito: (data) => isTextValid(data.fund_proposito),
    fund_metodologia: (data) => isTextValid(data.fund_metodologia),
  }, 
  3: {
    diag_estadoActual: (data) => isTextValid(data.diag_estadoActual),
    diag_problemas: (data) => isTextValid(data.diag_problemas),
    diag_aportes: (data) => isTextValid(data.diag_aportes),
    diag_justificacion: (data) => isTextValid(data.diag_justificacion),
  },
  4: {
    obj_lograrBeneficiario: (data) => isTextValid(data.obj_lograrBeneficiario),
    obj_mejorarCurricular: (data) => isTextValid(data.obj_mejorarCurricular),
  },
  5: {},
  6: {},
  7: {},
  8: {},
  9: {},
};

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  
  // Inicialización perezosa: Carga el borrador del localStorage al instante si existe
  const [formData, setFormData] = useState(() => {
    try {
      const draft = localStorage.getItem('rsu_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        return { ...mockInitialData, ...parsedDraft };
      }
    } catch (error) {
      console.error("Error leyendo el borrador del LocalStorage:", error);
    }
    return mockInitialData;
  });

  // Guardado Automatico
  useEffect(() => {
    localStorage.setItem('rsu_draft', JSON.stringify(formData));
  }, [formData]);

  const updateData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Motor de Validación: Revisa si el paso cumple todas las reglas
  const isStepValid = (stepNumber) => {
    try {
      const reglas = VALIDACIONES[stepNumber];
      if (!reglas || Object.keys(reglas).length === 0) return false; 
      return Object.values(reglas).every(reglaFn => reglaFn(formData));
    } catch (error) {
      console.error("Error al validar el paso:", error);
      return false;
    }
  };

  // Obtenemos un arreglo con los números de todos los pasos que están 100% llenos
  const pasosCompletados = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(s => isStepValid(s));

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 9));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (targetStep) => {
    setStep(targetStep);
  };

  const handleBorrador = () => {
    alert("Borrador guardado exitosamente en el navegador.");
  };

  return { 
    step, 
    formData, 
    pasosCompletados, 
    updateData, 
    nextStep, 
    prevStep, 
    goToStep, 
    handleBorrador 
  };
};