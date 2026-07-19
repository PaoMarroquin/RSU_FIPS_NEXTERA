import { useState, useEffect, useCallback } from 'react';
import { notificacionService } from '../api/notificacionService';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const lista = await notificacionService.getNotificaciones();
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
      await notificacionService.marcarLeida(id);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (error) {
      console.error('Error al marcar notificacion como leida:', error);
    }
  }, []);

  const marcarTodasComoLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter(n => !n.leida);
    if (pendientes.length === 0) return;
    try {
      await Promise.all(pendientes.map(n => notificacionService.marcarLeida(n.id)));
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
