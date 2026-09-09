import api from '../axiosConfig';

export const actividadSugeridaApi = {
  // Filtros soportados: ?matriz=id, ?anio_academico=num
  obtenerActividadesSugeridas: async (params = {}) => {
    const response = await api.get('/api/v1/actividades-sugeridas/', { params });
    return response.data;
  },

  crearActividadSugerida: async (datosActividad) => {
    const response = await api.post('/api/v1/actividades-sugeridas/', datosActividad);
    return response.data;
  },

  actualizarActividadSugerida: async (id, datosActividad) => {
    const response = await api.patch(`/api/v1/actividades-sugeridas/${id}/`, datosActividad);
    return response.data;
  },

  eliminarActividadSugerida: async (id) => {
    const response = await api.delete(`/api/v1/actividades-sugeridas/${id}/`);
    return response.data;
  },
};