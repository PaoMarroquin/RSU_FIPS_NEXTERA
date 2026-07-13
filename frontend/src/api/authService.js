import api from './axiosConfig';

export const authService = {
  login: async (correo_institucional, password) => {
    const response = await api.post('/api/v1/auth/login/', { correo_institucional, password });
    return response.data;
  },
  
  logout: async (refresh_token) => {
    const response = await api.post('/api/v1/auth/logout/', { refresh: refresh_token });
    return response.data;
  },

  loginWithGoogle: async (id_token) => {
    const response = await api.post('/api/v1/auth/google/', { id_token });
    return response.data;
  },

  getMiPerfil: async () => {
    const response = await api.get('/api/v1/usuarios/me/');
    return response.data;
  },

  updateMiPerfil: async (formDataPayload) => {
    const response = await api.patch('/api/v1/usuarios/me/', formDataPayload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },

  // Obtener los proyectos del usuario autenticado (usado en el módulo de Actividades/Metas)
  getProyectos: async () => {
    const response = await api.get('/api/v1/proyectos/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  // Obtener el detalle completo de un proyecto (incluye metas_indicadores anidadas)
  getProyectoDetalle: async (proyectoId) => {
    const response = await api.get(`/api/v1/proyectos/${proyectoId}/`);
    return response.data;
  },

  // 1. Obtener todas las actividades asociadas a un proyecto específico
    getActividades: async (proyectoId) => {
      const response = await api.get(`/api/v1/proyectos/${proyectoId}/actividades/`);
      return response.data;
    },

    // 2. Modificar campos rápidos como el check de "cumplido" (Envía formato JSON regular)
    patchActividad: async (proyectoId, actividadId, payload) => {
      const response = await api.patch(`/api/v1/proyectos/${proyectoId}/actividades/${actividadId}/`, payload);
      return response.data;
    },

    // 3. Subir el archivo de evidencia en binario (Envía formato FormData multipart)
    patchActividadFormData: async (proyectoId, actividadId, formDataPayload) => {
      const response = await api.patch(`/api/v1/proyectos/${proyectoId}/actividades/${actividadId}/`, formDataPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    }

};



