import api from '../axiosConfig';

export const notificacionApi = {
  obtenerNotificaciones: async (params = {}) => {
    const response = await api.get('/api/v1/notificaciones/', { params });
    return response.data;
  },

  marcarNotificacionLeida: async (id) => {
    const response = await api.post(`/api/v1/notificaciones/${id}/leer/`);
    return response.data;
  },
};