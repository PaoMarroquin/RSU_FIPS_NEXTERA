import { useState, useEffect, useCallback } from "react";
import { proyectoApi } from "../../../shared/api/proyectos/proyectoApi";

export function useProyectosListado() {
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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // ⚠️ nombres de query params asumidos (page, search) — confirmar con el backend
      const data = await proyectoApi.obtenerProyectos({ page, search: debouncedSearch });
      setProjectsDb(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error cargando proyectos:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

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