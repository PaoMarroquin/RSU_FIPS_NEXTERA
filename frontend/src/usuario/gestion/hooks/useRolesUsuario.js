import { useState, useCallback } from 'react';
import { usuarioApi } from '../../../shared/api/usuario/usuarioApi';

export function useRolesUsuario(usuarioId) {
  const [historial, setHistorial] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const fetchHistorial = useCallback(async () => {
    if (!usuarioId) return;
    setLoadingRoles(true);
    try {
      const res = await usuarioApi.obtenerHistorialRoles(usuarioId);
      setHistorial(res.results || res);
    } catch (error) {
      console.error('Error cargando historial de roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  }, [usuarioId]);

  const asignarRol = async (rolId, motivo) => {
    try {
      await usuarioApi.asignarRol(usuarioId, { rol_id: rolId, motivo });
      await fetchHistorial();
      return true;
    } catch (error) {
      console.error('Error asignando rol:', error);
      throw error;
    }
  };

  return {
    historial,
    loadingRoles,
    fetchHistorial,
    asignarRol
  };
}