import axios from 'axios';
import { tokenStore } from '../auth/tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        tokenStore.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        tokenStore.setAccessToken(res.data.access);
        if (res.data.refresh) tokenStore.setRefreshToken(res.data.refresh);

        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenStore.clear();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;