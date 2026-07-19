import api from './axiosConfig';

const fetchRecursive = async (url, params = {}, page = 1, accumulated = []) => {
  const response = await api.get(url, { params: { ...params, page } });
  const totalResults = [...accumulated, ...response.data.results];
  if (response.data.next) {
    return fetchRecursive(url, params, page + 1, totalResults);
  }
  // Mantenemos la estructura { results, next } para no romper el componente
  return { results: totalResults, next: null };
};

export const academicService = {
  getFacultades: async (page = 1, dependenciaId = null, getAll = false) => {
    if (getAll) return fetchRecursive('/api/v1/facultades/');
    const response = await api.get('/api/v1/facultades/', { params: { page } });
    return response.data;
  },

  getEscuelas: async (page = 1, facultadId = null, getAll = false) => {
    const params = {};
    if (facultadId) params.facultad = facultadId;

    if (getAll) return fetchRecursive('/api/v1/escuelas/', params);
    
    params.page = page;
    const response = await api.get('/api/v1/escuelas/', { params });
    return response.data;
  },

  getDepartamentos: async (page = 1, facultadId = null, getAll = false) => {
    const params = {};
    if (facultadId) params.facultad = facultadId;
    if (getAll) return fetchRecursive('/api/v1/departamentos/', params);
    
    params.page = page;
    const response = await api.get('/api/v1/departamentos/', { params });
    return response.data;
  },

  getPeriodos: async (page = 1, dependenciaId = null, getAll = false) => {
    if (getAll) return fetchRecursive('/api/v1/periodos/');
    const response = await api.get('/api/v1/periodos/', { params: { page } });
    return response.data;
  }
};