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

};



