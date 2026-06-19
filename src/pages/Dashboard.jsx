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

import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">

        <Topbar />

        <div className="dashboard-header">

          <div>
            <h1>Dashboard Institucional</h1>
            <p>Resumen general de proyectos RSU</p>
          </div>

          <div className="filters">
            <select>
              <option>Periodo 2024</option>
            </select>

            <select>
              <option>Todas las Facultades</option>
            </select>
          </div>

        </div>

        <div className="stats">

          <StatCard
            title="Total Proyectos"
            value="147"
            icon={<FiFolder />}
            color="blue"
          />

          <StatCard
            title="Aprobados"
            value="89"
            icon={<FiCheckCircle />}
            color="green"
          />

          <StatCard
            title="Finalizados"
            value="52"
            icon={<FiFlag />}
            color="purple"
          />

          <StatCard
            title="Beneficiarios"
            value="12,840"
            icon={<FiUsers />}
            color="yellow"
          />

          <StatCard
            title="Presupuesto Ejec."
            value="S/ 487.2K"
            icon={<FiCreditCard />}
            color="gray"
          />

          <StatCard
            title="Cumplimiento Metas"
            value="78%"
            icon={<FiTarget />}
            color="red"
          />

        </div>

        <div className="charts">
          <BarChartBox />
          <LineChartBox />
        </div>

        <div className="bottom">
          <PieChartBox />
          <ActivityBox />
        </div>

      </div>
    </div>
  );
}