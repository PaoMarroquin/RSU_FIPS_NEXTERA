import React from "react";
import { FiUser, FiBook } from "react-icons/fi";
import ProjectActions from "./ProjectActions";
import { STATUS_COLORS, PROGRESS_COLORS, getStatusKey } from "./projectConstants";

export default function ProjectCard({
  id,
  title,
  author,
  faculty,
  progress,
  status,
  tag,
  ejes_rsu_info,
  onEdit,
  onDelete,
  onView,
}) {
  const statusKey = getStatusKey(status);
  const currentStatusColor = STATUS_COLORS[statusKey] || "bg-slate-100 text-slate-700";
  const currentProgressColor = PROGRESS_COLORS[statusKey] || "bg-slate-400";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
      {/* CABECERA (ID y Estado) */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {id}
        </span>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${currentStatusColor}`}
        >
          {status}
        </span>
      </div>

      {/* TÍTULO */}
      <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2 mb-4" title={title}>
        {title}
      </h3>

      {/* DETALLES (Autor y Facultad) */}
      <div className="flex flex-col gap-2 text-xs text-slate-500 mb-6">
        <p className="flex items-center gap-2">
          <FiUser className="text-slate-400 shrink-0" />
          <span className="truncate">{author}</span>
        </p>
        <p className="flex items-center gap-2">
          <FiBook className="text-slate-400 shrink-0" />
          <span className="truncate">{faculty}</span>
        </p>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Avance</span>
          <span>{progress ?? 0}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${currentProgressColor}`}
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* FOOTER (Tag y Botones de Acción) */}
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
          {ejes_rsu_info?.map((eje) => eje.nombre).join(", ") || "Sin Eje"}
          
        </span>

        <ProjectActions
          statusKey={statusKey}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}