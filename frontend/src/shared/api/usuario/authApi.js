// src/shared/api/usuario/authApi.js
import axios from 'axios';
import api from '../axiosConfig';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authApi = {
  login: async (correo_institucional, password) => {
    const response = await api.post('/api/v1/auth/login/', { correo_institucional, password });
    return response.data;
  },

  loginConGoogle: async (idToken) => {
    const response = await api.post('/api/v1/auth/google/', { id_token: idToken });
    return response.data;
  },
  
  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh/`, { refresh: refreshToken });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/api/v1/auth/logout/', { refresh: refreshToken });
    return response.data;
  },
};