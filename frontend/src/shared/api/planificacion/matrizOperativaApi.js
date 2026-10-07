import api from '../axiosConfig';

export const matrizOperativaApi = {
  // Lista Documentos de Apoyo (conserva la ruta /matrices/)
  obtenerMatrices: async (params = {}) => {
    const response = await api.get('/api/v1/matrices/', { params });
    return response.data;
  },

  // POST con FormData para enviar el archivo PDF/Word
  crearMatriz: async (formData) => {
    const response = await api.post('/api/v1/matrices/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  eliminarMatriz: async (id) => {
    const response = await api.delete(`/api/v1/matrices/${id}/`);
    return response.data;
  },
};