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
  },

  // Trae todos los proyectos visibles para el usuario autenticado, recorriendo la paginación del backend
  getAllProyectos: async () => {
    let page = 1;
    let allResults = [];
    let data = await proyectoService.getProyectos(page);
    allResults = allResults.concat(data.results || []);

    while (data.next) {
      page += 1;
      data = await proyectoService.getProyectos(page);
      allResults = allResults.concat(data.results || []);
    }

    return allResults;
  }
};