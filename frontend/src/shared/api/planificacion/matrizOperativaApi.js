import api from '../axiosConfig';

export const matrizOperativaApi = {
  // Lista matrices operativas (filtros: ?facultad, ?periodo, ?search)
  obtenerMatrices: async (params = {}) => {
    const response = await api.get('/api/v1/matrices/', { params });
    return response.data;
  },

  obtenerMatrizPorId: async (id) => {
    const response = await api.get(`/api/v1/matrices/${id}/`);
    return response.data;
  },

  crearMatriz: async (datosMatriz) => {
    const response = await api.post('/api/v1/matrices/', datosMatriz);
    return response.data;
  },

  actualizarMatriz: async (id, datosMatriz) => {
    const response = await api.patch(`/api/v1/matrices/${id}/`, datosMatriz);
    return response.data;
  },

  eliminarMatriz: async (id) => {
    const response = await api.delete(`/api/v1/matrices/${id}/`);
    return response.data;
  },

  // --- EXPORTACIONES (Archivos binarios) ---
  exportarExcel: async (id) => {
    const response = await api.get(`/api/v1/matrices/${id}/export/excel/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportarPDF: async (id) => {
    const response = await api.get(`/api/v1/matrices/${id}/export/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};