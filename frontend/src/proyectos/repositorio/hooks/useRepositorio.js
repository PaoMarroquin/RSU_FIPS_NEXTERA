import { useState, useEffect } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

export const useRepositorio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  const [proyectosRepositorio, setProyectosRepositorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Efecto Debounce para no saturar al servidor en cada tecla
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset a página 1 al buscar
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Petición Real al Servidor
  useEffect(() => {
    const fetchRepositorio = async () => {
      setLoading(true);
      try {
        const response = await proyectoApi.obtenerProyectos({ 
          page: page, 
          search: debouncedSearch 
        });
        
        setProyectosRepositorio(response.results || []);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } catch (error) {
        console.error("Error cargando el repositorio real:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositorio();
  }, [page, debouncedSearch]);

  return {
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    proyectoSeleccionado, setProyectoSeleccionado,
    proyectosRepositorio, loading,
    page, setPage, totalPages
  };
};