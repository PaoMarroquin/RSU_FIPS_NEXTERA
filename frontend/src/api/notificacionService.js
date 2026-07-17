import api from './axiosConfig';

export const notificacionService = {
  getNotificaciones: async () => {
    const response = await api.get('/api/v1/notificaciones/');
    const data = response.data;
    return Array.isArray(data) ? data : (data?.results || []);
  },

  marcarLeida: async (id) => {
    const response = await api.patch(`/api/v1/notificaciones/${id}/leer/`);
    return response.data;
  }
};
