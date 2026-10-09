import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

const mockInitialData = {
  id: null,

  // Paso 1: Datos generales
  facultad: '',
  escuela: '',
  departamento: '',
  semestre: '',
  periodo: null,
  periodo_nombre: '',
  anio_carrera: null,
  es_tesis_quinto_anio: false,
  facultad_nombre: '',
  escuela_nombre: '',
  departamento_nombre: '',
  asignaturas: '',
  titulo: '',
  numDocentes: null,
  docentesParticipantes: [],
  numEstudiantes: null,
  lugar: '',
  beneficiarios: '',
  ejes_rsu: [],
  ejes_subitems: [],
  eje_detalle: '',
  tiposActividad: [],
  tipoActividadOtro: '',
  metas_indicadores: [],
  fechaInicio: '',
  fechaEvaluacion: '',
  fechaTermino: '',
  encuestaDocentes: '',
  encuestaEstudiantes: '',
  encuestaDestinatarios: '',

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

  // Paso 5
  resultado_en_beneficiarios: '',
  resultado_en_curriculo: '',

  // Paso 6
  actividades: [],

  // Paso 7
  cronogramas: [],

  // Paso 8
  recursos: {
    rec_hum_docentes: 0,
    rec_hum_administrativos: 0,
    rec_hum_estudiantes: 0,
    rec_hum_egresados: 0,
    rec_hum_voluntarios: 0,
    rec_hum_otros: 0,
    rec_mat_material_didactico: '',
    rec_mat_afiches: '',
    rec_mat_equipos: '',
    rec_mat_utiles: '',
    rec_mat_otros: '',
  },

  // Paso 9
  fuentes_financiamiento: [],
};

const isTextValid = (value) =>
  typeof value === 'string' && value.trim() !== '';

const isIdValid = (value) =>
  value !== null && value !== undefined && value !== '' &&
  Number(value) !== 0;

const isNumberValid = (value) =>
  value !== null && value !== undefined && value !== '' &&
  Number.isFinite(Number(value)) && Number(value) >= 0;

const VALIDACIONES = {
  1: {
    periodo: (data) => isIdValid(data.periodo),
    facultad: (data) => isIdValid(data.facultad),
    escuela: (data) => isIdValid(data.escuela),
    departamento: (data) => isIdValid(data.departamento),
    asignaturas: (data) => isTextValid(data.asignaturas),
    titulo: (data) => isTextValid(data.titulo),
    beneficiarios: (data) => isTextValid(data.beneficiarios),
    numDocentes: (data) => isNumberValid(data.numDocentes),
    numEstudiantes: (data) => isNumberValid(data.numEstudiantes),

    ejes_rsu: (data) =>
      (Array.isArray(data.ejes_rsu) && data.ejes_rsu.length > 0) ||
      (Array.isArray(data.ejes_subitems) &&
        data.ejes_subitems.length > 0),

    metas_indicadores: (data) =>
      Array.isArray(data.metas_indicadores) &&
      data.metas_indicadores.some(
        (item) =>
          (item.meta_descripcion || '').trim() &&
          (item.indicador_nombre || '').trim()
      ),

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
    diag_justificacion: (data) =>
      isTextValid(data.diag_justificacion),
  },

  4: {
    obj_lograrBeneficiario: (data) =>
      isTextValid(data.obj_lograrBeneficiario),
    obj_mejorarCurricular: (data) =>
      isTextValid(data.obj_mejorarCurricular),
    ods: (data) => Array.isArray(data.ods) && data.ods.length > 0,
  },

  5: {
    resultado_en_beneficiarios: (data) =>
      isTextValid(data.resultado_en_beneficiarios),
    resultado_en_curriculo: (data) =>
      isTextValid(data.resultado_en_curriculo),
  },

  6: {
    actividades: (data) =>
      Array.isArray(data.actividades) &&
      data.actividades.length > 0 &&
      data.actividades.every(
        (item) =>
          item.nombre?.trim() !== '' &&
          item.descripcion?.trim() !== ''
      ),
  },

  7: {
    cronogramas: (data) => {
      const actividades = data.actividades || [];
      const cronogramas = data.cronogramas || [];

      if (actividades.length === 0 || cronogramas.length === 0) {
        return false;
      }

      // Se conserva el índice original de cada actividad.
      return actividades.every((actividad, indiceOriginal) => {
        if (
          !actividad.nombre?.trim() ||
          !actividad.descripcion?.trim()
        ) {
          return false;
        }

        const identificadorActividad =
          actividad.id ?? indiceOriginal;

        const acciones = cronogramas.filter(
          (accion) =>
            accion &&
            String(accion.actividad_id) ===
              String(identificadorActividad)
        );

        return (
          acciones.length > 0 &&
          acciones.every(
            (accion) =>
              accion.descripcion?.trim() &&
              accion.fecha_inicio &&
              accion.fecha_fin &&
              accion.fecha_fin >= accion.fecha_inicio &&
              accion.responsable?.trim() &&
              accion.evidencia_esperada?.trim()
          )
        );
      });
    },
  },

  8: {
    recursos: (data) => {
      if (!data.recursos) return false;

      const recursos = data.recursos;

      const camposHumanos = [
        'rec_hum_docentes',
        'rec_hum_administrativos',
        'rec_hum_estudiantes',
        'rec_hum_egresados',
        'rec_hum_voluntarios',
        'rec_hum_otros',
      ];

      const totalEquipo = camposHumanos.reduce(
        (total, campo) =>
          total + (parseInt(recursos[campo], 10) || 0),
        0
      );

      const sinNegativos = camposHumanos.every(
        (campo) => (parseInt(recursos[campo], 10) || 0) >= 0
      );

      return sinNegativos && totalEquipo > 0;
    },
  },

  9: {
    fuentes_financiamiento: (data) =>
      Array.isArray(data.fuentes_financiamiento) &&
      data.fuentes_financiamiento.length > 0,
  },
};

