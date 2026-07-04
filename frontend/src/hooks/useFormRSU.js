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
  resultado_en_beneficiarios: '',
  resultado_en_curriculo: '',

  // Paso 6: Actividades
  actividades: [],

  //Paso 7: Cronograma
  cronogramas: [],

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
  fuentes_financiamiento: [],
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
  5: {
      resultado_en_beneficiarios: (data) => isTextValid(data.resultado_en_beneficiarios),
      resultado_en_curriculo: (data) => isTextValid(data.resultado_en_curriculo),
    },
    6: {
      actividades: (data) => Array.isArray(data.actividades) && data.actividades.length > 0,
    },
    7: {
      cronogramas: (data) => 
        Array.isArray(data.cronogramas) && 
        data.cronogramas.length > 0 && 
        data.cronogramas.every(item => 
          item.descripcion?.trim() !== "" && 
          item.fecha_inicio !== "" && 
          item.fecha_fin !== "" &&
          item.fecha_fin >= item.fecha_inicio
        ),
    },
  8: {
      recursos: (data) => {
        if (!data.recursos) return false;
        const r = data.recursos;
        const totalEquipo = (parseInt(r.rec_hum_docentes, 10) || 0) + 
                            (parseInt(r.rec_hum_administrativos, 10) || 0) + 
                            (parseInt(r.rec_hum_estudiantes, 10) || 0) + 
                            (parseInt(r.rec_hum_egresados, 10) || 0) + 
                            (parseInt(r.rec_hum_voluntarios, 10) || 0) + 
                            (parseInt(r.rec_hum_otros, 10) || 0);
        const sinNegativos = [r.rec_hum_docentes, r.rec_hum_administrativos, r.rec_hum_estudiantes, r.rec_hum_egresados, r.rec_hum_voluntarios, r.rec_hum_otros].every(n => (parseInt(n, 10) || 0) >= 0);
        return sinNegativos && totalEquipo > 0;
      }
    },
    9: {
      // Validación básica opcional para el paso de Financiamiento si lo deseas
    fuentes_financiamiento: (data) => Array.isArray(data.fuentes_financiamiento) && data.fuentes_financiamiento.length > 0    },
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

    try {
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
        
        resultado_en_beneficiarios: formData.resultado_en_beneficiarios || "",
        resultado_en_curriculo: formData.resultado_en_curriculo || "",
        impacto_esperado: "",

        actividades: (formData.actividades || [])
          .filter(act => act.nombre && act.nombre.trim() !== "")
          .map((act, i) => ({
            nombre: act.nombre,
            descripcion: act.descripcion || "",
            curso_vinculado: "",
            responsable: act.responsable || "",
            fecha: act.fecha || null,
            evidencia_esperada: act.evidencia_esperada || "",
            orden: i + 1
          })),

        cronograma: (formData.cronogramas || [])
          .filter(crono => crono && crono.descripcion?.trim() !== "")
          .map((crono, i) => {
            // Diccionario local para traducir lo que venga del Formulario a lo que acepta Django
            const mapeoEstadosBackend = {
              "no iniciado": "pendiente",
              "pendiente": "pendiente",
              "en proceso": "en_proceso",
              "en_proceso": "en_proceso",
              "terminado": "finalizado",
              "finalizado": "finalizado"
            };

            // Sanitizamos el valor que viene de la interfaz para buscarlo sin problemas
            const estadoLimpio = (crono.estado_avance || "pendiente").toLowerCase().trim();
            
            // Si por alguna razón el texto no coincide, Django usará 'pendiente' por defecto
            const estadoValidoParaDjango = mapeoEstadosBackend[estadoLimpio] || "pendiente";

            return {
              descripcion: crono.descripcion, 
              fecha_inicio: crono.fecha_inicio || null,
              fecha_fin: crono.fecha_fin || null,
              responsable: crono.responsable || "",
              estado_avance: estadoValidoParaDjango, // ✅ Envía: 'pendiente', 'en_proceso' o 'finalizado'
              orden: i + 1
            };
          }),

        rec_hum_docentes: parseInt(formData.recursos?.rec_hum_docentes, 10) || 0,
        rec_hum_administrativos: parseInt(formData.recursos?.rec_hum_administrativos, 10) || 0,
        rec_hum_estudiantes: parseInt(formData.recursos?.rec_hum_estudiantes, 10) || 0,
        rec_hum_egresados: parseInt(formData.recursos?.rec_hum_egresados, 10) || 0,
        rec_hum_voluntarios: parseInt(formData.recursos?.rec_hum_voluntarios, 10) || 0,
        rec_hum_otros: parseInt(formData.recursos?.rec_hum_otros, 10) || 0,
        rec_mat_material_didactico: formData.recursos?.rec_mat_material_didactico || "",
        rec_mat_afiches: formData.recursos?.rec_mat_afiches || "",
        rec_mat_equipos: formData.recursos?.rec_mat_equipos || "",
        rec_mat_utiles: formData.recursos?.rec_mat_utiles || "",
        rec_mat_otros: formData.recursos?.rec_mat_otros || "",

        periodo: parseInt(formData.periodo, 10),
        anio_carrera: 5,
        es_tesis_quinto_anio: true,
        ods: (formData.ods && formData.ods.length > 0) ? formData.ods : [0],
        
        asignaturas: (formData.asignaturas || "").split(',').map(a => ({ nombre_asignatura: a.trim() })).filter(a => a.nombre_asignatura !== ""),
        docentes_adicionales: [],
        presentado_con_anticipacion: true,
        conclusiones: "",
        recomendaciones: "",
        lecciones_aprendidas: "",
        medio_difusion: "",
        documentos_sustento: []
      };

      // 3. Petición usando la instancia de axios 'api'
      let response;
      
      // Decidir si es Crear (POST) o Editar (PUT) basándonos en si existe un ID
      if (formData.id) {
        response = await api.put(`/api/v1/proyectos/${formData.id}/`, payload);
      } else {
        response = await api.post('/api/v1/proyectos/', payload);
      }

    const proyectoId = response.data.id;

      // ── GUARDADO SECUENCIAL DE FUENTES Y PARTIDAS ANIDADAS ──
      if (formData.fuentes_financiamiento && formData.fuentes_financiamiento.length > 0) {
        
        for (const fuente of formData.fuentes_financiamiento) {
          if (!fuente.fuente_financiamiento) continue; 

          const fuentePayload = {
            fuente: fuente.fuente_financiamiento,
            monto: parseFloat(fuente.monto_financiamiento) || 0,
            descripcion: fuente.descripcion_fuente || ""
          };

          let fuenteResponse;
          if (fuente.id) {
            fuenteResponse = await api.patch(
              `/api/v1/proyectos/${proyectoId}/financiamiento/${fuente.id}/`, 
              fuentePayload
            );
          } else {
            fuenteResponse = await api.post(
              `/api/v1/proyectos/${proyectoId}/financiamiento/`, 
              fuentePayload
            );
          }

          const fuenteIdAsignado = fuenteResponse.data.id; 

          if (fuente.partidas && fuente.partidas.length > 0) {
            for (const [index, partida] of fuente.partidas.entries()) {
              if (!partida.categoria || !partida.descripcion) continue; 
              
              // Categorías exactas que acepta el backend Django
              const mapaoCategorias = {
                "bienes": "material_escritorio",
                "material": "material_escritorio",
                "material_escritorio": "material_escritorio",
                "refrigerio": "refrigerio",
                "transporte": "transporte",
                "servicios": "otros",
                "materiales": "material_escritorio",
                "equipos": "otros",
                "otros": "otros",
                "financiero": "otros",
                "humano": "otros",
              };
              const catLimpia = (partida.categoria || "otros").toLowerCase().trim();
              const categoriaDefinitiva = mapaoCategorias[catLimpia] || "otros";
            

              const partidaPayload = {
                categoria: categoriaDefinitiva,
                tipo_recurso: partida.tipo_recurso || "material",
                descripcion: partida.descripcion,
                unidad: partida.unidad || "Unidad",
                cantidad: parseInt(partida.cantidad, 10) || 1,
                costo_unitario: parseFloat(partida.costo_unitario) || 0,
                fuente: fuenteIdAsignado, 
                orden: index + 1
              };

              if (partida.id) {
                await api.patch(
                  `/api/v1/proyectos/${proyectoId}/presupuesto/${partida.id}/`, 
                  partidaPayload
                );
              } else {
                await api.post(
                  `/api/v1/proyectos/${proyectoId}/presupuesto/`, 
                  partidaPayload
                );
              }
            }
          }
        }

        try {
          await api.post(`/api/v1/proyectos/${proyectoId}/presupuesto/confirmar/`);
          console.log("Presupuesto confirmado con éxito.");
        } catch (errorConfirmacion) {
          console.warn("Endpoint opcional de confirmación no ejecutado:", errorConfirmacion);
        }
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
        console.error("Respuesta detallada del servidor:", JSON.stringify(error.response.data, null, 2));

        const backendErrors = error.response.data || {};
        
        if (error.response.status === 403) {
          alert("Error 403 (Permiso Denegado): Tu usuario actual no tiene permisos de docente o administrador en el backend.");
        } else if (backendErrors.non_field_errors) {
          alert(`Restricción del sistema:\n${backendErrors.non_field_errors.join("\n")}`);
        } else if (backendErrors.detail) {
          alert(`Detalle del Servidor: ${backendErrors.detail}`);
        } else {
          alert(`Error ${error.response.status}: Revisa la consola para identificar el campo exacto que Django rechazó.`);
        }

      } else if (error instanceof Error) {
        alert(`Error en el formulario: ${error.message}. Por favor, revisa que todos los campos estén completos correctamente.`);
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