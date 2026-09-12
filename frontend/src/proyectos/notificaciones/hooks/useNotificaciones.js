import { useState, useEffect, useCallback } from 'react';
import { notificacionApi } from '../../../shared/api/proyectos/notificacionApi';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificacionApi.obtenerNotificaciones();
      // Soporte por si Django pagina la respuesta (.results) o manda el array directo
      const lista = response.results ? response.results : (Array.isArray(response) ? response : []);
      setNotificaciones(lista);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarComoLeida = useCallback(async (id) => {
    try {
      // Usando el nuevo endpoint POST de la notificacionApi
      await notificacionApi.marcarNotificacionLeida(id);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (error) {
      console.error('Error al marcar notificacion como leida:', error);
    }
  }, []);

  const marcarTodasComoLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter(n => !n.leida);
    if (pendientes.length === 0) return;
    try {
      // Marcamos todas en paralelo usando el nuevo endpoint
      await Promise.all(pendientes.map(n => notificacionApi.marcarNotificacionLeida(n.id)));
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error al marcar todas como leidas:', error);
    }
  }, [notificaciones]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return {
    notificaciones,
    loading,
    unreadCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    refetch: fetchNotificaciones
  };
}