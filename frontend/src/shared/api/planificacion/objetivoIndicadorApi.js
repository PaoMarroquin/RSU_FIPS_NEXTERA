import api from '../axiosConfig';

export const objetivoIndicadorApi = {
  // --- OBJETIVOS INSTITUCIONALES ---
  obtenerObjetivos: async (matrizId = null) => {
    const params = matrizId ? { matriz: matrizId } : {};
    const response = await api.get('/api/v1/objetivos-institucionales/', { params });
    return response.data;
  },

  crearObjetivo: async (datosObjetivo) => {
    const response = await api.post('/api/v1/objetivos-institucionales/', datosObjetivo);
    return response.data;
  },

  actualizarObjetivo: async (id, datosObjetivo) => {
    const response = await api.patch(`/api/v1/objetivos-institucionales/${id}/`, datosObjetivo);
    return response.data;
  },

  eliminarObjetivo: async (id) => {
    const response = await api.delete(`/api/v1/objetivos-institucionales/${id}/`);
    return response.data;
  },

  // --- INDICADORES INSTITUCIONALES ---
  obtenerIndicadores: async (objetivoId = null) => {
    const params = objetivoId ? { objetivo: objetivoId } : {};
    const response = await api.get('/api/v1/indicadores-institucionales/', { params });
    return response.data;
  },

  crearIndicador: async (datosIndicador) => {
    const response = await api.post('/api/v1/indicadores-institucionales/', datosIndicador);
    return response.data;
  },

  actualizarIndicador: async (id, datosIndicador) => {
    const response = await api.patch(`/api/v1/indicadores-institucionales/${id}/`, datosIndicador);
    return response.data;
  },

  eliminarIndicador: async (id) => {
    const response = await api.delete(`/api/v1/indicadores-institucionales/${id}/`);
    return response.data;
  },
};