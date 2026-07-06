import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BarChartBox from "../components/BarChartBox";
import LineChartBox from "../components/LineChartBox";
import PieChartBox from "../components/PieChartBox";
import ActivityBox from "../components/ActivityBox";

import {
  FiFolder,
  FiCheckCircle,
  FiFlag,
  FiUsers,
  FiCreditCard,
  FiTarget
} from "react-icons/fi";

export default function Dashboard() {
  // 🔄 CORRECCIÓN AQUÍ: Agregamos .toLowerCase() al leer del localStorage para asegurar 
  // que si viene "Departamento" o "Autoridad", React lo entienda perfectamente en las condiciones de abajo.
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("user_role");
    return role ? role.toLowerCase() : "docente";
  });

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) {
      setUserRole(role.toLowerCase());
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8 space-y-6">
          
          {/* HEADER DINÁMICO */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">
                {userRole === "docente" && "Panel del Docente"}
                {userRole === "departamento" && "Gestión de Departamento"}
                {userRole === "autoridad" && "Dashboard Institucional (Autoridad)"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {userRole === "docente" && "Mis proyectos de Responsabilidad Social (RSU)"}
                {userRole === "departamento" && "Seguimiento y aprobación de proyectos del área"}
                {userRole === "autoridad" && "Resumen macro y cumplimiento de metas FIPS"}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A] cursor-pointer w-full md:w-auto">
                <option>Periodo 2026</option>
              </select>
            </div>
          </div>

          {/* ESTADÍSTICAS CONDICIONALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {userRole === "docente" ? (
              <>
                {/* Métricas específicas del docente */}
                <StatCard title="Mis Proyectos" value="3" icon={<FiFolder />} color="blue" />
                <StatCard title="En Ejecución" value="2" icon={<FiCheckCircle />} color="green" />
                <StatCard title="Horas RSU" value="45 hrs" icon={<FiTarget />} color="purple" />
                <StatCard title="Beneficiarios" value="320" icon={<FiUsers />} color="yellow" />
              </>
            ) : (
              <>
                {/* Métricas macro para Departamento y Autoridad */}
                <StatCard title="Total Proyectos" value="10" icon={<FiFolder />} color="blue" />
                <StatCard title="Aprobados" value="3" icon={<FiCheckCircle />} color="green" />
                <StatCard title="Finalizados" value="1" icon={<FiFlag />} color="purple" />
                <StatCard title="Beneficiarios" value="440" icon={<FiUsers />} color="yellow" />
                <StatCard title="Presupuesto" value="S/ 10 K" icon={<FiCreditCard />} color="gray" />
              </>
            )}
          </div>

          {/* GRÁFICOS CONDICIONALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userRole === "docente" ? (
              <>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <LineChartBox /> 
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <ActivityBox />
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <BarChartBox />
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <PieChartBox />
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}