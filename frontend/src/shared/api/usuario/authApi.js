import api from '../axiosConfig';

export const authApi = {
  // Login con credenciales (correo institicional + contraseña)
  login: async (correo_institucional, password) => {
    const response = await api.post('/api/v1/auth/login/', {
      correo_institucional,
      password,
    });
    return response.data;
  },

  // Login con Google OAuth (recibe id_token)
  loginConGoogle: async (idToken) => {
    const response = await api.post('/api/v1/auth/google/', {
      id_token: idToken,
    });
    return response.data;
  },

  // Refrescar access token manualmente
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/v1/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Cerrar sesión y eliminar token en backend
  logout: async (refreshToken) => {
    const response = await api.post('/api/v1/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};