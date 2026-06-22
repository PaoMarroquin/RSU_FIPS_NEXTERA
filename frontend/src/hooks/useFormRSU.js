import { useState, useEffect } from 'react';

const mockInitialData = {
  // Información Institucional
  facultad: '', escuela: '', departamento: '', semestre: '',
  asignaturas: '', titulo: '', numDocentes: null, numEstudiantes: null, lugar: '',

  // Beneficiarios (Booleanos)
  beneficiarios_comunidadInterna: false,
  beneficiarios_iebr: false,
  beneficiarios_iee: false,
  beneficiarios_gobLocal: false,
  beneficiarios_gobRegional: false,
  beneficiarios_gobNacional: false,
  beneficiarios_asociaciones: false,
  beneficiarios_orgComunales: false,
  beneficiarios_sectorEmpresarial: false,
  beneficiarios_sectoresLaborales: false,
  beneficiarios_centrosPenitenciarios: false,
  beneficiarios_otro: false,

  // Eje: Gestión (Booleanos)
  eje_gestion_admin: false,
  eje_gestion_academico: false,
  eje_gestion_iniciativas: false,
  eje_gestion_clima: false,
  eje_gestion_inclusion: false,
  eje_gestion_otro: false,

  // Eje: Formación (Booleanos)
  eje_formacion_etica: false,
  eje_formacion_anticorrupcion: false,
  eje_formacion_inclusion: false,
  eje_formacion_equidad: false,
  eje_formacion_ambiental: false,
  eje_formacion_ddhh: false,
  eje_formacion_ods: false,
  eje_formacion_otro: false,

  // Eje: Investigación (Booleanos)
  eje_investigacion_ods: false,
  eje_investigacion_salud: false,
  eje_investigacion_educacion: false,
  eje_investigacion_genero: false,
  eje_investigacion_inclusion: false,
  eje_investigacion_justicia: false,
  eje_investigacion_ciudadania: false,
  eje_investigacion_calidad: false,
  eje_investigacion_economia: false,
  eje_investigacion_ambiental: false,

  // Eje: Extensión (Booleanos)
  eje_extension_ods: false,
  eje_extension_salud: false,
  eje_extension_educacion: false,
  eje_extension_genero: false,
  eje_extension_inclusion: false,
  eje_extension_justicia: false,
  eje_extension_ciudadania: false,
  eje_extension_calidad: false,
  eje_extension_economia: false,
  eje_extension_ambiental: false,
  ambitoExtension: '',

  // Eje: Voluntariado (Booleanos)
  eje_voluntariado_iniciativas: false,
  ambitoVoluntariado: '',

  // Tipo de Actividad (Booleanos)
  actividad_formativos: false,
  actividad_acompanamiento: false,
  actividad_asesoria: false,
  actividad_acercamiento: false,
  actividad_otros: false,

  // Meta e Indicador
  meta: '', indicador: '',

  // Cronograma
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
  obj_general: '',
  obj_especificos: ['', '', ''],

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

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [formData, setFormData] = useState(mockInitialData);

  useEffect(() => {
    const draft = localStorage.getItem('rsu_draft');
    if (draft) {
      const parsedData = JSON.parse(draft);
      setFormData(parsedData);
      // Opcional: Si guardas el step en el draft, también podrías restaurarlo aquí
    }
  }, []);

  const saveDraft = (dataToSave) => {
    localStorage.setItem('rsu_draft', JSON.stringify(dataToSave));
  };

  const updateData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setStep(prev => {
      saveDraft(formData);
      const next = Math.min(prev + 1, 9);
      setHighestStep(currentMax => Math.max(currentMax, next)); // Actualiza el progreso máximo
      return next;
    });
  };

  const prevStep = () => {
    setStep(prev => {
      saveDraft(formData);
      return Math.max(prev - 1, 1);
    });
  };

  const goToStep = (targetStep) => {
    if (targetStep <= highestStep) {
      setStep(targetStep);
    }
  };

  const handleBorrador = () => {
    saveDraft(formData);
    alert("Borrador guardado exitosamente en LocalStorage");
  };

  return { step, highestStep, formData, updateData, nextStep, prevStep, goToStep, handleBorrador };
};