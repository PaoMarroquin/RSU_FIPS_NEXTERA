import { Link, useLocation } from "react-router-dom";
import { NAV_BY_ROLE, NAV_COMUN } from "./navConfig";

export default function Sidebar() {
  const { pathname } = useLocation();
  const userRole = (localStorage.getItem("user_role") || "").toLowerCase();

  const getLinkClass = (path) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
      isActive ? "bg-pink-50 text-[#7B1E3A]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  const items = NAV_BY_ROLE[userRole] || [];

  return (
    <aside className="w-[230px] h-screen bg-white fixed left-0 top-0 border-r border-slate-200 flex flex-col z-30">
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
        <div className="w-[34px] h-[34px] bg-[#7B1E3A] text-white rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm">
          UNSA
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">RSU Gestión</span>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <Link key={to} className={getLinkClass(to)} to={to}>
            <Icon className="text-lg" /> {label}
          </Link>
        ))}

        <div className="border-t border-slate-100 my-2" />

        {NAV_COMUN.map(({ to, icon: Icon, label }) => (
          <Link key={to} className={getLinkClass(to)} to={to}>
            <Icon className="text-lg" /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}