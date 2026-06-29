import React from 'react';
import { FiUser, FiCalendar, FiBook } from "react-icons/fi"; // Agregué FiBook para la facultad

export default function ProjectCard({ id, title, author, faculty, progress, status, tag }) {
  // Convertimos a minúsculas y reemplazamos espacios por guiones para las claves de color
  const statusKey = status ? status.toLowerCase().replace(" ", "-") : "borrador";

  // Mapeo de colores para los estados (Tal cual lo tenías)
  const statusColors = {
    "en-ejecución": "bg-blue-100 text-blue-700",
    "aprobado": "bg-emerald-100 text-emerald-700",
    "finalizado": "bg-purple-100 text-purple-700",
    "en-revisión": "bg-amber-100 text-amber-700",
    "observado": "bg-red-100 text-red-700",
    "borrador": "bg-slate-100 text-slate-700"
  };

  const progressColors = {
    "en-ejecución": "bg-blue-500",
    "aprobado": "bg-emerald-500",
    "finalizado": "bg-purple-500",
    "en-revisión": "bg-amber-500",
    "observado": "bg-red-500",
    "borrador": "bg-slate-400"
  };

  const currentStatusColor = statusColors[statusKey] || "bg-slate-100 text-slate-700";
  const currentProgressColor = progressColors[statusKey] || "bg-slate-400";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {id}
        </span>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${currentStatusColor}`}>
          {status}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2 mb-4">
        {title}
      </h3>

      <div className="flex flex-col gap-2 text-xs text-slate-500 mb-6">
        <p className="flex items-center gap-2">
          <FiUser className="text-slate-400" />
          <span className="truncate">{author}</span>
        </p>
        <p className="flex items-center gap-2">
          <FiBook className="text-slate-400" /> {/* Cambiado a FiBook para facultad */}
          <span className="truncate">{faculty}</span>
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Avance</span>
          <span>{progress ?? 0}%</span> {/* Si viene nulo, muestra 0 */}
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${currentProgressColor}`}
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
          {tag || "Sin Eje"}
        </span>
      </div>

    </div>
  );
}