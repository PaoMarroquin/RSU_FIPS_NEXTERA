import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import Layout from "../../shared/layout/Layout";
import { useNavigate } from "react-router-dom";
import { useProyectosDashboard } from "./hooks/useProyectosDashboard";
import DashboardHeader from "./DashboardHeader";
import DashboardDocente from "./views/DashboardDocente";
import DashboardDepartamento from "./views/DashboardDepartamento";
import DashboardAutoridad from "./views/DashboardAutoridad";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("user_role");
    return role ? role.toLowerCase() : "docente";
  });

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) setUserRole(role.toLowerCase());
  }, []);

  const { proyectos, loading, error } = useProyectosDashboard();
  if (userRole === "administrador") { // no renderizar nada
    navigate("/informes-consolidado", { replace: true });
    return null;
  }
  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <DashboardHeader userRole={userRole} loading={loading} />

        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {userRole === "docente" && <DashboardDocente proyectos={proyectos} loading={loading} />}
        {userRole === "departamento" && <DashboardDepartamento proyectos={proyectos} loading={loading} />}
        {(userRole === "autoridad" || userRole === "jefatura rsu") && (
          <DashboardAutoridad proyectos={proyectos} loading={loading} />
        )}
      </div>
    </Layout>
  );
}