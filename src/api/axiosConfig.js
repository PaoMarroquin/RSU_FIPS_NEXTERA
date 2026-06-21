import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de PETICIONES: Agrega el Token JWT a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPUESTAS: Maneja el Refresh Token Automático
api.interceptors.response.use(
  (response) => response, // Si todo sale bien, devuelve la respuesta normal
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (No autorizado) y no hemos reintentado ya esta petición
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos para no entrar en bucle infinito

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });

          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Si tu backend también rota el refresh token, guárdalo
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh);
          }

          // Actualizamos la cabecera de la petición original fallida y la volvemos a lanzar
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh token también expiró o es inválido, forzamos cierre de sesión
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/'; // Redirigimos al Login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;