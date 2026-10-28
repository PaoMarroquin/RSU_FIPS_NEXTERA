
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

// =====================================================
// DATOS INICIALES
// =====================================================

const mockInitialData = {
  id: null,

  // Paso I: Datos generales
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

  // Beneficiarios: IDs del catálogo.
  beneficiarios: [],
  benef_otro_detalle: '',

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

  // Paso II
  fund_razonGrupo: '',
  fund_proposito: '',
  fund_metodologia: '',

  // Paso III
  diag_estadoActual: '',
  diag_problemas: '',
  diag_aportes: '',
  diag_justificacion: '',

  // Paso IV
  obj_lograrBeneficiario: '',
  obj_mejorarCurricular: '',
  ods: [],

  // Paso V
  resultado_en_beneficiarios: '',
  resultado_en_curriculo: '',

  // Paso VI
  actividades: [],

  // Paso VII
  cronogramas: [],

  // Paso VIII
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

  // Paso IX
  fuentes_financiamiento: [],
};

const isTextValid = (value) =>
  typeof value === 'string' && value.trim() !== '';

const isIdValid = (value) =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number(value) !== 0;

const isNumberValid = (value) =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0;

// =====================================================
// VALIDACIONES
// =====================================================

const VALIDACIONES = {
  1: {
    periodo: (data) => isIdValid(data.periodo),
    facultad: (data) => isIdValid(data.facultad),
    escuela: (data) => isIdValid(data.escuela),
    departamento: (data) => isIdValid(data.departamento),
    asignaturas: (data) => isTextValid(data.asignaturas),
    titulo: (data) => isTextValid(data.titulo),

    beneficiarios: (data) =>
      Array.isArray(data.beneficiarios) &&
      data.beneficiarios.length > 0,

    numDocentes: (data) => isNumberValid(data.numDocentes),
    numEstudiantes: (data) => isNumberValid(data.numEstudiantes),

    ejes_rsu: (data) =>
      (Array.isArray(data.ejes_rsu) &&
        data.ejes_rsu.length > 0) ||
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
    fund_razonGrupo: (data) =>
      isTextValid(data.fund_razonGrupo),
    fund_proposito: (data) =>
      isTextValid(data.fund_proposito),
    fund_metodologia: (data) =>
      isTextValid(data.fund_metodologia),
  },

  3: {
    diag_estadoActual: (data) =>
      isTextValid(data.diag_estadoActual),
    diag_problemas: (data) =>
      isTextValid(data.diag_problemas),
    diag_aportes: (data) =>
      isTextValid(data.diag_aportes),
    diag_justificacion: (data) =>
      isTextValid(data.diag_justificacion),
  },

  4: {
    obj_lograrBeneficiario: (data) =>
      isTextValid(data.obj_lograrBeneficiario),
    obj_mejorarCurricular: (data) =>
      isTextValid(data.obj_mejorarCurricular),
    ods: (data) =>
      Array.isArray(data.ods) && data.ods.length > 0,
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
          item.nombre?.trim() &&
          item.descripcion?.trim()
      ),
  },

  7: {
    cronogramas: (data) => {
      const actividades = data.actividades || [];
      const cronogramas = data.cronogramas || [];

      if (!actividades.length || !cronogramas.length) {
        return false;
      }

      return actividades.every((actividad, indice) => {
        if (
          !actividad.nombre?.trim() ||
          !actividad.descripcion?.trim()
        ) {
          return false;
        }

        const actividadId = actividad.id ?? indice;

        const acciones = cronogramas.filter(
          (accion) =>
            accion &&
            String(accion.actividad_id) ===
              String(actividadId)
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

      const campos = [
        'rec_hum_docentes',
        'rec_hum_administrativos',
        'rec_hum_estudiantes',
        'rec_hum_egresados',
        'rec_hum_voluntarios',
        'rec_hum_otros',
      ];

      const total = campos.reduce(
        (suma, campo) =>
          suma + (parseInt(data.recursos[campo], 10) || 0),
        0
      );

      const noNegativos = campos.every(
        (campo) =>
          (parseInt(data.recursos[campo], 10) || 0) >= 0
      );

      return noNegativos && total > 0;
    },
  },

  9: {
    fuentes_financiamiento: (data) =>
      Array.isArray(data.fuentes_financiamiento) &&
      data.fuentes_financiamiento.length > 0,
  },
};

// =====================================================
// CONSTRUCCIÓN DE ACTIVIDADES Y CRONOGRAMAS
// =====================================================

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
  const actividades = Array.isArray(formData.actividades)
    ? formData.actividades
    : [];

  const cronogramas = Array.isArray(formData.cronogramas)
    ? formData.cronogramas
    : [];

  return actividades
    .map((actividad, indice) => {
      const actividadId = actividad.id ?? indice;

      const acciones = cronogramas
        .filter(
          (accion) =>
            accion &&
            String(accion.actividad_id) ===
              String(actividadId) &&
            accion.descripcion?.trim()
        )
        .map((accion, indiceAccion) =>
          normalizarAccion(accion, indiceAccion + 1)
        );

      return {
        nombre: (actividad.nombre || '').trim(),
        descripcion: (actividad.descripcion || '').trim(),
        orden: actividad.orden || indice + 1,
        acciones,
      };
    })
    .filter((actividad) => actividad.nombre !== '');
};

// =====================================================
// CONSTRUIR PAYLOAD DEL PROYECTO
// =====================================================

const construirPayload = (formData) => {
  const actividades = construirActividades(formData);
  const recursos = formData.recursos || {};

  return {
    facultad: parseInt(formData.facultad, 10),
    escuela: parseInt(formData.escuela, 10),
    departamento: parseInt(formData.departamento, 10),

    semestre_academico: formData.periodo_nombre || '',
    periodo: parseInt(formData.periodo, 10),

    anio_carrera:
      formData.anio_carrera === '' ||
      formData.anio_carrera == null
        ? null
        : parseInt(formData.anio_carrera, 10),

    es_tesis_quinto_anio:
      Boolean(formData.es_tesis_quinto_anio),

    titulo: (formData.titulo || '').trim(),

    nro_docentes: Math.max(
      0,
      parseInt(formData.numDocentes, 10) || 0
    ),

    nro_estudiantes: Math.max(
      0,
      parseInt(formData.numEstudiantes, 10) || 0
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

    // Enviar IDs del catálogo, nunca un array fijo vacío.
    beneficiarios: Array.isArray(formData.beneficiarios)
      ? formData.beneficiarios
          .map((item) =>
            typeof item === 'object' && item !== null
              ? Number(item.id)
              : Number(item)
          )
          .filter((id) => Number.isInteger(id) && id > 0)
      : [],

    benef_otro_detalle: formData.benef_otro_detalle || '',

    ejes_rsu: formData.ejes_rsu || [],
    ejes_subitems: formData.ejes_subitems || [],
    eje_detalle: formData.eje_detalle || '',

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

    // Acciones anidadas dentro de cada actividad.
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
      .filter((item) => item.nombre_asignatura),

    // NO agregar aquí:
    // docentes_adicionales
    // objetivo_institucional
    // impacto_esperado
    // presentado_con_anticipacion
    // conclusiones
    // recomendaciones
    // lecciones_aprendidas
    // medio_difusion
    // documentos_sustento
  };
};

// =====================================================
// NORMALIZACIÓN DE BORRADORES ANTIGUOS
// =====================================================

const normalizarBorrador = (draft) => {
  const data = {
    ...mockInitialData,
    ...draft,
    recursos: {
      ...mockInitialData.recursos,
      ...(draft.recursos || {}),
    },
  };

  // Antes, beneficiarios podía ser texto libre.
  if (typeof draft.beneficiarios === 'string') {
    data.benef_otro_detalle =
      data.benef_otro_detalle || draft.beneficiarios;

    data.beneficiarios = [];
  } else if (!Array.isArray(data.beneficiarios)) {
    data.beneficiarios = [];
  }

  if (!Array.isArray(data.docentesParticipantes)) {
    data.docentesParticipantes = [];
  }

  if (!Array.isArray(data.ods)) data.ods = [];
  if (!Array.isArray(data.tiposActividad)) data.tiposActividad = [];

  // Migración de tipoActividad antiguo.
  if (
    draft.tipoActividad !== undefined &&
    draft.tiposActividad === undefined
  ) {
    const mapa = {
      'Programas formativos': 'programas_formativos',
      'Acompañamiento a sectores identificados': 'acompanamiento',
      Asesoría: 'asesoria',
      'Iniciativas de acercamiento a la comunidad':
        'acercamiento_comunidad',
    };

    const antiguo = draft.tipoActividad;
    const codigo = mapa[antiguo];

    data.tiposActividad = codigo
      ? [codigo]
      : antiguo && antiguo !== '__OTROS__'
        ? ['otro']
        : [];

    data.tipoActividadOtro = codigo
      ? ''
      : antiguo && antiguo !== '__OTROS__'
        ? antiguo
        : '';

    delete data.tipoActividad;
  }

  return data;
};

// =====================================================
// MANEJO DE ERRORES
// =====================================================

const obtenerMensajeError = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || 'Error desconocido.';
  }

  if (typeof data === 'string') {
    try {
      return obtenerMensajeError({
        response: { data: JSON.parse(data) },
      });
    } catch {
      return data;
    }
  }

  const errores = data.errors || data;
  const mensajes = [];

  const recorrer = (campo, valor) => {
    if (Array.isArray(valor)) {
      valor.forEach((item) => recorrer(campo, item));
      return;
    }

    if (valor && typeof valor === 'object') {
      Object.entries(valor).forEach(([subcampo, detalle]) =>
        recorrer(`${campo}.${subcampo}`, detalle)
      );
      return;
    }

    mensajes.push(`${campo}: ${String(valor)}`);
  };

  Object.entries(errores).forEach(([campo, valor]) => {
    recorrer(campo, valor);
  });

  return mensajes.length
    ? mensajes.join('\n')
    : 'No se pudo completar la operación.';
};

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export const useFormRSU = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  // Catálogo de beneficiarios.
  const [tiposBeneficiario, setTiposBeneficiario] = useState([]);
  const [cargandoBeneficiarios, setCargandoBeneficiarios] =
    useState(false);

  // Documentos de sustento del proyecto.
  const [documentosSustento, setDocumentosSustento] = useState([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);

  const [formData, setFormData] = useState(() => {
    try {
      const draft = localStorage.getItem('rsu_draft');

      if (draft) {
        return normalizarBorrador(JSON.parse(draft));
      }
    } catch (error) {
      console.error('Error leyendo borrador RSU:', error);
    }

    return { ...mockInitialData };
  });

  // Guardar borrador local.
  useEffect(() => {
    try {
      localStorage.setItem('rsu_draft', JSON.stringify(formData));
    } catch (error) {
      console.error('Error guardando borrador RSU:', error);
    }
  }, [formData]);

  // ---------------------------------------------------
  // ACTUALIZAR FORMULARIO
  // ---------------------------------------------------

  const updateData = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const actualizarBeneficiarios = useCallback((ids) => {
    const normalizados = [...new Set(
      (Array.isArray(ids) ? ids : [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    )];

    setFormData((prev) => ({
      ...prev,
      beneficiarios: normalizados,
    }));
  }, []);

  const alternarBeneficiario = useCallback((id, seleccionado) => {
    const beneficiarioId = Number(id);

    if (!Number.isInteger(beneficiarioId) || beneficiarioId <= 0) {
      return;
    }

    setFormData((prev) => {
      const actuales = Array.isArray(prev.beneficiarios)
        ? prev.beneficiarios.map(Number)
        : [];

      const siguientes = seleccionado
        ? [...new Set([...actuales, beneficiarioId])]
        : actuales.filter((actual) => actual !== beneficiarioId);

      return {
        ...prev,
        beneficiarios: siguientes,
      };
    });
  }, []);

  // ---------------------------------------------------
  // CATÁLOGO DE BENEFICIARIOS
  // ---------------------------------------------------

  const cargarTiposBeneficiario = useCallback(async () => {
    setCargandoBeneficiarios(true);

    try {
      const tipos = await proyectoApi.obtenerTiposBeneficiario();

      setTiposBeneficiario(
        Array.isArray(tipos) ? tipos : []
      );

      return tipos;
    } catch (error) {
      console.error('Error cargando beneficiarios:', error);

      showToast(
        'error',
        `No se pudo cargar el catálogo de beneficiarios: ${obtenerMensajeError(error)}`
      );

      return [];
    } finally {
      setCargandoBeneficiarios(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarTiposBeneficiario();
  }, [cargarTiposBeneficiario]);

  // ---------------------------------------------------
  // DOCUMENTOS DE SUSTENTO
  // ---------------------------------------------------

  const cargarDocumentosSustento = useCallback(async (proyectoId) => {
    if (!proyectoId) {
      setDocumentosSustento([]);
      return [];
    }

    setCargandoDocumentos(true);

    try {
      const respuesta =
        await proyectoApi.obtenerDocumentosSustento(proyectoId);

      const documentos = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.results || respuesta?.documentos || [];

      setDocumentosSustento(documentos);

      return documentos;
    } catch (error) {
      console.error('Error cargando documentos de sustento:', error);

      showToast(
        'error',
        `No se pudieron cargar los documentos: ${obtenerMensajeError(error)}`
      );

      return [];
    } finally {
      setCargandoDocumentos(false);
    }
  }, [showToast]);

  const subirDocumentoSustento = useCallback(async (
    archivo,
    nombre = ''
  ) => {
    const proyectoId = formData.id;

    if (!proyectoId) {
      showToast(
        'error',
        'Primero guarda el proyecto para obtener su ID antes de subir documentos.'
      );
      return false;
    }

    if (!archivo) {
      showToast('error', 'Selecciona un archivo.');
      return false;
    }

    const extensionesPermitidas = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
    ];

    const extension = archivo.name
      ?.split('.')
      .pop()
      ?.toLowerCase();

    if (!extensionesPermitidas.includes(extension)) {
      showToast(
        'error',
        'Formato no permitido. Usa PDF, DOC, DOCX, XLS o XLSX.'
      );
      return false;
    }

    const limiteBytes = 10 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      showToast(
        'error',
        'El archivo supera el límite permitido de 10 MB.'
      );
      return false;
    }

    setSubiendoDocumento(true);

    try {
      await proyectoApi.subirDocumentoSustento(
        proyectoId,
        archivo,
        nombre || archivo.name
      );

      await cargarDocumentosSustento(proyectoId);

      showToast('success', 'Documento de sustento subido correctamente.');

      return true;
    } catch (error) {
      console.error('Error subiendo documento:', error);

      showToast(
        'error',
        `No se pudo subir el documento: ${obtenerMensajeError(error)}`
      );

      return false;
    } finally {
      setSubiendoDocumento(false);
    }
  }, [
    formData.id,
    cargarDocumentosSustento,
    showToast,
  ]);

  const eliminarDocumentoSustento = useCallback(async (documentoId) => {
    const proyectoId = formData.id;

    if (!proyectoId || !documentoId) {
      showToast('error', 'No se pudo identificar el documento.');
      return false;
    }

    try {
      await proyectoApi.eliminarDocumentoSustento(
        proyectoId,
        documentoId
      );

      setDocumentosSustento((prev) =>
        prev.filter(
          (documento) => String(documento.id) !== String(documentoId)
        )
      );

      showToast('success', 'Documento eliminado correctamente.');

      return true;
    } catch (error) {
      console.error('Error eliminando documento:', error);

      showToast(
        'error',
        `No se pudo eliminar el documento: ${obtenerMensajeError(error)}`
      );

      return false;
    }
  }, [formData.id, showToast]);

  // ---------------------------------------------------
  // VALIDACIONES Y NAVEGACIÓN
  // ---------------------------------------------------

  const isStepValid = (stepNumber) => {
    try {
      const reglas = VALIDACIONES[stepNumber];

      if (!reglas) return false;

      return Object.values(reglas).every((regla) =>
        regla(formData)
      );
    } catch (error) {
      console.error('Error validando paso:', error);
      return false;
    }
  };

  const obtenerSeccionesPendientes = () => {
    const nombres = {
      1: 'Datos generales del proyecto',
      2: 'Fundamentación del grupo',
      3: 'Diagnóstico del proyecto',
      4: 'Objetivos y ODS',
      5: 'Resultados esperados',
      6: 'Actividades',
      7: 'Cronograma y responsables',
      8: 'Recursos del proyecto',
      9: 'Fuentes de financiamiento',
    };

    return Object.keys(VALIDACIONES)
      .map(Number)
      .filter((numero) => !isStepValid(numero))
      .map((numero) => ({
        paso: numero,
        nombre: nombres[numero],
      }));
  };

  const pasosCompletados = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .filter((numero) => isStepValid(numero));

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, 9));

  const prevStep = () =>
    setStep((prev) => Math.max(prev - 1, 1));

  const goToStep = (targetStep) =>
    setStep(Math.max(1, Math.min(Number(targetStep) || 1, 9)));

  const handleCancelar = () => {
    localStorage.removeItem('rsu_draft');
    navigate('/proyectos');
  };

  // ---------------------------------------------------
  // ENVIAR A REVISIÓN
  // ---------------------------------------------------

  const enviarARevision = async (proyectoId) => {
    try {
      await proyectoApi.enviarARevision(proyectoId);
      return true;
    } catch (error) {
      console.error('Error al enviar a revisión:', error);

      showToast(
        'error',
        `El proyecto se guardó, pero no se pudo enviar a revisión: ${obtenerMensajeError(error)}`
      );

      return false;
    }
  };

  // ---------------------------------------------------
  // GUARDAR PROYECTO
  // ---------------------------------------------------

  const enviarProyectoBackend = async (modo = 'BORRADOR') => {
    if (isSubmittingRef.current) return false;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = construirPayload(formData);

      console.log(
        'PAYLOAD DEL PROYECTO:',
        JSON.stringify(payload, null, 2)
      );

      let proyecto;

      if (formData.id) {
        proyecto = await proyectoApi.actualizarProyecto(
          formData.id,
          payload
        );
      } else {
        proyecto = await proyectoApi.crearProyecto(payload);
      }

      const proyectoId = proyecto?.id || formData.id;

      if (!proyectoId) {
        throw new Error(
          'El backend no devolvió el ID del proyecto guardado.'
        );
      }

      // Conservar el ID en el formulario tras crear el proyecto.
      setFormData((prev) => ({
        ...prev,
        id: proyectoId,
      }));

      // -------------------------------------------------
      // FUENTES Y PARTIDAS PRESUPUESTARIAS
      // -------------------------------------------------

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

          let fuenteIdAsignado = fuente.id;

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

            fuenteIdAsignado =
              respuestaFuente?.id || fuenteIdAsignado;
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

        // Se mantiene el comportamiento original de confirmación.
        try {
          await proyectoApi.confirmarFinanciamiento(proyectoId);
        } catch (errorConfirmacion) {
          console.warn(
            'No se pudo confirmar el financiamiento:',
            errorConfirmacion.response?.data ||
              errorConfirmacion.message
          );
        }
      }

      // -------------------------------------------------
      // ENVÍO A REVISIÓN O GUARDADO COMO BORRADOR
      // -------------------------------------------------

      if (modo === 'EN_REVISION') {
        const enviado = await enviarARevision(proyectoId);

        if (!enviado) {
          return false;
        }

        showToast(
          'success',
          'Proyecto enviado a revisión correctamente.'
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
        showToast(
          'error',
          obtenerMensajeError({
            response: { data: backendErrors.errors },
          })
        );
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
        `Error al guardar el formulario: ${
          error.message || 'No se pudo conectar con el servidor.'
        }`
      );

      return false;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // API PÚBLICA DEL HOOK
  // =====================================================

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

    isStepValid,
    obtenerSeccionesPendientes,
    enviarProyectoBackend,
    enviarARevision,

    // Beneficiarios.
    tiposBeneficiario,
    cargandoBeneficiarios,
    cargarTiposBeneficiario,
    actualizarBeneficiarios,
    alternarBeneficiario,

    // Documentos de sustento.
    documentosSustento,
    cargandoDocumentos,
    subiendoDocumento,
    cargarDocumentosSustento,
    subirDocumentoSustento,
    eliminarDocumentoSustento,
  };
};
