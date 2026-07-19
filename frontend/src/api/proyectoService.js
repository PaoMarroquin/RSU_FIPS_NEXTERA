import api from './axiosConfig';

export const proyectoService = {
  // Obtener proyectos paginados y filtrados por el buscador
  getProyectos: async (page = 1, search = '') => {
    const response = await api.get('/api/v1/proyectos/', {
      params: { page, search }
    });
    return response.data; // Retorna { results: [...], count: X }
  },

  // Eliminar un proyecto por ID
  deleteProyecto: async (id) => {
    const response = await api.delete(`/api/v1/proyectos/${id}/`);
    return response.data;
  }
};