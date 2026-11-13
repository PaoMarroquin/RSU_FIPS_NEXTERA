import api from '../axiosConfig';

export const notificacionApi = {
  obtenerNotificaciones: async (params = {}) => {
    const response = await api.get('/api/v1/notificaciones/', { params });
    return response.data;
  },

  marcarNotificacionLeida: async (id) => {
    const response = await api.patch(`/api/v1/notificaciones/${id}/leer/`);
    return response.data;
  },

  // Marca varias notificaciones con concurrencia limitada (lotes) para no
  // saturar el servidor ni disparar el límite de peticiones. Nunca lanza:
  // devuelve cuáles se marcaron y cuáles fallaron.
  marcarVariasLeidas: async (ids = [], tamanoLote = 5) => {
    const exitosas = [];
    const fallidas = [];

    for (let i = 0; i < ids.length; i += tamanoLote) {
      const lote = ids.slice(i, i + tamanoLote);
      const resultados = await Promise.allSettled(
        lote.map((id) =>
          api.patch(`/api/v1/notificaciones/${id}/leer/`)
        )
      );

      resultados.forEach((resultado, indice) => {
        if (resultado.status === 'fulfilled') {
          exitosas.push(lote[indice]);
        } else {
          fallidas.push(lote[indice]);
        }
      });
    }

    return { exitosas, fallidas };
  },
};