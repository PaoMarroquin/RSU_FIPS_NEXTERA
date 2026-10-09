import { useState, useCallback } from 'react';
import { matrizOperativaApi } from '../../../shared/api/planificacion/matrizOperativaApi';

export function useMatrizOperativa() {
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    handleCreated
  };
}