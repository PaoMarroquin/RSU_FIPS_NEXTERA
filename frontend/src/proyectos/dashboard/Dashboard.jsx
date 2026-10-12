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

  useEffect(() => {
    if (userRole === "administrador") {
      navigate("/informes-consolidado", { replace: true });
    }
  }, [userRole, navigate]);

  const { proyectos, loading, error } = useProyectosDashboard();

  if (userRole === "administrador") return null;

  return (
    <Layout>
      <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6 md:p-8">
        <DashboardHeader userRole={userRole} loading={loading} />

        {error && !loading && (
          <div className="flex min-w-0 items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 sm:px-4">
            <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        {userRole === "docente" && (
          <DashboardDocente proyectos={proyectos} loading={loading} />
        )}

        {userRole === "departamento" && (
          <DashboardDepartamento proyectos={proyectos} loading={loading} />
        )}

        {(userRole === "autoridad" || userRole === "jefatura rsu") && (
          <DashboardAutoridad proyectos={proyectos} loading={loading} />
        )}
      </div>
    </Layout>
  );
}