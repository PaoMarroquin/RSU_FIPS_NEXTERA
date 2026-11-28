import { Link, useLocation } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { NAV_BY_ROLE, NAV_COMUN } from "./navConfig";

export default function Sidebar({ isOpen = false, onClose }) {
  const { pathname } = useLocation();
  const userRole = (localStorage.getItem("user_role") || "").toLowerCase();

  const getLinkClass = (path) => {
    const isActive =
      pathname === path || pathname.startsWith(`${path}/`);

    return `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-pink-50 text-[#7B1E3A]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  const items = NAV_BY_ROLE[userRole] || [];

  const renderLink = ({ to, icon: Icon, label }) => (
    <Link
      key={to}
      className={getLinkClass(to)}
      to={to}
      onClick={onClose}
    >
      <Icon className="shrink-0 text-lg" />
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[230px] max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
          {/* Logo integrado y adaptado al header del Sidebar */}
          <div className="flex items-center gap-2.5">
            <img
              src="/img/Escudo_UNSA.png"
              alt="Escudo UNSA"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <div className="h-8 w-[1.5px] shrink-0 bg-slate-800" />
            <div className="flex flex-col text-left">
              <span className="text-xl font-light leading-none tracking-wide text-slate-600">
                <strong className="font-bold text-[#7B1E3A]">RSU</strong>
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7B1E3A]">
                FIPS
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 py-4">
          {items.map(renderLink)}

          {NAV_COMUN.length > 0 && (
            <div className="my-2 border-t border-slate-100" />
          )}

          {NAV_COMUN.map(renderLink)}
        </nav>
      </aside>
    </>
  );
}