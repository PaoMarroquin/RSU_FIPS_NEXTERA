import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usuarioApi } from "../../../shared/api/usuario/usuarioApi";

export function useUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Enlaces de navegación devueltos por el backend
  const [hasNext, setHasNext] = useState(null);
  const [hasPrevious, setHasPrevious] = useState(null);

  // Estados para Filtros y Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("");

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usuarioApi.obtenerUsuarios({
        page: currentPage,
        search: searchTerm,
        ordering: orderBy
      });
      setUsuarios(data.results || []);
      setTotalRecords(data.count || 0);
      setHasNext(data.next);
      setHasPrevious(data.previous);
    } catch (error) {
      console.error("Error al cargar los usuarios:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, orderBy]);

  useEffect(() => {
    // Validar el rol antes de hacer cualquier petición (Logica original restaurada)
    const role = localStorage.getItem("user_role");
    const sanitizedRole = role ? role.toLowerCase() : "";

    if (sanitizedRole !== "departamento" && sanitizedRole !== "administrador") {
      navigate("/dashboard");
    } else {
      fetchUsuarios();
    }
  }, [fetchUsuarios, navigate]);

  return {
    usuarios,
    loading,
    totalRecords,
    hasNext,
    hasPrevious,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    orderBy,
    setOrderBy,
    fetchUsuarios
  };
}