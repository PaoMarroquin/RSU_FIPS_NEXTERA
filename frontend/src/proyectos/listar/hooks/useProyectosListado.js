import { useState, useEffect, useCallback } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";

// Agregamos customFilters = {} por defecto para NO romper otros componentes
export function useProyectosListado(customFilters = {}) {
  const [projectsDb, setProjectsDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Convertimos a string para usarlo en el array de dependencias sin causar re-renders infinitos
  const filtersKey = JSON.stringify(customFilters);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const filters = JSON.parse(filtersKey);
      
      // Enviamos la página, la búsqueda y esparcimos los filtros dinámicos (ej. estado: "finalizado")
      const data = await proyectoApi.obtenerProyectos({ 
        page, 
        search: debouncedSearch,
        ...filters 
      });
      
      setProjectsDb(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error cargando proyectos:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filtersKey]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const eliminarProyecto = useCallback(async (id) => {
    await proyectoApi.eliminarProyecto(id);
    setProjectsDb((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    projectsDb,
    loading,
    page,
    setPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    eliminarProyecto,
  };
}