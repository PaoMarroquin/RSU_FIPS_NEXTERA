import { HEADER } from "./constants/estados";

export default function DashboardHeader({ userRole, loading }) {
  const header = HEADER[userRole] || HEADER.autoridad;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 m-0">{header.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{header.subtitle}</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          <div className="w-3 h-3 border-2 border-[#7B1E3A]/30 border-t-[#7B1E3A] rounded-full animate-spin" />
          Actualizando…
        </div>
      )}
    </div>
  );
}