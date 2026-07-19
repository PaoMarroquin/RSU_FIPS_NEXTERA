import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiBell, FiSearch, FiChevronDown, FiUser, FiLogOut, FiCheckSquare } from "react-icons/fi";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { getTipoConfig } from "../utils/notificacionTipos";

export default function Topbar() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { notificaciones, unreadCount, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones();

  // Estado dinámico para los datos del usuario conectados al backend
  const [userData, setUserData] = useState({
    name: localStorage.getItem('user_name') || 'Usuario',
    role: localStorage.getItem('user_role') || 'Docente',
    email: localStorage.getItem('user_email') || 'correo@unsa.edu.pe',
    initial: 'U'
  });

  // 1. OBTENER DATOS EN TIEMPO REAL DESDE EL BACKEND (DJANGO)
  useEffect(() => {
    const sincronizarUsuario = async () => {
      try {
        const data = await authService.getMiPerfil();
        
        // Formateamos el nombre completo usando las variables del serializer
        const nombreCompleto = `${data.nombres} ${data.apellidos || ""}`.trim();
        
        const actualizado = {
          name: nombreCompleto || data.correo_institucional,
          role: data.rol_nombre || localStorage.getItem('user_role') || 'Docente',
          email: data.correo_institucional,
          initial: data.nombres ? data.nombres.charAt(0).toUpperCase() : 'U'
        };

        setUserData(actualizado);

        // Actualizamos de paso el localStorage para mantener sincronizada la app
        localStorage.setItem('user_name', actualizado.name);
        localStorage.setItem('user_role', actualizado.role);
        localStorage.setItem('user_email', actualizado.email);

      } catch (error) {
        console.error("Error al sincronizar datos del topbar con el backend:", error);
        // Si falla (ej. sin conexión), calculamos la inicial del fallback del localStorage
        setUserData(prev => ({
          ...prev,
          initial: prev.name.charAt(0).toUpperCase()
        }));
      }
    };

    sincronizarUsuario();
  }, []);

  // Función para cerrar el menú si el usuario hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      localStorage.clear();
      navigate('/'); 
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20 w-full">

      {/* BUSCADOR */}
      <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-lg w-full max-w-md focus-within:ring-2 focus-within:ring-[#b1122b]/20 focus-within:bg-white border border-transparent focus-within:border-[#b1122b] transition-all">
        <FiSearch className="text-slate-400 text-lg shrink-0" />
        <input
          type="text"
          placeholder="Buscar proyectos, usuarios, informes..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
        />
      </div>

      {/* ÁREA DE USUARIO */}
      <div className="flex items-center gap-5 ml-auto pl-4">
        
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button 
            className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-red-50 text-[#b1122b]' : 'text-slate-400 hover:bg-slate-100 hover:text-[#b1122b]'}`}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <FiBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 border border-white text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menú Desplegable Notificaciones */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white gap-2">
                <span className="font-bold text-slate-800">Notificaciones</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={marcarTodasComoLeidas}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#b1122b] hover:text-[#8a0e21] transition-colors"
                    >
                      <FiCheckSquare className="text-sm" />
                      Marcar todas
                    </button>
                  )}
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                </div>
              </div>
              {notificaciones.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No tienes notificaciones
                </div>
              ) : (
                <div className="flex flex-col">
                  {notificaciones.slice(0, 8).map(notif => {
                    const tipoConfig = getTipoConfig(notif.tipo);
                    const TipoIcon = tipoConfig.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.leida ? 'bg-red-50/30' : ''}`}
                        onClick={() => {
                          if (!notif.leida) marcarComoLeida(notif.id);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${tipoConfig.bg}`}>
                            <TipoIcon className={`text-base ${tipoConfig.text}`} />
                          </div>
                          <div className="min-w-0">
                            <strong className={`block text-sm leading-snug ${!notif.leida ? 'text-slate-800' : 'text-slate-600'}`}>
                              {notif.titulo}
                            </strong>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {notif.mensaje}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-4 pt-2 pb-1 border-t border-slate-100 sticky bottom-0 bg-white">
                <Link
                  to="/notificaciones"
                  onClick={() => setIsNotifOpen(false)}
                  className="block text-center text-xs font-semibold text-[#b1122b] hover:text-[#8a0e21] py-1.5 transition-colors"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        {/* PERFIL DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          
          {/* Botón que abre el menú */}
          <div 
            className="flex items-center gap-3 cursor-pointer p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-base select-none">
              {userData.initial}
            </div>
            <div className="hidden md:flex flex-col">
              <strong className="text-sm font-medium text-slate-800 leading-tight capitalize">
                {userData.name.toLowerCase()}
              </strong>
              <span className="text-[11px] text-slate-500 tracking-wide uppercase mt-0.5">
                {userData.role}
              </span>
            </div>
            <FiChevronDown className={`text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Menú Desplegable */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-[260px] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 origin-top-right animate-in fade-in slide-in-from-top-2">
              
              {/* Info del Usuario */}
              <div className="px-5 pb-3">
                <strong className="block text-[15px] font-medium text-slate-800 capitalize leading-snug">
                  {userData.name.toLowerCase()}
                </strong>
                <span className="block text-[13px] text-slate-500 mb-3 truncate">
                  {userData.email}
                </span>
                <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {userData.role}
                </span>
              </div>

              <div className="h-px bg-slate-100 my-1"></div>

              {/* Botón Mi Perfil */}
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/configuracion'); 
                }}
                className="w-full text-left px-5 py-2.5 text-[15px] text-slate-700 hover:bg-slate-50 hover:text-[#b1122b] flex items-center gap-3 transition-colors"
              >
                <FiUser className="text-lg text-slate-500" />
                Mi Perfil
              </button>

              {/* Botón Cerrar Sesión */}
              <button 
                onClick={handleLogout}
                className="w-full text-left px-5 py-2.5 text-[15px] text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <FiLogOut className="text-lg" />
                Cerrar Sesión
              </button>

            </div>
          )}

        </div>
      </div>

    </header>
  );
}