import api from './axiosConfig';

export const actividadesService = {
  // 1. Obtener los proyectos del usuario autenticado (con fallback por si Django pagina)
  getProyectos: async () => {
    const response = await api.get('/api/v1/proyectos/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  // 2. Obtener el detalle completo de un proyecto (incluye metas_indicadores anidadas)
  getProyectoDetalle: async (proyectoId) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoId}/`);
    return response.data;
  },

  // 3. Obtener todas las actividades asociadas a un proyecto específico (con fallback anti-error)
  getActividades: async (proyectoId) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoId}/actividades/`);
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  // 4. Modificar campos rápidos como el check de "cumplido" (Formato JSON regular)
  patchActividad: async (proyectoId, actividadId, payload) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoId}/actividades/${actividadId}/`, payload);
    return response.data;
  },

  // 5. Subir el archivo de evidencia en binario (Formato FormData multipart)
  patchActividadFormData: async (proyectoId, actividadId, formDataPayload) => {
    const response = await api.patch(`/api/v1/proyectos/${proyectoId}/actividades/${actividadId}/`, formDataPayload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
};