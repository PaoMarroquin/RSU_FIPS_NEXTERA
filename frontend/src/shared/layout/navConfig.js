import { FiGrid, FiFolder, FiCalendar, FiBell, FiCheckSquare, FiUsers, FiFileText, FiMap, FiBook, FiSettings, FiCheckCircle,FiClipboard, FiBarChart2 } from "react-icons/fi";
export const NAV_BY_ROLE = {
  docente: [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos", icon: FiFolder, label: "Mis Proyectos" },
    { to: "/actividades", icon: FiClipboard, label: "Mis Actividades" },
    { to: "/informesFinalizacion", icon: FiFileText, label: "Informe de Finalización" },
    { to: "/informes", icon: FiBarChart2, label: "Mis informes" },
    { to: "/notificaciones", icon: FiBell, label: "Notificaciones" },
  ],
  departamento: [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos", icon: FiFolder, label: "Proyectos Departamento" },
    { to: "/evaluacion", icon: FiCheckSquare, label: "Evaluar Proyectos" },
    { to: "/FinalizarProyectos", icon: FiCheckCircle, label: "Proyectos por finalizar" },
    { to: "/informes", icon: FiBarChart2, label: "Informes Departamento" },
    { to: "/informes-consolidado", icon: FiFileText, label: "Reportes" },

  ],
  autoridad: [
    { to: "/proyectos", icon: FiFolder, label: "Todo RSU" },
    { to: "/informes-consolidado", icon: FiFileText, label: "Reportes" },
  ],
  "jefatura rsu": [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/proyectos-jefatura", icon: FiFolder, label: "Proyectos RSU" },
    { to: "/matriz-operativa", icon: FiMap, label: "Matriz Operativa" },
        { to: "/informes", icon: FiBarChart2, label: "Informes" },

    { to: "/informes-consolidado", icon: FiFileText, label: "Reportes" },

  ],
  administrador :[
    { to: "/usuarios", icon: FiUsers, label: "Usuarios" },
    { to: "/informes-consolidado", icon: FiFileText, label: "Reportes" },

  ],
};

export const NAV_COMUN = [
  { to: "/repositorio", icon: FiBook, label: "Repositorio" },
  { to: "/configuracion", icon: FiSettings, label: "Configuración" },
];