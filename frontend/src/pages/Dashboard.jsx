import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BarChartBox from "../components/BarChartBox";
import PieChartBox from "../components/PieChartBox";
import ActivityBox from "../components/ActivityBox";
import { proyectoService } from "../api/proyectoService";

import {
  FiFolder,
  FiCheckCircle,
  FiFlag,
  FiClock,
  FiTarget
} from "react-icons/fi";

const ESTADOS_EN_REVISION = ["en_revision", "observado", "corregido"];

export default function Dashboard() {
  // 🔄 CORRECCIÓN AQUÍ: Agregamos .toLowerCase() al leer del localStorage para asegurar
  // que si viene "Departamento" o "Autoridad", React lo entienda perfectamente en las condiciones de abajo.
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem("user_role");
    return role ? role.toLowerCase() : "docente";
  });
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) {
      setUserRole(role.toLowerCase());
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    proyectoService.getAllProyectos()
      .then((data) => {
        if (!cancelado) setProyectos(data);
      })
      .catch(() => {
        if (!cancelado) setProyectos([]);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => { cancelado = true; };
  }, []);

  const totalProyectos = proyectos.length;
  const aprobados = proyectos.filter((p) => p.estado === "aprobado").length;
  const enEjecucion = proyectos.filter((p) => p.estado === "en_ejecucion").length;
  const enRevision = proyectos.filter((p) => ESTADOS_EN_REVISION.includes(p.estado)).length;
  const rechazados = proyectos.filter((p) => p.estado === "rechazado").length;

  const actividadesPendientes = proyectos.reduce(
    (total, p) => total + (p.actividades || []).filter((a) => a.estado === "pendiente").length,
    0
  );

  const proyectosPorEstadoData = [
    { name: "Aprobados", value: aprobados },
    { name: "En Ejecución", value: enEjecucion },
    { name: "En Revisión", value: enRevision },
    { name: "Rechazados", value: rechazados },
  ].filter((d) => d.value > 0);

  const proyectosPorCarreraData = Object.entries(
    proyectos.reduce((acc, p) => {
      const carrera = p.escuela_nombre || "Sin escuela";
      acc[carrera] = (acc[carrera] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const proyectoParaCronograma =
    proyectos.find((p) => (p.cronograma || []).length > 0) || proyectos[0];

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
                {userRole === "jefatura rsu" && "Dashboard Jefatura RSU"}
                {userRole === "administrador" && "Dashboard Institucional (Administrador)"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {userRole === "docente" && "Mis proyectos de Responsabilidad Social (RSU)"}
                {userRole === "departamento" && "Seguimiento y aprobación de proyectos del área"}
                {userRole === "jefatura rsu" && "Seguimiento de proyectos RSU de la facultad"}
                {userRole === "administrador" && "Resumen macro y cumplimiento de metas FIPS"}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A] cursor-pointer w-full md:w-auto">
                <option>Periodo 2026</option>
              </select>
            </div>
          </div>

          {/* ESTADÍSTICAS CONDICIONALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {userRole === "docente" ? (
              <>
                {/* Métricas específicas del docente, con datos reales de sus proyectos */}
                <StatCard title="Mis Proyectos" value={loading ? "…" : totalProyectos} icon={<FiFolder />} color="blue" />
                <StatCard title="Aprobados" value={loading ? "…" : aprobados} icon={<FiCheckCircle />} color="green" />
                <StatCard title="En Revisión" value={loading ? "…" : enRevision} icon={<FiClock />} color="purple" />
                <StatCard title="Rechazados/Observados" value={loading ? "…" : rechazados} icon={<FiFlag />} color="red" />
                <StatCard title="Actividades Pendientes" value={loading ? "…" : actividadesPendientes} icon={<FiTarget />} color="yellow" />
              </>
            ) : (
              <>
                {/* Métricas para Departamento y Autoridad, con datos reales del área */}
                <StatCard title="Total Proyectos" value={loading ? "…" : totalProyectos} icon={<FiFolder />} color="blue" />
                <StatCard title="Aprobados" value={loading ? "…" : aprobados} icon={<FiCheckCircle />} color="green" />
                <StatCard title="En Revisión" value={loading ? "…" : enRevision} icon={<FiClock />} color="purple" />
                <StatCard title="Rechazados" value={loading ? "…" : rechazados} icon={<FiFlag />} color="red" />
              </>
            )}
          </div>

          {/* GRÁFICOS CONDICIONALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userRole === "docente" ? (
              <>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <PieChartBox title="Mis Proyectos por Estado" data={proyectosPorEstadoData} />
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <ActivityBox proyectoSeleccionado={proyectoParaCronograma} />
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <PieChartBox title="Proyectos por Estado" data={proyectosPorEstadoData} />
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <BarChartBox title="Proyectos por Carrera" data={proyectosPorCarreraData} />
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
