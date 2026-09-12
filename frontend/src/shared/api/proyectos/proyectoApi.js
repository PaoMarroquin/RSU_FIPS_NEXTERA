import api from '../axiosConfig';

export const proyectoApi = {
  // ── PROYECTO PRINCIPAL ───────────────────────────────────────────────────
  obtenerProyectos: async (params = {}) => {
    const response = await api.get('/api/v1/proyectos/', { params });
    return response.data;
  },

  obtenerProyectoPorId: async (id) => {
    const response = await api.get(`/api/v1/proyectos/${id}/`);
    return response.data;
  },

  crearProyecto: async (datosProyecto) => {
    const isFormData = datosProyecto instanceof FormData;
    const response = await api.post('/api/v1/proyectos/', datosProyecto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  actualizarProyecto: async (id, datosProyecto) => {
    const isFormData = datosProyecto instanceof FormData;
    const response = await api.patch(`/api/v1/proyectos/${id}/`, datosProyecto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  eliminarProyecto: async (id) => {
    const response = await api.delete(`/api/v1/proyectos/${id}/`);
    return response.data;
  },

  enviarARevision: async (id) => {
    const response = await api.post(`/api/v1/proyectos/${id}/revisar/`);
    return response.data;
  },

  continuarProyecto: async (id, datos = {}) => {
    const response = await api.post(`/api/v1/proyectos/${id}/continuar/`, datos);
    return response.data;
  },

  // ── VI. ACTIVIDADES ──────────────────────────────────────────────────────
  obtenerActividades: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/actividades/`);
    return response.data;
  },

  crearActividad: async (proyectoPk, datosActividad) => {
    const isFormData = datosActividad instanceof FormData;
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/actividades/`, datosActividad, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  obtenerActividadPorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/actividades/${id}/`);
    return response.data;
  },

  actualizarActividad: async (proyectoPk, id, datosActividad) => {
    const isFormData = datosActividad instanceof FormData;
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/actividades/${id}/`, datosActividad, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  eliminarActividad: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/actividades/${id}/`);
    return response.data;
  },

  // ── VII. CRONOGRAMA ──────────────────────────────────────────────────────
  obtenerCronograma: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/cronograma/`);
    return response.data;
  },

  crearAccionCronograma: async (proyectoPk, datosAccion) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/cronograma/`, datosAccion);
    return response.data;
  },

  obtenerAccionCronogramaPorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/cronograma/${id}/`);
    return response.data;
  },

  actualizarAccionCronograma: async (proyectoPk, id, datosAccion) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/cronograma/${id}/`, datosAccion);
    return response.data;
  },

  eliminarAccionCronograma: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/cronograma/${id}/`);
    return response.data;
  },

  // ── IX. FUENTES DE FINANCIAMIENTO ────────────────────────────────────────
  obtenerFuentesFinanciamiento: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/financiamiento/`);
    return response.data;
  },

  crearFuenteFinanciamiento: async (proyectoPk, datosFuente) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/financiamiento/`, datosFuente);
    return response.data;
  },

  obtenerFuenteFinanciamientoPorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/financiamiento/${id}/`);
    return response.data;
  },

  actualizarFuenteFinanciamiento: async (proyectoPk, id, datosFuente) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/financiamiento/${id}/`, datosFuente);
    return response.data;
  },

  eliminarFuenteFinanciamiento: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/financiamiento/${id}/`);
    return response.data;
  },

  // ── IX. PRESUPUESTO ESTIMADO (PARTIDAS PRESUPUESTARIAS) ─────────────────
  obtenerPresupuesto: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/presupuesto/`);
    return response.data;
  },

  crearPartidaPresupuestaria: async (proyectoPk, datosPartida) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/presupuesto/`, datosPartida);
    return response.data;
  },

  obtenerResumenPresupuesto: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/presupuesto/resumen/`);
    return response.data;
  },

  confirmarFinanciamiento: async (proyectoPk, datosConfirmacion = {}) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/presupuesto/confirmar/`, datosConfirmacion);
    return response.data;
  },

  obtenerPartidaPresupuestariaPorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/presupuesto/${id}/`);
    return response.data;
  },

  actualizarPartidaPresupuestaria: async (proyectoPk, id, datosPartida) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/presupuesto/${id}/`, datosPartida);
    return response.data;
  },

  eliminarPartidaPresupuestaria: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/presupuesto/${id}/`);
    return response.data;
  },

  // ── IV/V. METAS E INDICADORES ─────────────────────────────────────────────
  obtenerMetasIndicadores: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/metas-indicadores/`);
    return response.data;
  },

  crearMetaIndicador: async (proyectoPk, datosMeta) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/metas-indicadores/`, datosMeta);
    return response.data;
  },

  obtenerMetaIndicadorPorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/metas-indicadores/${id}/`);
    return response.data;
  },

  actualizarMetaIndicador: async (proyectoPk, id, datosMeta) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/metas-indicadores/${id}/`, datosMeta);
    return response.data;
  },

  eliminarMetaIndicador: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/metas-indicadores/${id}/`);
    return response.data;
  },

  // ── REGISTRO DE AVANCES Y EVIDENCIAS (HU-05) ─────────────────────────────
  obtenerAvances: async (proyectoPk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/avances/`);
    return response.data;
  },

  crearAvance: async (proyectoPk, datosAvance) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/avances/`, datosAvance);
    return response.data;
  },

  obtenerAvancePorId: async (proyectoPk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/avances/${id}/`);
    return response.data;
  },

  actualizarAvance: async (proyectoPk, id, datosAvance) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoPk}/avances/${id}/`, datosAvance);
    return response.data;
  },

  eliminarAvance: async (proyectoPk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/avances/${id}/`);
    return response.data;
  },

  observarAvance: async (proyectoPk, id, datosObservacion) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/avances/${id}/observar/`, datosObservacion);
    return response.data;
  },

  corregirAvance: async (proyectoPk, id, datosCorreccion) => {
    const response = await api.post(`/api/v1/proyectos/${proyectoPk}/avances/${id}/corregir/`, datosCorreccion);
    return response.data;
  },

  // --- Evidencias de Avance ---
  obtenerEvidenciasAvance: async (proyectoPk, avancePk) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/avances/${avancePk}/evidencias/`);
    return response.data;
  },

  crearEvidenciaAvance: async (proyectoPk, avancePk, datosEvidencia) => {
    const isFormData = datosEvidencia instanceof FormData;
    const response = await api.post(
      `/api/v1/proyectos/${proyectoPk}/avances/${avancePk}/evidencias/`,
      datosEvidencia,
      {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }
    );
    return response.data;
  },

  obtenerEvidenciaAvancePorId: async (proyectoPk, avancePk, id) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoPk}/avances/${avancePk}/evidencias/${id}/`);
    return response.data;
  },

  actualizarEvidenciaAvance: async (proyectoPk, avancePk, id, datosEvidencia) => {
    const isFormData = datosEvidencia instanceof FormData;
    const response = await api.patch(
      `/api/v1/proyectos/${proyectoPk}/avances/${avancePk}/evidencias/${id}/`,
      datosEvidencia,
      {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }
    );
    return response.data;
  },

  eliminarEvidenciaAvance: async (proyectoPk, avancePk, id) => {
    const response = await api.delete(`/api/v1/proyectos/${proyectoPk}/avances/${avancePk}/evidencias/${id}/`);
    return response.data;
  },

  // ── REPORTES ─────────────────────────────────────────────────────────────
  obtenerReporteGeneral: async (params = {}) => {
    const response = await api.get('/api/v1/reportes/general/', { params });
    return response.data;
  },

  obtenerReporteFacultad: async (facultadPk, params = {}) => {
    const response = await api.get(`/api/v1/reportes/facultad/${facultadPk}/`, { params });
    return response.data;
  },

  // ── MÓDULO 4: REVISIÓN Y APROBACIÓN ──────────────────────────────────────
  obtenerProyectosParaRevisar: async (params = {}) => {
    const response = await api.get('/api/v1/proyectos/para-revisar/', { params });
    return response.data;
  },

  aprobarProyecto: async (id, datosAprobacion = {}) => {
    const response = await api.post(`/api/v1/proyectos/${id}/aprobar/`, datosAprobacion);
    return response.data;
  },

  observarProyecto: async (id, datosObservacion) => {
    const response = await api.post(`/api/v1/proyectos/${id}/observar/`, datosObservacion);
    return response.data;
  },
};