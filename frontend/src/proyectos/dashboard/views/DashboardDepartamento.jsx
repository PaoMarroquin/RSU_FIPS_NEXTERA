import {
  FiFolder,
  FiEye,
  FiCheckCircle,
  FiFlag,
} from "react-icons/fi";
import StatCard from "../../../shared/components/StatCard";
import ProyectoRow from "../components/ProyectoRow";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function DashboardDepartamento({ proyectos, loading }) {
  if (loading) return <LoadingSpinner />;

  const total = proyectos.length;
  const enRevision = proyectos.filter(
    (p) => p.estado === "en_revision"
  ).length;
  const aprobados = proyectos.filter(
    (p) => p.estado === "aprobado"
  ).length;
  const observados = proyectos.filter(
    (p) => p.estado === "observado"
  ).length;

  const pendientes = proyectos
    .filter((p) => p.estado === "en_revision")
    .sort(
      (a, b) =>
        new Date(a.fecha_envio_revision || a.created_at) -
        new Date(b.fecha_envio_revision || b.created_at)
    )
    .slice(0, 5);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Proyectos" value={String(total)} icon={<FiFolder />} color="blue" />
        <StatCard title="En Revisión" value={String(enRevision)} icon={<FiEye />} color="yellow" />
        <StatCard title="Aprobados" value={String(aprobados)} icon={<FiCheckCircle />} color="green" />
        <StatCard title="Observados" value={String(observados)} icon={<FiFlag />} color="purple" />
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="break-words text-sm font-semibold text-slate-800">
              Pendientes de revisión
            </h2>
            <p className="mt-0.5 break-words text-xs text-slate-400">
              Proyectos con mayor antigüedad en cola
            </p>
          </div>

          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
            {enRevision}
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {pendientes.length === 0 ? (
            <EmptyState mensaje="No hay proyectos pendientes de revisión." />
          ) : (
            pendientes.map((p) => (
              <ProyectoRow key={p.id} proyecto={p} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}