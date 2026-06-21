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
  }
};