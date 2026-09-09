import { useState, useEffect } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';

export function useProyectosJefatura() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalId, setModalId] = useState(null);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => { 
      setDebouncedSearch(searchTerm); 
      setPage(1); 
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch de proyectos
  useEffect(() => {
    const fetchProyectos = async () => {
      setLoading(true);
      try {
        const res = await proyectoApi.obtenerProyectos({ 
          page, 
          search: debouncedSearch 
        });
        setProyectos(res.results || res);
        if (res.count) {
          setTotalPages(Math.ceil(res.count / 10));
        }
      } catch (err) {
        console.error('Error cargando proyectos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, [page, debouncedSearch]);

  return {
    proyectos,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    modalId,
    setModalId
  };
}