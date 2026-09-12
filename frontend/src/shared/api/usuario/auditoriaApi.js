import api from '../axiosConfig';

export const auditoriaApi = {
  obtenerAuditoria: async (params = {}) => {
    const response = await api.get('/api/v1/auditoria/', { params });
    return response.data;
  },
};