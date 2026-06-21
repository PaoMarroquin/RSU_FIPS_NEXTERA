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
  encuestaDocentes: '', encuestaEstudiantes: '', encuestaDestinatarios: ''
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