const normalizarAccion = (accion, orden) => ({
  descripcion: (accion.descripcion || '').trim(),
  fecha_inicio: accion.fecha_inicio || null,
  fecha_fin: accion.fecha_fin || null,
  responsable: (accion.responsable || '').trim(),
  evidencia_esperada: (accion.evidencia_esperada || '').trim(),
  estado_avance: accion.estado_avance || 'no_iniciado',
  orden,
});

const construirActividades = (formData) => {
  const actividadesOriginales = Array.isArray(formData.actividades)
    ? formData.actividades
    : [];

  const cronogramas = Array.isArray(formData.cronogramas)
    ? formData.cronogramas
    : [];

  return actividadesOriginales
    .map((actividad, indiceOriginal) => {
      const identificadorActividad =
        actividad.id ?? indiceOriginal;

      const acciones = cronogramas
        .filter(
          (accion) =>
            accion &&
            String(accion.actividad_id) ===
              String(identificadorActividad) &&
            accion.descripcion?.trim()
        )
        .map((accion, indiceAccion) =>
          normalizarAccion(accion, indiceAccion + 1)
        );

      return {
        nombre: (actividad.nombre || '').trim(),
        descripcion: (actividad.descripcion || '').trim(),
        orden: actividad.orden || indiceOriginal + 1,
        acciones,
      };
    })
    .filter((actividad) => actividad.nombre !== '');
};

