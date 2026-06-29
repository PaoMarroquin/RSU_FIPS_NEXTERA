import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const mockInitialData = {
  id: null,
  // Paso 1: Datos Generales
  facultad: '', escuela: '', departamento: '', semestre: '',
  periodo: null, periodo_nombre: '',
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
  ods: [],

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
    periodo: (data) => isIdValid(data.periodo),
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
    ods: (data) => Array.isArray(data.ods) && data.ods.length > 0,
  },
  5: {},
  6: {},
  7: {},
  8: {},
  9: {},
};

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
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

  const handleCancelar = () => {
    localStorage.removeItem('rsu_draft');
    navigate('/proyectos');
  };

  // FUNCIÓN PARA ENVIAR AL ENDPOINT CON AXIOS
  const enviarProyectoBackend = async () => {
    // 1. Validar campos estrictamente obligatorios requeridos por el backend
    const camposObligatorios = [
      formData.facultad, formData.escuela, formData.departamento, 
      formData.semestre, formData.titulo, formData.eje_rsu, formData.ods
    ];
    
    // Verificamos que los IDs no sean nulos/cero y que los strings/arrays tengan contenido
    const cumpleObligatorios = camposObligatorios.every(campo => 
      campo !== null && campo !== '' && campo !== 0 && (Array.isArray(campo) ? campo.length > 0 : true)
    );

    if (!cumpleObligatorios) {
      console.error("Error: Faltan campos obligatorios (facultad, escuela, departamento, semestre_academico, titulo, eje_rsu, ods)");
      alert("Por favor, completa los campos obligatorios del Paso 1 y Paso 4 (ODS) antes de guardar.");
      return;
    }

    setIsSubmitting(true);

    // 2. Construir el payload con el parseo solicitado
    const payload = {
      facultad: parseInt(formData.facultad, 10),
      escuela: parseInt(formData.escuela, 10),
      departamento: parseInt(formData.departamento, 10),
      semestre_academico: formData.semestre,
      titulo: formData.titulo,
      nro_docentes: Math.max(1, parseInt(formData.numDocentes, 10) || 1), // Mínimo 1
      nro_estudiantes: Math.max(0, parseInt(formData.numEstudiantes, 10) || 0), // Mínimo 0
      lugar_ejecucion: formData.lugar || "",
      
      beneficiarios: [], // SOLO DEBERIA SER 1
      benef_otro_detalle: formData.beneficiarios || "",
      
      eje_rsu: parseInt(formData.eje_rsu, 10),
      ejes_subitems: formData.ejes_subitems || [],
      eje_detalle: formData.eje_detalle || "",
      
      objetivo_institucional: null, 
      tipo_actividad: [],
      tipo_actividad_otro: formData.tipoActividad || "",
      
      meta_cuantitativa: formData.meta || "",
      indicador: formData.indicador || "",
      
      // Control de fechas vacías (mandar null si están vacías para evitar errores 400 del backend)
      fecha_inicio: formData.fechaInicio || null,
      fecha_evaluacion_avance: formData.fechaEvaluacion || null,
      fecha_termino: formData.fechaTermino || null,
      fecha_encuesta_docentes: formData.encuestaDocentes || null,
      fecha_encuesta_alumnos: formData.encuestaEstudiantes || null,
      fecha_encuesta_grupo_destinatario: formData.encuestaDestinatarios || null,

      fund_por_que_grupo: formData.fund_razonGrupo || "",
      fund_para_que_proyecto: formData.fund_proposito || "",
      fund_mecanismo_ensenanza: formData.fund_metodologia || "",

      diag_estado_grupo: formData.diag_estadoActual || "",
      diag_problemas_detectados: formData.diag_problemas || "",
      diag_aportes_formacion: formData.diag_aportes || "",
      diag_justificacion_intervencion: formData.diag_justificacion || "",

      obj_logro_intervencion: formData.obj_lograrBeneficiario || "",
      obj_mejora_curricular: formData.obj_mejorarCurricular || "",
      
      resultado_en_beneficiarios: formData.res_beneficiario || "",
      resultado_en_curriculo: formData.res_curricular || "",
      impacto_esperado: "",

      actividades: formData.actividades
        .filter(act => act.actividad && act.actividad.trim() !== "")
        .map((act, i) => ({
          nombre: act.actividad,
          descripcion: act.descripcion || "",
          curso_vinculado: act.curso || "",
          responsable: act.responsable || "",
          fecha: act.fecha || null,
          evidencia_esperada: act.evidencia || "",
          orden: i + 1
        })),

      cronograma: formData.cronograma
        .filter(crono => crono.accion && crono.accion.trim() !== "")
        .map((crono, i) => ({
          descripcion: crono.accion,
          fecha_inicio: crono.fechaInicio || null,
          fecha_fin: crono.fechaFin || null,
          responsable: crono.responsable || "",
          estado_avance: (crono.estado || "pendiente").toLowerCase(), // "Pendiente" -> "pendiente"
          orden: i + 1
        })),

      rec_hum_docentes: parseInt(formData.recursos.rec_hum_docentes, 10) || 0,
      rec_hum_administrativos: parseInt(formData.recursos.rec_hum_administrativos, 10) || 0,
      rec_hum_estudiantes: parseInt(formData.recursos.rec_hum_estudiantes, 10) || 0,
      rec_hum_egresados: parseInt(formData.recursos.rec_hum_egresados, 10) || 0,
      rec_hum_voluntarios: parseInt(formData.recursos.rec_hum_voluntarios, 10) || 0,
      rec_hum_otros: parseInt(formData.recursos.rec_hum_otros, 10) || 0,
      rec_mat_material_didactico: formData.recursos.rec_mat_material_didactico || "",
      rec_mat_afiches: formData.recursos.rec_mat_afiches || "",
      rec_mat_equipos: formData.recursos.rec_mat_equipos || "",
      rec_mat_utiles: formData.recursos.rec_mat_utiles || "",
      rec_mat_otros: formData.recursos.rec_mat_otros || "",

      monto_financiamiento: formData.financiamiento.monto_financiamiento || "",
      fuente_financiamiento: formData.financiamiento.fuente_financiamiento || "",
      descripcion_gastos: formData.financiamiento.descripcion_gastos || "",
      observaciones_financiamiento: formData.financiamiento.observaciones_financiamiento || "",

      periodo: parseInt(formData.periodo, 10),
      anio_carrera: 5,
      es_tesis_quinto_anio: true,
      ods: formData.ods.length > 0 ? formData.ods : [0],
      
      asignaturas: [],
      docentes_adicionales: [],
      presentado_con_anticipacion: true,
      conclusiones: "",
      recomendaciones: "",
      lecciones_aprendidas: "",
      medio_difusion: "",
      documentos_sustento: []
    };

    try {
      // 3. Petición usando la instancia de axios 'api'
      let response;
      
      // Decidir si es Crear (POST) o Editar (PUT) basándonos en si existe un ID
      if (formData.id) {
        response = await api.put(`/api/v1/proyectos/${formData.id}/`, payload);
      } else {
        response = await api.post('/api/v1/proyectos/', payload);
      }

      console.log("Proyecto guardado exitosamente:", response.data);
      
      // Limpiamos el localStorage ya que se guardó en el servidor
      localStorage.removeItem('rsu_draft');
      
      // Redirigimos a la bandeja de proyectos
      navigate('/proyectos');

    } catch (error) {
      console.error("Error al guardar el proyecto en el backend:", error);
      
      // Capturamos la respuesta del backend para ver validaciones específicas si falla
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        alert(`Error al guardar: Revisa la consola para más detalles sobre los datos enviados.`);
      } else {
        alert("Hubo un error al intentar conectarse al servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    step, 
    formData, 
    pasosCompletados, 
    isSubmitting,
    updateData, 
    nextStep, 
    prevStep, 
    goToStep, 
    handleCancelar,
    enviarProyectoBackend
  };
};