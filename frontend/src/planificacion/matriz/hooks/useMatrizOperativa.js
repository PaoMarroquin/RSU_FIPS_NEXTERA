import { useState, useCallback } from 'react';
import { matrizOperativaApi } from '../../../shared/api/planificacion/matrizOperativaApi';

export function useMatrizOperativa() {
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await matrizOperativaApi.obtenerMatrices();
      setMatrices(res.results || res);
    } catch (err) {
      console.error('Error cargando matrices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreated = (nuevaMatriz) => {
    setMatrices(prev => [nuevaMatriz, ...prev]);
  };

  const handleExport = async (id, tipo) => {
    try {
      const data = tipo === 'excel' 
        ? await matrizOperativaApi.exportarExcel(id) 
        : await matrizOperativaApi.exportarPDF(id);
      
      const ext = tipo === 'excel' ? 'xlsx' : 'pdf';
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `matriz_${id}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exportando ${tipo}:`, err);
      alert(`No se pudo exportar a ${tipo.toUpperCase()}. Verifique el endpoint.`);
    }
  };

  return {
    matrices,
    loading,
    fetchMatrices,
    handleCreated,
    handleExport
  };
}