const construirPayload = (formData) => {
  const actividades = construirActividades(formData);
  const recursos = formData.recursos || {};

  return {
    facultad: parseInt(formData.facultad, 10),
    escuela: parseInt(formData.escuela, 10),
    departamento: parseInt(formData.departamento, 10),

    semestre_academico: formData.periodo_nombre || '',
    periodo: parseInt(formData.periodo, 10),

    anio_carrera: formData.anio_carrera
      ? parseInt(formData.anio_carrera, 10)
      : null,

    es_tesis_quinto_anio:
      Boolean(formData.es_tesis_quinto_anio),

    titulo: (formData.titulo || '').trim(),

    nro_docentes: Math.max(
      0,
      parseInt(formData.numDocentes, 10) || 0
    ),

    docentes_participantes: Array.isArray(
      formData.docentesParticipantes
    )
      ? formData.docentesParticipantes
          .map((nombre) => String(nombre).trim())
          .filter(Boolean)
      : [],

    ods: (formData.ods || [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0),

    lugar_ejecucion: formData.lugar || '',
    beneficiarios: [],
    benef_otro_detalle: formData.beneficiarios || '',

    ejes_rsu: formData.ejes_rsu || [],
    ejes_subitems: formData.ejes_subitems || [],
    eje_detalle: formData.eje_detalle || '',

    objetivo_institucional: null,

    tipo_actividad: formData.tiposActividad || [],
    tipo_actividad_otro: formData.tipoActividadOtro || '',

    metas_indicadores: (formData.metas_indicadores || [])
      .filter(
        (item) =>
          (item.meta_descripcion || '').trim() ||
          (item.indicador_nombre || '').trim()
      )
      .map((item, indice) => ({
        meta_descripcion: item.meta_descripcion || '',
        indicador_nombre: item.indicador_nombre || '',
        unidad_medida: item.unidad_medida || '',
        linea_base:
          item.linea_base === '' || item.linea_base == null
            ? null
            : Number(item.linea_base),
        valor_meta:
          item.valor_meta === '' || item.valor_meta == null
            ? null
            : Number(item.valor_meta),
        valor_alcanzado:
          item.valor_alcanzado === '' ||
          item.valor_alcanzado == null
            ? null
            : Number(item.valor_alcanzado),
        metodo_verificacion: item.metodo_verificacion || '',
        fuente_verificacion: item.fuente_verificacion || '',
        orden: item.orden || indice + 1,
      })),

    fecha_inicio: formData.fechaInicio || null,
    fecha_evaluacion_avance: formData.fechaEvaluacion || null,
    fecha_termino: formData.fechaTermino || null,

    fecha_encuesta_docentes: formData.encuestaDocentes || null,
    fecha_encuesta_alumnos: formData.encuestaEstudiantes || null,
    fecha_encuesta_grupo_destinatario:
      formData.encuestaDestinatarios || null,

    fund_por_que_grupo: formData.fund_razonGrupo || '',
    fund_para_que_proyecto: formData.fund_proposito || '',
    fund_mecanismo_ensenanza: formData.fund_metodologia || '',

    diag_estado_grupo: formData.diag_estadoActual || '',
    diag_problemas_detectados: formData.diag_problemas || '',
    diag_aportes_formacion: formData.diag_aportes || '',
    diag_justificacion_intervencion:
      formData.diag_justificacion || '',

    obj_logro_intervencion: formData.obj_lograrBeneficiario || '',
    obj_mejora_curricular: formData.obj_mejorarCurricular || '',

    resultado_en_beneficiarios:
      formData.resultado_en_beneficiarios || '',
    resultado_en_curriculo:
      formData.resultado_en_curriculo || '',

    impacto_esperado: '',

    // IMPORTANTE:
    // Las acciones se envían anidadas dentro de cada actividad.
    // No se agrega un campo raíz "cronograma".
    actividades,

    rec_hum_docentes:
      parseInt(recursos.rec_hum_docentes, 10) || 0,
    rec_hum_administrativos:
      parseInt(recursos.rec_hum_administrativos, 10) || 0,
    rec_hum_estudiantes:
      parseInt(recursos.rec_hum_estudiantes, 10) || 0,
    rec_hum_egresados:
      parseInt(recursos.rec_hum_egresados, 10) || 0,
    rec_hum_voluntarios:
      parseInt(recursos.rec_hum_voluntarios, 10) || 0,
    rec_hum_otros:
      parseInt(recursos.rec_hum_otros, 10) || 0,

    rec_mat_material_didactico:
      recursos.rec_mat_material_didactico || 'n/a',
    rec_mat_afiches: recursos.rec_mat_afiches || 'n/a',
    rec_mat_equipos: recursos.rec_mat_equipos || 'n/a',
    rec_mat_utiles: recursos.rec_mat_utiles || 'n/a',
    rec_mat_otros: recursos.rec_mat_otros || 'n/a',

    asignaturas: (formData.asignaturas || '')
      .split(',')
      .map((asignatura) => ({
        nombre_asignatura: asignatura.trim(),
      }))
      .filter((asignatura) => asignatura.nombre_asignatura),

    docentes_adicionales: [],
    presentado_con_anticipacion: true,
    conclusiones: '',
    recomendaciones: '',
    lecciones_aprendidas: '',
    medio_difusion: '',
    documentos_sustento: [],
  };
};

const obtenerMensajeError = (error) => {
  const data = error?.response?.data;

  if (!data) return error?.message || 'Error desconocido';

  if (typeof data === 'string') return data;

  return JSON.stringify(data);
};

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(() => {
    try {
      const draft = localStorage.getItem('rsu_draft');

      if (draft) {
        const parsedDraft = JSON.parse(draft);

        if (
          parsedDraft.tipoActividad !== undefined &&
          parsedDraft.tiposActividad === undefined
        ) {
          const MAPA_VIEJO = {
            'Programas formativos': 'programas_formativos',
            'Acompañamiento a sectores identificados':
              'acompanamiento',
            Asesoría: 'asesoria',
            'Iniciativas de acercamiento a la comunidad':
              'acercamiento_comunidad',
          };

          const viejo = parsedDraft.tipoActividad;
          const codigoBackend = MAPA_VIEJO[viejo];

          parsedDraft.tiposActividad = codigoBackend
            ? [codigoBackend]
            : viejo && viejo !== '__OTROS__'
              ? ['otro']
              : [];

          parsedDraft.tipoActividadOtro = codigoBackend
            ? ''
            : viejo && viejo !== '__OTROS__'
              ? viejo
              : '';

          delete parsedDraft.tipoActividad;
        }

        return {
          ...mockInitialData,
          ...parsedDraft,
          recursos: {
            ...mockInitialData.recursos,
            ...(parsedDraft.recursos || {}),
          },
        };
      }
    } catch (error) {
      console.error(
        'Error leyendo el borrador del LocalStorage:',
        error
      );
    }

    return mockInitialData;
  });

  useEffect(() => {
    localStorage.setItem('rsu_draft', JSON.stringify(formData));
  }, [formData]);

  const updateData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isStepValid = (stepNumber) => {
    try {
      const reglas = VALIDACIONES[stepNumber];

      if (!reglas) return false;

      return Object.values(reglas).every((regla) =>
        regla(formData)
      );
    } catch (error) {
      console.error('Error al validar el paso:', error);
      return false;
    }
  };

  const pasosCompletados = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (numeroPaso) => isStepValid(numeroPaso)
  );

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, 9));

  const prevStep = () =>
    setStep((prev) => Math.max(prev - 1, 1));

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
      console.error('Error al enviar a revisión:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      showToast(
        'error',
        `El proyecto se guardó, pero no se pudo enviar a revisión: ${obtenerMensajeError(error)}`
      );

      return false;
    }
  };

  const enviarProyectoBackend = async (modo = 'BORRADOR') => {
    if (isSubmittingRef.current) return false;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = construirPayload(formData);

      console.log(
        'PAYLOAD ENVIADO AL BACKEND:',
        JSON.stringify(payload, null, 2)
      );

      console.log(
        'ACCIONES ANIDADAS POR ACTIVIDAD:',
        JSON.stringify(payload.actividades, null, 2)
      );

      // Crear o actualizar el proyecto con el endpoint existente.
      let proyecto;

      if (formData.id) {
        proyecto = await proyectoApi.actualizarProyecto(
          formData.id,
          payload
        );
      } else {
        proyecto = await proyectoApi.crearProyecto(payload);
      }

      const proyectoId = proyecto?.id;

      if (!proyectoId) {
        throw new Error(
          'El backend no devolvió el ID del proyecto guardado.'
        );
      }

      // Guardar las fuentes y partidas usando los endpoints existentes.
      // Un error del presupuesto no debe impedir guardar el borrador.
      const fuentes = Array.isArray(formData.fuentes_financiamiento)
        ? formData.fuentes_financiamiento
        : [];

      if (fuentes.length > 0) {
        const erroresFinanciamiento = [];

        for (const [indiceFuente, fuente] of fuentes.entries()) {
          if (!fuente.fuente_financiamiento) continue;

          const fuentePayload = {
            fuente: fuente.fuente_financiamiento,
            monto: parseFloat(fuente.monto_financiamiento) || 0,
            descripcion: fuente.descripcion_fuente || '',
          };

          let fuenteIdAsignado;

          try {
            const respuestaFuente = fuente.id
              ? await proyectoApi.actualizarFuenteFinanciamiento(
                  proyectoId,
                  fuente.id,
                  fuentePayload
                )
              : await proyectoApi.crearFuenteFinanciamiento(
                  proyectoId,
                  fuentePayload
                );

            fuenteIdAsignado = respuestaFuente?.id;
          } catch (errorFuente) {
            erroresFinanciamiento.push(
              `Fuente #${indiceFuente + 1}: ${obtenerMensajeError(errorFuente)}`
            );
            continue;
          }

          const partidas = Array.isArray(fuente.partidas)
            ? fuente.partidas
            : [];

          for (const [indicePartida, partida] of partidas.entries()) {
            if (!partida.descripcion?.trim()) continue;

            const categoriasValidas = [
              'material_escritorio',
              'refrigerio',
              'transporte',
              'otros',
            ];

            const partidaPayload = {
              categoria: categoriasValidas.includes(partida.categoria)
                ? partida.categoria
                : 'otros',
              tipo_recurso: partida.tipo_recurso || 'material',
              descripcion: partida.descripcion.trim(),
              unidad: partida.unidad || 'Unidad',
              cantidad: parseInt(partida.cantidad, 10) || 1,
              costo_unitario:
                parseFloat(partida.costo_unitario) || 0,
              fuente: fuenteIdAsignado,
              orden: indicePartida + 1,
            };

            try {
              if (partida.id) {
                await proyectoApi.actualizarPartidaPresupuestaria(
                  proyectoId,
                  partida.id,
                  partidaPayload
                );
              } else {
                await proyectoApi.crearPartidaPresupuestaria(
                  proyectoId,
                  partidaPayload
                );
              }
            } catch (errorPartida) {
              erroresFinanciamiento.push(
                `Fuente #${indiceFuente + 1}, partida "${partida.descripcion}": ${obtenerMensajeError(errorPartida)}`
              );
            }
          }
        }

        if (erroresFinanciamiento.length > 0) {
          console.warn(
            'Errores en el financiamiento:',
            erroresFinanciamiento
          );

          showToast(
            'error',
            `El proyecto se guardó, pero hubo errores en el financiamiento: ${erroresFinanciamiento.join(' | ')}`
          );
        }

        // La confirmación del presupuesto es independiente.
        // Si requiere firma digital, el proyecto puede seguir guardado
        // como borrador, pero el presupuesto no quedará confirmado.
        try {
          await proyectoApi.confirmarFinanciamiento(proyectoId);
          console.log('Presupuesto confirmado correctamente.');
        } catch (errorConfirmacion) {
          console.warn(
            'No se pudo confirmar el financiamiento:',
            errorConfirmacion.response?.data ||
              errorConfirmacion.message
          );
        }
      }

      console.log('Proyecto guardado:', proyecto);

      // Enviar a revisión únicamente cuando se haya solicitado.
      if (modo === 'EN_REVISION') {
        const enviado = await enviarARevision(proyectoId);

        if (!enviado) {
          // Se conserva el ID para poder volver a editar el proyecto.
          setFormData((prev) => ({
            ...prev,
            id: proyectoId,
          }));

          return false;
        }

        showToast(
          'success',
          'Proyecto enviado a revisión correctamente. El Departamento lo revisará pronto.'
        );
      } else {
        showToast(
          'success',
          'Proyecto guardado como borrador correctamente.'
        );
      }

      localStorage.removeItem('rsu_draft');
      navigate('/proyectos');

      return true;
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);

      const status = error.response?.status;
      const backendErrors = error.response?.data || {};

      if (status === 403) {
        showToast(
          'error',
          'Error 403: tu usuario no tiene permisos para realizar esta operación.'
        );
        return false;
      }

      if (backendErrors.errors) {
        const mensajes = Object.entries(backendErrors.errors)
          .flatMap(([campo, errores]) =>
            Array.isArray(errores)
              ? errores.map((mensaje) => `${campo}: ${mensaje}`)
              : [`${campo}: ${errores}`]
          )
          .join(' | ');

        showToast('error', mensajes);
        return false;
      }

      if (backendErrors.non_field_errors) {
        showToast(
          'error',
          backendErrors.non_field_errors.join(' | ')
        );
        return false;
      }

      if (backendErrors.detail) {
        showToast('error', backendErrors.detail);
        return false;
      }

      if (error.response) {
        showToast(
          'error',
          `Error del backend (${status || 'sin estado'}): ${obtenerMensajeError(error)}`
        );
        return false;
      }

      showToast(
        'error',
        `Error al guardar el formulario: ${error.message || 'No se pudo conectar con el servidor.'}`
      );

      return false;
    } finally {
      isSubmittingRef.current = false;
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
