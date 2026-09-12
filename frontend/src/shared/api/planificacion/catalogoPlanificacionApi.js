import api from '../axiosConfig';

export const catalogoPlanificacionApi = {
  // Listar Ejes RSU (incluye sub-ítems anidados desde DRF)
  obtenerEjesRSU: async () => {
    const response = await api.get('/api/v1/ejes-rsu/');
    return response.data;
  },

  // Listar ODS
  obtenerODS: async () => {
    const response = await api.get('/api/v1/ods/');
    return response.data;
  },

  // --- LÍNEAS ESTRATÉGICAS ---
  obtenerLineasEstrategicas: async (ejeRsuId = null) => {
    const params = ejeRsuId ? { eje_rsu: ejeRsuId } : {};
    const response = await api.get('/api/v1/lineas-estrategicas/', { params });
    return response.data;
  },

  crearLineaEstrategica: async (datosLinea) => {
    const response = await api.post('/api/v1/lineas-estrategicas/', datosLinea);
    return response.data;
  },

  actualizarLineaEstrategica: async (id, datosLinea) => {
    const response = await api.patch(`/api/v1/lineas-estrategicas/${id}/`, datosLinea);
    return response.data;
  },

  eliminarLineaEstrategica: async (id) => {
    const response = await api.delete(`/api/v1/lineas-estrategicas/${id}/`);
    return response.data;
  },
};