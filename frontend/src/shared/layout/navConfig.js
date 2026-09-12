import { FiGrid, FiFolder, FiCalendar, FiBell, FiCheckSquare, FiUsers, FiFileText, FiMap, FiBook, FiSettings } from "react-icons/fi";

export const NAV_BY_ROLE = {
  docente: [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos", icon: FiFolder, label: "Mis Proyectos" },
    { to: "/actividades", icon: FiCalendar, label: "Mis Actividades" },
    { to: "/informes", icon: FiCalendar, label: "Informe" },
    { to: "/notificaciones", icon: FiBell, label: "Notificaciones" },
  ],
  departamento: [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos", icon: FiFolder, label: "Proyectos Departamento" },
    { to: "/evaluacion", icon: FiCheckSquare, label: "Evaluar Proyectos" },
    { to: "/usuarios", icon: FiUsers, label: "Usuarios" },
  ],
  autoridad: [
    { to: "/proyectos", icon: FiFolder, label: "Todo RSU" },
    { to: "/informes", icon: FiFileText, label: "Reportes FIPS" },
  ],
  "jefatura rsu": [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos-jefatura", icon: FiFolder, label: "Proyectos RSU" },
    { to: "/matriz-operativa", icon: FiMap, label: "Matriz Operativa" },
  ],
};

export const NAV_COMUN = [
  { to: "/repositorio", icon: FiBook, label: "Repositorio" },
  { to: "/configuracion", icon: FiSettings, label: "Configuración" },
];