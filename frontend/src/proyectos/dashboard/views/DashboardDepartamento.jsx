import { FiFolder, FiEye, FiCheckCircle, FiFlag } from "react-icons/fi";
import StatCard from "../../../shared/components/StatCard";
import ProyectoRow from "../components/ProyectoRow";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function DashboardDepartamento({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter((p) => p.estado === "en_revision").length;
  const aprobados = proyectos.filter((p) => p.estado === "aprobado").length;
  const observados = proyectos.filter((p) => p.estado === "observado").length;

  const pendientes = proyectos
    .filter((p) => p.estado === "en_revision")
    .sort((a, b) => new Date(a.fecha_envio_revision || a.created_at) - new Date(b.fecha_envio_revision || b.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Proyectos" value={String(total)} icon={<FiFolder />} color="blue" />
        <StatCard title="En Revisión" value={String(enRevision)} icon={<FiEye />} color="yellow" />
        <StatCard title="Aprobados" value={String(aprobados)} icon={<FiCheckCircle />} color="green" />
        <StatCard title="Observados" value={String(observados)} icon={<FiFlag />} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Pendientes de revisión</h2>
            <p className="text-xs text-slate-400 mt-0.5">Proyectos con mayor antigüedad en cola</p>
          </div>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
            {enRevision}
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {pendientes.length === 0 ? (
            <EmptyState mensaje="No hay proyectos pendientes de revisión." />
          ) : (
            pendientes.map((p) => <ProyectoRow key={p.id} proyecto={p} />)
          )}
        </div>
      </div>
    </div>
  );
}