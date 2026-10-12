import { HEADER } from "./constants/estados";

export default function DashboardHeader({ userRole, loading }) {
  const header = HEADER[userRole] || HEADER.autoridad;

  return (
    <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
      <div className="min-w-0">
        <h1 className="m-0 break-words text-xl font-bold text-slate-800 sm:text-2xl">
          {header.title}
        </h1>
        <p className="mt-1 break-words text-sm text-slate-500">
          {header.subtitle}
        </p>
      </div>

      {loading && (
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400">
          <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#7B1E3A]/30 border-t-[#7B1E3A]" />
          Actualizando…
        </div>
      )}
    </div>
  );
}