import api from './axiosConfig';

export const userService = {
  getRoles: async (page = 1, dependenciaId = null, getAll = false) => {
    if (getAll) {
      const response = await api.get('/api/v1/roles/', { params: { page: 1 } });
      let results = response.data.results || [];
      let next = response.data.next;
      let nextPage = 2;
      while (next) {
        const r = await api.get('/api/v1/roles/', { params: { page: nextPage } });
        results = results.concat(r.data.results || []);
        next = r.data.next;
        nextPage += 1;
      }
      return { results, next: null };
    }
    const response = await api.get('/api/v1/roles/', { params: { page } });
    return response.data;
  },

  getUsuarios: async (page = 1, search = '', ordering = '') => {
    const response = await api.get('/api/v1/usuarios/', {
      params: { page, search, ordering }
    });
    return response.data;
  },

  createUsuario: async (nombres, apellidos, correo_institucional, password, celular, rol, facultad, escuela, departamento, estado) => {
    const response = await api.post('/api/v1/usuarios/', {
      nombres,
      apellidos,
      correo_institucional,
      password,
      celular,
      rol,
      facultad,
      escuela,
      departamento,
      estado
    });
    return response.data;
  },

  getUsuarioDetail: async (id) => {
    const response = await api.get(`/api/v1/usuarios/${id}/`);
    return response.data;
  },

  updateUsuario: async (id, nombres, apellidos, celular, facultad, escuela, departamento, estado) => {
    const response = await api.put(`/api/v1/usuarios/${id}/`, {
      nombres,
      apellidos,
      celular,
      facultad,
      escuela,
      departamento,
      estado
    });
    return response.data;
  },

  patchUsuario: async (id, nombres, apellidos, celular, facultad, escuela, departamento, estado) => {
    const response = await api.patch(`/api/v1/usuarios/${id}/`, {
      nombres,
      apellidos,
      celular,
      facultad,
      escuela,
      departamento,
      estado
    });
    return response.data;
  },

  deleteUsuario: async (id) => {
    const response = await api.delete(`/api/v1/usuarios/${id}/`);
    return response.data;
  }
};