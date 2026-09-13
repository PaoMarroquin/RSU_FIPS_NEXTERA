import React from "react";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function ProjectActions({ statusKey, onView, onEdit, onDelete }) {
  const canEditProject = onEdit && !["en_revision", "aprobado"].includes(statusKey);
  const canDeleteProject = onDelete && statusKey === "borrador";

  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button
          onClick={onView}
          title="Ver expediente"
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
        >
          <FiEye className="w-4 h-4" />
        </button>
      )}

      {canEditProject && (
        <button
          onClick={onEdit}
          title="Editar proyecto"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <FiEdit2 className="w-4 h-4" />
        </button>
      )}

      {canDeleteProject && (
        <button
          onClick={onDelete}
          title="Eliminar proyecto"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}