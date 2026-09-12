import { FiFolder } from "react-icons/fi";
import EstadoBadge from "./EstadoBadge";

export default function ProyectoRow({ proyecto }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#7B1E3A]/10 flex items-center justify-center flex-shrink-0">
          <FiFolder className="text-[#7B1E3A] text-sm" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate max-w-[260px]">
            {proyecto.titulo || "Sin título"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {proyecto.codigo || `#${proyecto.id}`}
            {proyecto.periodo?.nombre ? ` · ${proyecto.periodo.nombre}` : ""}
          </p>
        </div>
      </div>
      <EstadoBadge estado={proyecto.estado} />
    </div>
  );
}