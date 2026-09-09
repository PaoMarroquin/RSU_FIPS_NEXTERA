import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

const mockInitialData = {
  id: null,
  // Paso 1: Datos Generales
  facultad: '', escuela: '', departamento: '', semestre: '',
  periodo: null, periodo_nombre: '',
  anio_carrera: null, es_tesis_quinto_anio: false,
  facultad_nombre: '', escuela_nombre: '', departamento_nombre: '', //Solo para ver
  asignaturas: '', titulo: '', numDocentes: null, numEstudiantes: null, lugar: '',
  beneficiarios: '', 
  eje_rsu: null, ejes_subitems: [], eje_detalle: "",
  tiposActividad: [],
  tipoActividadOtro: '',
  metas_indicadores: [],
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
    metas_indicadores: (data) => Array.isArray(data.metas_indicadores) && data.metas_indicadores.some(item => (item.meta_descripcion || '').trim() && (item.indicador_nombre || '').trim()),
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
      fuentes_financiamiento: (data) => Array.isArray(data.fuentes_financiamiento) && data.fuentes_financiamiento.length > 0
    },
};

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState(() => {
    try {
      const draft = localStorage.getItem('rsu_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        if (parsedDraft.tipoActividad !== undefined && parsedDraft.tiposActividad === undefined) {
          const MAPA_VIEJO = {
            "Programas formativos": "programas_formativos",
            "Acompañamiento a sectores identificados": "acompanamiento",
            "Asesoría": "asesoria",
            "Iniciativas de acercamiento a la comunidad": "acercamiento_comunidad",
          };
          const viejo = parsedDraft.tipoActividad;
          const codigoBackend = MAPA_VIEJO[viejo];
          parsedDraft.tiposActividad = codigoBackend ? [codigoBackend] : (viejo && viejo !== '__OTROS__' ? ['otro'] : []);
          parsedDraft.tipoActividadOtro = codigoBackend ? '' : (viejo && viejo !== '__OTROS__' ? viejo : '');
          delete parsedDraft.tipoActividad;
        }
        return { ...mockInitialData, ...parsedDraft };
      }
    } catch (error) {
      console.error("Error leyendo el borrador del LocalStorage:", error);
    }
    return mockInitialData;
  });

  useEffect(() => {
    localStorage.setItem('rsu_draft', JSON.stringify(formData));
  }, [formData]);

  const updateData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const pasosCompletados = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(s => isStepValid(s));

  const nextStep = () => setStep(prev => Math.min(prev + 1, 9));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const goToStep = (targetStep) => setStep(targetStep);

  const handleCancelar = () => {
    localStorage.removeItem('rsu_draft');
    navigate('/proyectos');
  };
  
  const enviarARevision = async (proyectoId) => {
    try {
      await proyectoApi.enviarARevision(proyectoId);
      return true;
    } catch (error) {
      console.error("Error al enviar a revisión:", error);
      if (error.response?.data?.detail) {
        showToast('error', error.response.data.detail);
      } else {
        showToast('error', "No se pudo enviar el proyecto a revisión.");
      }
      return false;
    }
  };

  const enviarProyectoBackend = async (modo = 'BORRADOR') => {
    const camposObligatorios = [
      formData.periodo,
      formData.facultad, formData.escuela, formData.departamento, 
      formData.titulo, formData.eje_rsu, formData.ods
    ];
    
    setIsSubmitting(true);

    try {
      const payload = {
        facultad: parseInt(formData.facultad, 10),
        escuela: parseInt(formData.escuela, 10),
        departamento: parseInt(formData.departamento, 10),
        semestre_academico: formData.semestre,
        titulo: formData.titulo,
        nro_docentes: Math.max(1, parseInt(formData.numDocentes, 10) || 1),
        nro_estudiantes: Math.max(0, parseInt(formData.numEstudiantes, 10) || 0),
        lugar_ejecucion: formData.lugar || "",
        beneficiarios: [], 
        benef_otro_detalle: formData.beneficiarios || "",
        eje_rsu: parseInt(formData.eje_rsu, 10),
        ejes_subitems: formData.ejes_subitems || [],
        eje_detalle: formData.eje_detalle || "",
        objetivo_institucional: null, 
        tipo_actividad: formData.tiposActividad || [],
        tipo_actividad_otro: formData.tipoActividadOtro || "",
        
        metas_indicadores: (formData.metas_indicadores || [])
          .filter(item => (item.meta_descripcion || '').trim() || (item.indicador_nombre || '').trim())
          .map(item => ({
            meta_descripcion: item.meta_descripcion || "",
            indicador_nombre: item.indicador_nombre || "",
            unidad_medida: item.unidad_medida || "",
            linea_base: item.linea_base === '' || item.linea_base === null ? null : Number(item.linea_base),
            valor_meta: item.valor_meta === '' || item.valor_meta === null ? null : Number(item.valor_meta),
            valor_alcanzado: item.valor_alcanzado === '' || item.valor_alcanzado === null ? null : Number(item.valor_alcanzado),
            metodo_verificacion: item.metodo_verificacion || "",
            fuente_verificacion: item.fuente_verificacion || "",
            orden: item.orden || 0,
          })),
        
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
            const mapeoEstadosBackend = {
              "no iniciado": "no_iniciado",
              "pendiente": "pendiente",
              "en proceso": "en_proceso",
              "en_proceso": "en_proceso",
              "terminado": "finalizado",
              "finalizado": "finalizado"
            };
            const estadoLimpio = (crono.estado_avance || "pendiente").toLowerCase().trim();
            const estadoValidoParaDjango = mapeoEstadosBackend[estadoLimpio] || "no_iniciado";

            return {
              descripcion: crono.descripcion, 
              fecha_inicio: crono.fecha_inicio || null,
              fecha_fin: crono.fecha_fin || null,
              responsable: crono.responsable || "",
              estado_avance: estadoValidoParaDjango,
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
        anio_carrera: formData.anio_carrera ? parseInt(formData.anio_carrera, 10) : null,
        es_tesis_quinto_anio: formData.es_tesis_quinto_anio || false,
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

      // ── CREAR O ACTUALIZAR PROYECTO USANDO EL API SERVICE ──
      let proyecto;
      if (formData.id) {
        proyecto = await proyectoApi.actualizarProyecto(formData.id, payload);
      } else {
        proyecto = await proyectoApi.crearProyecto(payload);
      }
      
      const proyectoId = proyecto.id;

      // ── GUARDADO SECUENCIAL DE FUENTES Y PARTIDAS ANIDADAS ──
      if (formData.fuentes_financiamiento && formData.fuentes_financiamiento.length > 0) {
        const erroresFinanciamiento = [];
        
        for (const [fIdx, fuente] of formData.fuentes_financiamiento.entries()) {
          if (!fuente.fuente_financiamiento) continue; 

          const fuentePayload = {
            fuente: fuente.fuente_financiamiento,
            monto: parseFloat(fuente.monto_financiamiento) || 0,
            descripcion: fuente.descripcion_fuente || ""
          };

          let fuenteIdAsignado;
          try {
            let fuenteResponse;
            if (fuente.id) {
              fuenteResponse = await proyectoApi.actualizarFuenteFinanciamiento(proyectoId, fuente.id, fuentePayload);
            } else {
              fuenteResponse = await proyectoApi.crearFuenteFinanciamiento(proyectoId, fuentePayload);
            }
            fuenteIdAsignado = fuenteResponse.id;
          } catch (fuenteErr) {
            const errData = fuenteErr.response?.data;
            const msg = errData?.detail || errData?.errors || JSON.stringify(errData);
            erroresFinanciamiento.push(`Fuente #${fIdx + 1}: ${msg}`);
            continue; 
          }

          if (fuente.partidas && fuente.partidas.length > 0) {
            for (const [pIdx, partida] of fuente.partidas.entries()) {
              if (!partida.descripcion || !partida.descripcion.trim()) continue; 
              
              const CATEGORIAS_VALIDAS = ["material_escritorio", "refrigerio", "transporte", "otros"];
              const categoriaDefinitiva = CATEGORIAS_VALIDAS.includes(partida.categoria) ? partida.categoria : "otros";

              const partidaPayload = {
                categoria: categoriaDefinitiva,
                tipo_recurso: partida.tipo_recurso || "material",
                descripcion: partida.descripcion,
                unidad: partida.unidad || "Unidad",
                cantidad: parseInt(partida.cantidad, 10) || 1,
                costo_unitario: parseFloat(partida.costo_unitario) || 0,
                fuente: fuenteIdAsignado, 
                orden: pIdx + 1
              };

              try {
                if (partida.id) {
                  await proyectoApi.actualizarPartidaPresupuestaria(proyectoId, partida.id, partidaPayload);
                } else {
                  await proyectoApi.crearPartidaPresupuestaria(proyectoId, partidaPayload);
                }
              } catch (partidaErr) {
                const errData = partidaErr.response?.data;
                const errMsg = errData?.errors 
                  ? Object.entries(errData.errors).map(([k,v]) => `${k}: ${v}`).join(', ')
                  : errData?.detail || JSON.stringify(errData);
                erroresFinanciamiento.push(`Fuente #${fIdx + 1}, Partida "${partida.descripcion}": ${errMsg}`);
              }
            }
          }
        }

        if (erroresFinanciamiento.length > 0) {
          console.warn("Errores parciales en financiamiento:", erroresFinanciamiento);
          showToast('error', `El proyecto se guardó, pero hubo errores en algunas partidas de financiamiento:\n${erroresFinanciamiento.join('\n')}`);
        }

        try {
          await proyectoApi.confirmarFinanciamiento(proyectoId);
          console.log("Presupuesto confirmado con éxito.");
        } catch (errorConfirmacion) {
          console.warn("Endpoint opcional de confirmación no ejecutado:", errorConfirmacion);
        }
      }

      console.log("Proyecto guardado exitosamente:", proyecto);

      if (modo === 'EN_REVISION') {
        try {
          await proyectoApi.enviarARevision(proyectoId);
          console.log("Proyecto enviado a revisión exitosamente.");
          showToast('success', 'Proyecto enviado a revisión correctamente. El Departamento lo revisará pronto.');
        } catch (errRevision) {
          console.error("Error al enviar a revisión:", errRevision);
          const data = errRevision.response?.data;
          let msg = data?.detail || errRevision.message;
          if (data?.errors) {
            const erroresFormateados = Object.entries(data.errors).map(([campo, err]) => `- ${err}`).join('\n');
            msg += `\n\nFaltan:\n${erroresFormateados}`;
          } else if (!data?.detail) {
            msg = JSON.stringify(data);
          }
          showToast('error', `El proyecto se guardó pero no se pudo enviar a revisión:\n${msg}`);
          return false;
        }
      }
      
      localStorage.removeItem('rsu_draft');
      navigate('/proyectos');
      return true;

    } catch (error) {
      console.error("Error al guardar el proyecto en el backend:", error);
      
      if (error.response) {
        console.error("Respuesta detallada del servidor:", JSON.stringify(error.response.data, null, 2));
        const backendErrors = error.response.data || {};
        
        if (error.response.status === 403) {
          showToast('error', "Error 403 (Permiso Denegado): Tu usuario actual no tiene permisos de docente o administrador en el backend.");
        } else if (backendErrors.non_field_errors) {
          showToast('error', `Restricción del sistema:\n${backendErrors.non_field_errors.join("\n")}`);
        } else if (backendErrors.detail) {
          let errStr = `Detalle del Servidor: ${backendErrors.detail}`;
          if (backendErrors.errors) {
            const errList = Object.entries(backendErrors.errors).map(([k, v]) => `- ${k}: ${v}`).join('\n');
            errStr += `\n${errList}`;
          }
          showToast('error', errStr);
        } else {
          const fieldErrors = Object.entries(backendErrors)
            .map(([field, errs]) => `- ${field}: ${Array.isArray(errs) ? errs.join(', ') : JSON.stringify(errs)}`)
            .join('\n');
          showToast('error', `Error ${error.response.status}: Error de validación al guardar:\n${fieldErrors}`);
        }
      } else if (error instanceof Error) {
        showToast('error', `Error en el formulario: ${error.message}. Por favor, revisa que todos los campos estén completos correctamente.`);
      } else {
        showToast('error', "Hubo un error al intentar conectarse al servidor.");
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
    enviarProyectoBackend,
    enviarARevision,
  };
};