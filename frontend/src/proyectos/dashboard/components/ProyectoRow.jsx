import { FiFolder } from "react-icons/fi";
import EstadoBadge from "./EstadoBadge";

export default function ProyectoRow({ proyecto }) {
  return (
    <div className="group flex min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7B1E3A]/10">
          <FiFolder className="text-sm text-[#7B1E3A]" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            title={proyecto.titulo || "Sin título"}
            className="max-w-[260px] truncate text-sm font-medium text-slate-800"
          >
            {proyecto.titulo || "Sin título"}
          </p>

          <p className="mt-0.5 break-words text-xs text-slate-400">
            {proyecto.codigo || `#${proyecto.id}`}
            {proyecto.periodo?.nombre
              ? ` · ${proyecto.periodo.nombre}`
              : ""}
          </p>
        </div>
      </div>

      <div className="max-w-[45%] shrink-0">
        <EstadoBadge estado={proyecto.estado} />
      </div>
    </div>
  );
}