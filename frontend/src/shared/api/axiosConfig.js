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

let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No hay refresh token'));
    }
    refreshPromise = axios
      .post(`${BASE_URL}/api/v1/auth/token/refresh/`, { refresh: refreshToken })
      .then((res) => {
        tokenStore.setAccessToken(res.data.access);
        if (res.data.refresh) tokenStore.setRefreshToken(res.data.refresh);
        return res.data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

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
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
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