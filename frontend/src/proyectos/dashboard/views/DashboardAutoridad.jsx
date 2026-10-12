import {
  FiFolder,
  FiEye,
  FiCheckCircle,
  FiTarget,
  FiFlag,
  FiUsers,
} from "react-icons/fi";
import StatCard from "../../../shared/components/StatCard";
import ProyectoRow from "../components/ProyectoRow";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function DashboardAutoridad({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter(
    (p) => p.estado === "en_revision"
  ).length;
  const aprobados = proyectos.filter(
    (p) => p.estado === "aprobado"
  ).length;
  const enEjecucion = proyectos.filter(
    (p) => p.estado === "en_ejecucion"
  ).length;
  const finalizados = proyectos.filter(
    (p) => p.estado === "finalizado"
  ).length;

  const recientes = [...proyectos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={String(total)} icon={<FiFolder />} color="blue" />
        <StatCard title="En Revisión" value={String(enRevision)} icon={<FiEye />} color="yellow" />
        <StatCard title="Aprobados" value={String(aprobados)} icon={<FiCheckCircle />} color="green" />
        <StatCard title="En Ejecución" value={String(enEjecucion)} icon={<FiTarget />} color="purple" />
        <StatCard title="Finalizados" value={String(finalizados)} icon={<FiFlag />} color="gray" />
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="break-words text-sm font-semibold text-slate-800">
              Actividad reciente
            </h2>
            <p className="mt-0.5 break-words text-xs text-slate-400">
              Últimos 5 proyectos registrados en el sistema
            </p>
          </div>
          <FiUsers className="shrink-0 text-lg text-slate-300" />
        </div>

        <div className="divide-y divide-slate-50">
          {recientes.length === 0 ? (
            <EmptyState mensaje="No hay proyectos en el sistema." />
          ) : (
            recientes.map((p) => (
              <ProyectoRow key={p.id} proyecto={p} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}