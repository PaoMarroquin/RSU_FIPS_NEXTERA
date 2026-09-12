import api from '../axiosConfig';

export const catalogoApi = {
  obtenerRoles: async () => {
    const response = await api.get('/api/v1/roles/');
    return response.data;
  },

  obtenerFacultades: async () => {
    const response = await api.get('/api/v1/facultades/');
    return response.data;
  },

  // Permite filtrar escuelas por id de facultad
  obtenerEscuelas: async (facultadId = null) => {
    const params = facultadId ? { facultad: facultadId } : {};
    const response = await api.get('/api/v1/escuelas/', { params });
    return response.data;
  },

  // Permite filtrar departamentos por id de facultad
  obtenerDepartamentos: async (facultadId = null) => {
    const params = facultadId ? { facultad: facultadId } : {};
    const response = await api.get('/api/v1/departamentos/', { params });
    return response.data;
  },
};