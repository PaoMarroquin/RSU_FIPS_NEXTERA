import React from "react";
import { FiUser, FiBook, FiTag } from "react-icons/fi";
import ProjectActions from "./ProjectActions";
import { STATUS_COLORS, getStatusKey } from "./projectConstants";

export default function ProyectosListView({
  projects,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="divide-y divide-slate-100">
        {projects.map((project) => {
            console.log("PROYECTO:", project);
          const statusKey = getStatusKey(project.status);
          const currentStatusColor = STATUS_COLORS[statusKey] || "bg-slate-100 text-slate-700";

          return (
            <div
              key={project.dbId}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:px-6 gap-4 hover:bg-slate-50/80 transition-colors"
            >
              {/* Información Principal */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {project.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${currentStatusColor}`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3
                  className="text-base font-bold text-slate-800 truncate mb-2"
                  title={project.title}
                >
                  {project.title}
                </h3>

                {/* Detalles con react-icons y misma estética */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 truncate">
                    <FiUser className="text-slate-400 shrink-0" />
                    {project.author}
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <FiBook className="text-slate-400 shrink-0" />
                    {project.faculty}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    <FiTag className="text-slate-400 shrink-0" />
                    {project.ejes_rsu_info?.map((eje) => eje.nombre).join(", ") || "Sin Eje"}
                  </span>
                </div>
              </div>

              {/* Botones de acción reutilizados */}
              <div className="self-end md:self-center shrink-0">
                <ProjectActions
                  statusKey={statusKey}
                  onView={() => onView(project.dbId)}
                  onEdit={canEdit ? () => onEdit(project.dbId) : null}
                  onDelete={canDelete ? () => onDelete(project.dbId) : null}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}