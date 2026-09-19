import React, { useState, useMemo } from 'react';
import Layout from "../../shared/layout/Layout"; // <--- Orquestador Global
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCheckSquare, FiBell, FiLoader } from "react-icons/fi";
import { useNotificaciones } from "./hooks/useNotificaciones"; // <--- Ruta local
import { getTipoConfig } from "../../shared/utils/notificacionTipos"; // <--- Ruta compartida

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'no_leidas', label: 'No leídas' },
  { id: 'leidas', label: 'Leídas' },
];

export default function Notificaciones() {
  const { notificaciones, loading, unreadCount, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones();
  const [filtro, setFiltro] = useState('todas');

  const notificacionesFiltradas = useMemo(() => {
    if (filtro === 'no_leidas') return notificaciones.filter(n => !n.leida);
    if (filtro === 'leidas') return notificaciones.filter(n => n.leida);
    return notificaciones;
  }, [notificaciones, filtro]);

  const mensajeVacio =
    filtro === 'no_leidas'
      ? 'No tienes notificaciones sin leer.'
      : filtro === 'leidas'
      ? 'No tienes notificaciones leídas todavía.'
      : 'No tienes notificaciones por el momento.';

  return (
    <Layout>
      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-[calc(100vh-64px)]">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="mb-6 shrink-0 flex items-start justify-between gap-4 flex-wrap">

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Todas las Notificaciones
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Historial de alertas y avisos asociados a tus proyectos y actividades.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#b1122b] hover:text-[#941020] transition-colors shrink-0"
              >
                <FiCheckSquare className="text-base" />
                Marcar todas como leídas
              </button>
            )}

          </div>

          {/* =====================================================
              BARRA DE FILTROS
          ===================================================== */}

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">

            <div className="flex items-center gap-2 flex-wrap">

              {FILTROS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-4 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    filtro === f.id
                      ? 'bg-[#b1122b] text-white'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                  {f.id === 'no_leidas' && unreadCount > 0 && (
                    <span className={`ml-1.5 ${filtro === f.id ? 'text-white/80' : 'text-slate-400'}`}>
                      ({unreadCount})
                    </span>
                  )}
                </button>
              ))}

            </div>

          </div>

          {/* =====================================================
              LOADING / RESULTADOS
          ===================================================== */}

          {loading ? (

            <div className="flex flex-col items-center justify-center flex-1 py-12">

              <FiLoader className="animate-spin text-[#b1122b] text-4xl mb-4" />

              <span className="text-slate-500 font-medium">
                Cargando notificaciones...
              </span>

            </div>

          ) : notificacionesFiltradas.length === 0 ? (

            <div className="w-full min-h-[300px] border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white text-center p-8">

              <FiBell className="w-10 h-10 text-slate-300 mb-2" />

              <span className="text-slate-500 text-sm font-semibold">
                {mensajeVacio}
              </span>

              <span className="text-slate-400 text-xs mt-1">
                Aquí aparecerán tus notificaciones cuando existan.
              </span>

            </div>

          ) : (

            <div className="flex flex-col gap-3 mb-6">

              {notificacionesFiltradas.map(notificacion => {
                const tipoConfig = getTipoConfig(notificacion.tipo);
                const TipoIcon = tipoConfig.icon;

                return (
                  <div
                    key={notificacion.id}
                    className={`bg-white p-4 rounded-xl border transition-all flex gap-4 shadow-sm ${
                      notificacion.leida
                        ? 'border-slate-200'
                        : `${tipoConfig.border} ring-1 ${tipoConfig.ring}`
                    }`}
                  >

                    <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${tipoConfig.bg}`}>
                      <TipoIcon className={`text-lg ${tipoConfig.text}`} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex justify-between items-start mb-1 gap-4">

                        <div className="min-w-0">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mb-1 ${tipoConfig.text}`}>
                            {tipoConfig.label}
                          </span>

                          <h3 className={`text-sm font-bold ${notificacion.leida ? 'text-slate-700' : 'text-slate-900'}`}>
                            {notificacion.titulo}
                          </h3>
                        </div>

                        <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                          {(() => {
                            try {
                              const d = new Date(notificacion.created_at);
                              return isNaN(d) ? "Fecha no disponible" : format(d, "dd MMM yyyy, HH:mm", { locale: es });
                            } catch { return "Fecha no disponible"; }
                          })()}
                        </span>

                      </div>

                      <p className="text-xs text-slate-600 whitespace-pre-line mb-3">
                        {notificacion.mensaje}
                      </p>

                      {!notificacion.leida && (
                        <button
                          onClick={() => marcarComoLeida(notificacion.id)}
                          className="text-xs font-semibold text-[#b1122b] hover:text-[#941020] transition-colors"
                        >
                          Marcar como leída
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          )}

      </div>
    </Layout>
  );
}