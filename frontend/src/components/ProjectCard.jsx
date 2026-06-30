import React from 'react';
import { FiUser, FiBook, FiEdit2, FiTrash2 } from "react-icons/fi"; // Agregados iconos de edición y eliminación

export default function ProjectCard({ id, title, author, faculty, progress, status, tag, onEdit, onDelete }) {
  // Convertimos a minúsculas y reemplazamos espacios por guiones
  // Nota: Asegúrate de que las claves coincidan exactamente con lo que devuelve tu backend (con o sin tildes)
  const statusKey = status ? status.toLowerCase().replace(" ", "-") : "borrador";

  const statusColors = {
    "en-ejecución": "bg-blue-100 text-blue-700",
    "en-ejecucion": "bg-blue-100 text-blue-700", // Variante sin tilde por si acaso
    "aprobado": "bg-emerald-100 text-emerald-700",
    "finalizado": "bg-purple-100 text-purple-700",
    "en-revisión": "bg-amber-100 text-amber-700",
    "en-revision": "bg-amber-100 text-amber-700", // Variante sin tilde
    "observado": "bg-red-100 text-red-700",
    "borrador": "bg-slate-100 text-slate-700"
  };

  const progressColors = {
    "en-ejecución": "bg-blue-500",
    "en-ejecucion": "bg-blue-500",
    "aprobado": "bg-emerald-500",
    "finalizado": "bg-purple-500",
    "en-revisión": "bg-amber-500",
    "en-revision": "bg-amber-500",
    "observado": "bg-red-500",
    "borrador": "bg-slate-400"
  };

  const currentStatusColor = statusColors[statusKey] || "bg-slate-100 text-slate-700";
  const currentProgressColor = progressColors[statusKey] || "bg-slate-400";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
      
      {/* CABECERA (ID y Estado) */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {id}
        </span>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${currentStatusColor}`}>
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
          {tag || "Sin Eje"}
        </span>

        {/* ACCIONES (Editar y Eliminar) */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onEdit}
            title="Editar proyecto"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onDelete}
            title="Eliminar proyecto"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}