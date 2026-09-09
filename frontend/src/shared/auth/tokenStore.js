let accessToken = null;
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb(!!accessToken));

export const tokenStore = {
  getAccessToken: () => accessToken,

  setAccessToken(token) {
    accessToken = token;
    notify();
  },

  getRefreshToken: () => localStorage.getItem('refresh_token'),

  setRefreshToken(token) {
    if (token) localStorage.setItem('refresh_token', token);
  },

  clear() {
    accessToken = null;
    localStorage.removeItem('refresh_token');
    // limpiar restos de la versión anterior, si existían
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    notify();
  },

  // permite que componentes (ej. contexto de auth) reaccionen a login/logout
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};