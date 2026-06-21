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
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[230px] flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 md:p-8">
         
          {/* HEADER DEL DASHBOARD */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 m-0">Dashboard Institucional</h1>
              <p className="text-sm text-slate-500 mt-1">Resumen general de proyectos RSU</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] cursor-pointer w-full md:w-auto">
                <option>Periodo 2024</option>
              </select>

              <select className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] cursor-pointer w-full md:w-auto">
                <option>Todas las Facultades</option>
              </select>
            </div>
          </div>

          {/* ESTADÍSTICAS (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Total Proyectos" value="147" icon={<FiFolder />} color="blue" />
            <StatCard title="Aprobados" value="89" icon={<FiCheckCircle />} color="green" />
            <StatCard title="Finalizados" value="52" icon={<FiFlag />} color="purple" />
            <StatCard title="Beneficiarios" value="12,840" icon={<FiUsers />} color="yellow" />
            <StatCard title="Presupuesto Ejec." value="S/ 487.2K" icon={<FiCreditCard />} color="gray" />
            <StatCard title="Cumplimiento Metas" value="78%" icon={<FiTarget />} color="red" />
          </div>

          {/* GRÁFICOS SUPERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <BarChartBox />
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <LineChartBox />
            </div>
          </div>

          {/* GRÁFICOS INFERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
              <PieChartBox />
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <ActivityBox />
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}