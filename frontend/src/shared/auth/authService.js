import { refreshAccessToken } from '../../shared/api/axiosConfig';
import { usuarioApi } from '../api/usuario/usuarioApi';
import { tokenStore } from './tokenStore';

export const authService = {
  async login(correo_institucional, password) {
    const data = await authApi.login(correo_institucional, password);
    tokenStore.setAccessToken(data.access);
    tokenStore.setRefreshToken(data.refresh);
    return data;
  },

  async loginConGoogle(idToken) {
    const data = await authApi.loginConGoogle(idToken);
    tokenStore.setAccessToken(data.access);
    tokenStore.setRefreshToken(data.refresh);
    return data;
  },

  async logout(refreshToken) {
    return authApi.logout(refreshToken);
  },

  async getMiPerfil() {
    return usuarioApi.obtenerMiPerfil();
  },
};