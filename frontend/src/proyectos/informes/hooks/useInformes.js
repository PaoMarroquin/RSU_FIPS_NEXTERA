import { useState, useEffect, useCallback } from 'react';
import { proyectoApi } from '../../../shared/api/proyectos/proyectoApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useInformes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [dataMatrices, setDataMatrices] = useState([]);
  const [matrizSeleccionada, setMatrizSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { showToast } = useToast();

  const fetchMatrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // La API centralizada y el interceptor de Axios ya manejan el token
      const response = await proyectoApi.obtenerProyectos();
      
      const proyectosArray = response.results ? response.results : (Array.isArray(response) ? response : []);
      
      setDataMatrices(proyectosArray);
      
      if (proyectosArray.length > 0) {
        setMatrizSeleccionada(proyectosArray[0]);
      } else {
        setMatrizSeleccionada(null);
      }
    } catch (err) {
      console.error("Error al traer los informes desde el backend:", err);
      setDataMatrices([]);
      if (err.response?.status === 401) {
        setError("No autorizado o sesión expirada. Por favor, vuelve a iniciar sesión.");
      } else {
        setError("No se pudo obtener la información de los proyectos.");
        showToast("error", "Error al cargar los expedientes.");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMatrices();
  }, [fetchMatrices]);

  const filteredMatrices = (Array.isArray(dataMatrices) ? dataMatrices : []).filter(matriz => {
    if (!matriz) return false;
    const facultad = matriz.facultad_nombre || "";
    const titulo = matriz.titulo || "";
    const codigo = matriz.codigo || `PRY-${matriz.id}`;
    const estado = matriz.estado || "pendiente";

    const matchesSearch = facultad.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = facultyFilter ? facultad === facultyFilter : true;
    const matchesStatus = statusFilter ? estado === statusFilter : true;
    
    return matchesSearch && matchesFaculty && matchesStatus;
  });

  return {
    searchTerm, setSearchTerm,
    facultyFilter, setFacultyFilter,
    statusFilter, setStatusFilter,
    matrizSeleccionada, setMatrizSeleccionada,
    loading, error, filteredMatrices
  };
};