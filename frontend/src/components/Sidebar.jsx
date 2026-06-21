import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFolder,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiFileText,
  FiBook,
  FiSettings
} from "react-icons/fi";

import "../styles/sidebar.css";

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logo-square">UNSA</div>
        <span>RSU Gestión</span>
      </div>

      <nav>

        <Link
          className={pathname === "/dashboard" ? "active" : ""}
          to="/dashboard"
        >
          <FiGrid />
          Dashboard
        </Link>

        <Link
          className={pathname === "/proyectos" ? "active" : ""}
          to="/proyectos"
        >
          <FiFolder />
          Proyectos
        </Link>

        <Link to="/actividades">
          <FiCalendar />
          Actividades
        </Link>

        <Link to="#">
          <FiDollarSign />
          Presupuesto
        </Link>

        <Link to="#">
          <FiTrendingUp />
          Avances
        </Link>

        <Link to="#">
          <FiFileText />
          Informes
        </Link>

        <Link to="#">
          <FiBook />
          Repositorio
        </Link>

        <Link to="#">
          <FiSettings />
          Configuración
        </Link>

      </nav>

    </aside>
  );
}