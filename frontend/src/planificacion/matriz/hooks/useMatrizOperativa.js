import { useState, useCallback, useMemo } from 'react';
import { matrizOperativaApi } from '../../../shared/api/planificacion/matrizOperativaApi';

// Función auxiliar para extraer el rol
const obtenerRolUsuario = () => {
  const rolDirecto = localStorage.getItem('user_role');
  if (rolDirecto) return rolDirecto.trim();

  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const parsedUser = JSON.parse(userJson);
      return (parsedUser.rol || '').trim();
    } catch (error) {
      console.error('Error al parsear el usuario de localStorage:', error);
    }
  }

  return '';
};

export function useMatrizOperativa() {
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Memorizar si el usuario puede crear basado en el rol "Jefatura"
  const puedeCrear = useMemo(() => {
    const rol = obtenerRolUsuario();
    return rol.toLowerCase().includes('jefatura');
  }, []);

  const fetchMatrices = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const res = await matrizOperativaApi.obtenerMatrices({ search });
      // DRF devuelve paginado en .results
      setMatrices(res.results || res);
    } catch (err) {
      console.error('Error cargando documentos de apoyo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreated = (nuevaMatriz) => {
    setMatrices(prev => [nuevaMatriz, ...prev]);
  };

  return {
    matrices,
    loading,
    fetchMatrices,
    handleCreated,
    puedeCrear
  };
}