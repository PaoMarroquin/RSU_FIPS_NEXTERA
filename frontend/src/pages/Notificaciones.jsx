import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../api/axiosConfig";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const response = await api.get("/api/v1/notificaciones/");
        const data = response.data;
        const lista = Array.isArray(data) ? data : (data?.results || []);
        setNotificaciones(lista);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotificaciones();
  }, []);

  const marcarComoLeida = async (id) => {
    try {
      await api.patch(`/api/v1/notificaciones/${id}/leer/`);
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error("Error al marcar notificacion como leida:", error);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 ml-[230px] flex flex-col h-screen">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Todas las Notificaciones</h1>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-[#b1122b] border-t-transparent rounded-full"></div>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                No tienes notificaciones por el momento.
              </div>
            ) : (
              <div className="space-y-4">
                {notificaciones.map(notificacion => (
                  <div 
                    key={notificacion.id}
                    className={`bg-white p-5 rounded-xl border transition-all ${
                      notificacion.leida 
                        ? 'border-slate-200' 
                        : 'border-[#b1122b]/30 shadow-md ring-1 ring-[#b1122b]/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold ${notificacion.leida ? 'text-slate-700' : 'text-[#b1122b]'}`}>
                        {notificacion.titulo}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">
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
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
