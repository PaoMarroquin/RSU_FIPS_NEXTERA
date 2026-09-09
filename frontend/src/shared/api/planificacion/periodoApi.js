import api from '../axiosConfig';

export const periodoApi = {
  // Lista periodos académicos (soporta filtros como search u ordering)
  obtenerPeriodos: async (params = {}) => {
    const response = await api.get('/api/v1/periodos/', { params });
    return response.data;
  },

  obtenerPeriodoPorId: async (id) => {
    const response = await api.get(`/api/v1/periodos/${id}/`);
    return response.data;
  },

  crearPeriodo: async (datosPeriodo) => {
    const response = await api.post('/api/v1/periodos/', datosPeriodo);
    return response.data;
  },

  actualizarPeriodo: async (id, datosPeriodo) => {
    const response = await api.patch(`/api/v1/periodos/${id}/`, datosPeriodo);
    return response.data;
  },

  eliminarPeriodo: async (id) => {
    const response = await api.delete(`/api/v1/periodos/${id}/`);
    return response.data;
  },
};