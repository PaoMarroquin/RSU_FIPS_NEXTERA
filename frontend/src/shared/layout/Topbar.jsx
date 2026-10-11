import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiCheckSquare,
  FiMenu,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { authService } from "../auth/authService";
import { tokenStore } from "../auth/tokenStore";
import { notificacionApi } from "../api/proyectos/notificacionApi";
import { getTipoConfig } from "../utils/notificacionTipos";

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const data = await notificacionApi.obtenerNotificaciones();
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setNotificaciones(lista);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarComoLeida = useCallback(async (id) => {
    try {
      await notificacionApi.marcarNotificacionLeida(id);

      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  }, []);

  const marcarTodasComoLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);

    if (pendientes.length === 0) return;

    try {
      await Promise.all(
        pendientes.map((n) =>
          notificacionApi.marcarNotificacionLeida(n.id)
        )
      );

      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, leida: true }))
      );
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  }, [notificaciones]);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const [userData, setUserData] = useState({
    name: localStorage.getItem("user_name") || "Usuario",
    role: localStorage.getItem("user_role") || "Sin rol",
    email: localStorage.getItem("user_email") || "correo@unsa.edu.pe",
    initial: "U",
  });

  useEffect(() => {
    let cancelled = false;

    const sincronizarUsuario = async () => {
      try {
        const data = await authService.getMiPerfil();

        if (cancelled) return;

        const nombreCompleto =
          `${data.nombres} ${data.apellidos || ""}`.trim();

        const actualizado = {
          name: nombreCompleto || data.correo_institucional,
          role:
            data.rol_nombre ||
            localStorage.getItem("user_role") ||
            "Sin rol",
          email: data.correo_institucional,
          initial: data.nombres
            ? data.nombres.charAt(0).toUpperCase()
            : "U",
        };

        setUserData(actualizado);

        localStorage.setItem("user_name", actualizado.name);
        localStorage.setItem("user_role", actualizado.role);
        localStorage.setItem("user_email", actualizado.email);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Error al sincronizar datos del topbar con el backend:",
          error
        );

        setUserData((prev) => ({
          ...prev,
          initial: prev.name.charAt(0).toUpperCase(),
        }));
      }
    };

    sincronizarUsuario();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = tokenStore.getRefreshToken();

      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      tokenStore.clear();
      navigate("/", { replace: true });
    }
  };

  const toggleNotifications = () => {
    setIsNotifOpen((prev) => !prev);
    setIsMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:gap-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Abrir menú de navegación"
          aria-controls="sidebar-navigation"
          aria-expanded={undefined}
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#b1122b] md:hidden"
        >
          <FiMenu className="text-xl" />
        </button>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-1 sm:gap-4 sm:pl-2 lg:gap-5">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notificaciones"
            aria-expanded={isNotifOpen}
            onClick={toggleNotifications}
            className={`relative rounded-full p-2 transition-colors ${
              isNotifOpen
                ? "bg-red-50 text-[#b1122b]"
                : "text-slate-400 hover:bg-slate-100 hover:text-[#b1122b]"
            }`}
          >
            <FiBell className="text-xl" />

            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3 min-w-3 items-center justify-center rounded-full border border-white bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-3 flex max-h-[min(420px,calc(100dvh-90px))] w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl duration-150">
              <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2 sm:px-4">
                <span className="text-sm font-bold text-slate-800">
                  Notificaciones
                </span>

                <div className="flex min-w-0 items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={marcarTodasComoLeidas}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#b1122b] transition-colors hover:text-[#8a0e21] sm:text-[11px]"
                    >
                      <FiCheckSquare className="shrink-0 text-sm" />
                      <span>Marcar todas</span>
                    </button>
                  )}

                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 sm:text-xs">
                    {unreadCount} nuevas
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No tienes notificaciones
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notificaciones.slice(0, 8).map((notif) => {
                      const tipoConfig = getTipoConfig(notif.tipo);
                      const TipoIcon = tipoConfig.icon;

                      return (
                        <div
                          key={notif.id}
                          className={`cursor-pointer border-b border-slate-50 p-3 transition-colors hover:bg-slate-50 sm:p-4 ${
                            !notif.leida ? "bg-red-50/30" : ""
                          }`}
                          onClick={() => {
                            if (!notif.leida) {
                              marcarComoLeida(notif.id);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tipoConfig.bg}`}
                            >
                              <TipoIcon
                                className={`text-base ${tipoConfig.text}`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <strong
                                className={`block break-words text-sm leading-snug ${
                                  !notif.leida
                                    ? "text-slate-800"
                                    : "text-slate-600"
                                }`}
                              >
                                {notif.titulo}
                              </strong>

                              <p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">
                                {notif.mensaje}
                              </p>

                              <span className="mt-2 block text-[10px] text-slate-400">
                                {formatDistanceToNow(
                                  new Date(notif.created_at),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-slate-100 bg-white px-4 pb-1 pt-2">
                <Link
                  to="/notificaciones"
                  onClick={() => setIsNotifOpen(false)}
                  className="block py-1.5 text-center text-xs font-semibold text-[#b1122b] transition-colors hover:text-[#8a0e21]"
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Abrir menú de usuario"
            aria-expanded={isMenuOpen}
            onClick={toggleUserMenu}
            className="flex max-w-[min(240px,45vw)] cursor-pointer items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-50 sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-base font-bold text-slate-600 sm:h-10 sm:w-10">
              {userData.initial}
            </div>

            <div className="hidden min-w-0 flex-col text-left md:flex">
              <strong className="max-w-[180px] truncate text-sm font-medium leading-tight text-slate-800 capitalize">
                {userData.name.toLowerCase()}
              </strong>

              <span className="mt-0.5 max-w-[180px] truncate text-[11px] uppercase tracking-wide text-slate-500">
                {userData.role}
              </span>
            </div>

            <FiChevronDown
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMenuOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-3 w-[min(260px,calc(100vw-24px))] origin-top-right rounded-2xl border border-slate-200 bg-white py-3 shadow-xl duration-150">
              <div className="px-4 pb-3 sm:px-5">
                <strong className="block break-words text-[15px] font-medium leading-snug text-slate-800 capitalize">
                  {userData.name.toLowerCase()}
                </strong>

                <span className="mb-3 block truncate text-[13px] text-slate-500">
                  {userData.email}
                </span>

                <span className="inline-block max-w-full break-words rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  {userData.role}
                </span>
              </div>

              <div className="my-1 h-px bg-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/configuracion");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#b1122b] sm:px-5"
              >
                <FiUser className="shrink-0 text-lg text-slate-500" />
                Mi Perfil
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-red-600 transition-colors hover:bg-red-50 sm:px-5"
              >
                <FiLogOut className="shrink-0 text-lg" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}