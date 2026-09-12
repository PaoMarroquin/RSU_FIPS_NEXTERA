import api from '../axiosConfig';

export const usuarioApi = {
  // --- PERFIL PROPIO ('/me/') ---
  obtenerMiPerfil: async () => {
    const response = await api.get('/api/v1/usuarios/me/');
    return response.data;
  },

  // Edición del perfil actual (si incluye 'firma_digital' como archivo, se recomienda usar FormData)
  actualizarMiPerfil: async (datosPerfil) => {
    const isFormData = datosPerfil instanceof FormData;
    const response = await api.patch('/api/v1/usuarios/me/', datosPerfil, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // --- ADMINISTRACIÓN DE USUARIOS ---
  obtenerUsuarios: async (params = {}) => {
    const response = await api.get('/api/v1/usuarios/', { params });
    return response.data;
  },

  crearUsuario: async (datosUsuario) => {
    const response = await api.post('/api/v1/usuarios/', datosUsuario);
    return response.data;
  },

  obtenerUsuarioPorId: async (id) => {
    const response = await api.get(`/api/v1/usuarios/${id}/`);
    return response.data;
  },

  actualizarUsuario: async (id, datosUsuario) => {
    const response = await api.patch(`/api/v1/usuarios/${id}/`, datosUsuario);
    return response.data;
  },

  eliminarUsuario: async (id) => {
    const response = await api.delete(`/api/v1/usuarios/${id}/`);
    return response.data;
  },

  // --- ROLES DE USUARIO ---
  asignarRol: async (usuarioId, { rol_id, motivo = '' }) => {
    const response = await api.post(`/api/v1/usuarios/${usuarioId}/asignar-rol/`, {
      rol_id,
      motivo,
    });
    return response.data;
  },

  obtenerHistorialRoles: async (usuarioId) => {
    const response = await api.get(`/api/v1/usuarios/${usuarioId}/historial-roles/`);
    return response.data;
  },
};