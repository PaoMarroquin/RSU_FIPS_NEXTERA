import { Link, useLocation } from "react-router-dom";
import { 
  FiGrid, 
  FiFolder, 
  FiCalendar, 
  FiFileText, 
  FiBook, 
  FiSettings, 
  FiBell, 
  FiCheckSquare, 
  FiPieChart, 
  FiUsers 
} from "react-icons/fi";

export default function Sidebar() {
  const { pathname } = useLocation();

  const userRole = (localStorage.getItem('user_role') || 'docente').toLowerCase();

  const getLinkClass = (path) => {
    const isActive = pathname.startsWith(path);
    return `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${
      isActive 
        ? "bg-pink-50 text-[#7B1E3A]" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  return (
    <aside className="w-[230px] h-screen bg-white fixed left-0 top-0 border-r border-slate-200 flex flex-col z-30">
      
      {/* HEADER LOGO (Granate UNSA) */}
      <div className="h-[72px] flex items-center gap-3 px-5 border-b border-slate-200 shrink-0">
        <div className="w-[34px] h-[34px] bg-[#7B1E3A] text-white rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm">
          UNSA
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">RSU Gestión</span>
      </div>

      {/* MENÚ DE NAVEGACIÓN SEPARADO POR ROLES */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        
        
        {/*MENÚ: DOCENTE */}
        {userRole === "docente" && (
          <>
            <Link className={getLinkClass("/dashboard")} to="/dashboard">
              <FiGrid className="text-lg" /> Dashboard
            </Link>
            <Link className={getLinkClass("/proyectos")} to="/proyectos">
              <FiFolder className="text-lg" /> Mis Proyectos
            </Link>
            <Link className={getLinkClass("/actividades")} to="/actividades">
              <FiCalendar className="text-lg" /> Mis Actividades
            </Link>
            <Link className={getLinkClass("/notificaciones")} to="/notificaciones">
            <FiBell className="text-lg" /> Notificaciones
          </Link>
          </>
        )}

        {/*MENÚ: DEPARTAMENTO */}
        {userRole === "departamento" && (
          <>
            <Link className={getLinkClass("/dashboard")} to="/dashboard">
              <FiGrid className="text-lg" /> Dashboard
            </Link>
            <Link className={getLinkClass("/proyectos")} to="/proyectos">
              <FiFolder className="text-lg" /> Proyectos Departamento
            </Link>
            <Link className={getLinkClass("/evaluacion")} to="/evaluacion">
              <FiCheckSquare className="text-lg" /> Evaluar Proyectos
            </Link>
            <Link className={getLinkClass("/usuarios")} to="/usuarios">
              <FiUsers className="text-lg" /> Usuarios
            </Link>
          </>
        )}

        {/* MENÚ: AUTORIDAD */}
        {userRole === "autoridad" && (
          <>
            <Link className={getLinkClass("/todos-proyectos")} to="/proyectos">
              <FiFolder className="text-lg" /> Todo RSU
            </Link>
            <Link className={getLinkClass("/reportes")} to="/informes">
              <FiFileText className="text-lg" /> Reportes FIPS
            </Link>
          </>
        )}

        {/* ======================================= */}
        {/* HERRAMIENTAS GENERALES                  */}
        {/* ======================================= */}
        <div className="border-t border-slate-100 my-2"></div>

        <Link className={getLinkClass("/repositorio")} to="/repositorio">
          <FiBook className="text-lg" /> Repositorio
        </Link>
        <Link className={getLinkClass("/configuracion")} to="/configuracion">
          <FiSettings className="text-lg" /> Configuración
        </Link>
      </nav>
      
    </aside>
  );
}