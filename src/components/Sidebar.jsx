import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiFolder, FiCalendar, FiDollarSign, FiTrendingUp, FiFileText, FiBook, FiSettings } from "react-icons/fi";

export default function Sidebar() {
  const { pathname } = useLocation();

  const getLinkClass = (path) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
      isActive 
        ? "bg-red-50 text-[#b1122b]" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  return (
    /* w-[230px] define el ancho, fixed lo ancla a la izquierda, z-30 lo pone por encima de todo */
    <aside className="w-[230px] h-screen bg-white fixed left-0 top-0 border-r border-slate-200 flex flex-col z-30">
      
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
        <div className="w-[34px] h-[34px] bg-[#b1122b] text-white rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm">
          UNSA
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">RSU Gestión</span>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <Link className={getLinkClass("/dashboard")} to="/dashboard"><FiGrid className="text-lg" /> Dashboard</Link>
        <Link className={getLinkClass("/proyectos")} to="/proyectos"><FiFolder className="text-lg" /> Proyectos</Link>
        <Link className={getLinkClass("/actividades")} to="/actividades"><FiCalendar className="text-lg" /> Actividades</Link>
        <Link className={getLinkClass("/presupuesto")} to="#"><FiDollarSign className="text-lg" /> Presupuesto</Link>
        <Link className={getLinkClass("/avances")} to="#"><FiTrendingUp className="text-lg" /> Avances</Link>
        <Link className={getLinkClass("/informes")} to="#"><FiFileText className="text-lg" /> Informes</Link>
        <Link className={getLinkClass("/repositorio")} to="#"><FiBook className="text-lg" /> Repositorio</Link>
        <Link className={getLinkClass("/configuracion")} to="#"><FiSettings className="text-lg" /> Configuración</Link>
      </nav>
      
    </aside>
  );
}