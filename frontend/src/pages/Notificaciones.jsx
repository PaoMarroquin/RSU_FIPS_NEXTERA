import React, { useState, useMemo } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCheckSquare, FiBell } from "react-icons/fi";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { getTipoConfig } from "../utils/notificacionTipos";

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

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 ml-[230px] flex flex-col h-screen">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Todas las Notificaciones</h1>
              {unreadCount > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#b1122b] hover:text-[#8a0e21] transition-colors"
                >
                  <FiCheckSquare className="text-base" />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6">
              {FILTROS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    filtro === f.id
                      ? 'bg-[#b1122b] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#b1122b]/40'
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

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-[#b1122b] border-t-transparent rounded-full"></div>
              </div>
            ) : notificacionesFiltradas.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <FiBell className="text-3xl text-slate-300" />
                {filtro === 'no_leidas'
                  ? 'No tienes notificaciones sin leer.'
                  : filtro === 'leidas'
                  ? 'No tienes notificaciones leídas todavía.'
                  : 'No tienes notificaciones por el momento.'}
              </div>
            ) : (
              <div className="space-y-4">
                {notificacionesFiltradas.map(notificacion => {
                  const tipoConfig = getTipoConfig(notificacion.tipo);
                  const TipoIcon = tipoConfig.icon;
                  return (
                    <div
                      key={notificacion.id}
                      className={`bg-white p-5 rounded-xl border transition-all flex gap-4 ${
                        notificacion.leida
                          ? 'border-slate-200'
                          : `${tipoConfig.border} shadow-md ring-1 ${tipoConfig.ring}`
                      }`}
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${tipoConfig.bg}`}>
                        <TipoIcon className={`text-lg ${tipoConfig.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start mb-1 gap-4">
                          <div className="min-w-0">
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide mb-1 ${tipoConfig.text}`}>
                              {tipoConfig.label}
                            </span>
                            <h3 className={`font-bold ${notificacion.leida ? 'text-slate-700' : 'text-slate-900'}`}>
                              {notificacion.titulo}
                            </h3>
                          </div>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            {(() => {
                              try {
                                const d = new Date(notificacion.created_at);
                                return isNaN(d) ? "Fecha no disponible" : format(d, "dd MMM yyyy, HH:mm", { locale: es });
                              } catch { return "Fecha no disponible"; }
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-line mb-3">
                          {notificacion.mensaje}
                        </p>

                        {!notificacion.leida && (
                          <button
                            onClick={() => marcarComoLeida(notificacion.id)}
                            className="text-xs font-semibold text-[#b1122b] hover:text-[#8a0e21] transition-colors"
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
        </main>
      </div>
    </div>
  );
}
