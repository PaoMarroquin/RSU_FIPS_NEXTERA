import { useState, useEffect, useCallback } from 'react';
import { notificacionApi } from '../../../shared/api/proyectos/notificacionApi';
import { fetchAllPages } from "../../../shared/api/fetchAllPages";

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = useCallback(async () => {
    try {
      setLoading(true);
      const lista = await fetchAllPages(() =>
        notificacionApi.obtenerNotificaciones()
      );
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
    // Lotes de 5 peticiones; solo se marcan en pantalla las que el servidor confirmó.
    const { exitosas, fallidas } = await notificacionApi.marcarVariasLeidas(
      pendientes.map(n => n.id)
    );

    if (exitosas.length > 0) {
      const marcadas = new Set(exitosas);
      setNotificaciones(prev =>
        prev.map(n => (marcadas.has(n.id) ? { ...n, leida: true } : n))
      );
    }

    if (fallidas.length > 0) {
      console.error(
        `No se pudieron marcar ${fallidas.length} notificaciones como leidas.`
      );
    }

    return { exitosas, fallidas };
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