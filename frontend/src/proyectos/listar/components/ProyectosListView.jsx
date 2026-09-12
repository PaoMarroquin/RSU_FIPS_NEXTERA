import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

const ESTADO_BADGE = {
  aprobado: "bg-green-100 text-green-700",
  "en ejecucion": "bg-blue-100 text-blue-700",
  observado: "bg-red-100 text-red-700",
  "en revision": "bg-yellow-100 text-yellow-700",
};

export default function ProyectosListView({ projects, canEdit, canDelete, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="divide-y divide-slate-200">
        {projects.map((project) => (
          <div key={project.dbId} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{project.id}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ESTADO_BADGE[project.status] || "bg-slate-100 text-slate-700"}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 truncate">{project.title}</h3>
              <div className="flex flex-wrap gap-6 mt-2 text-sm text-slate-500">
                <span>👤 {project.author}</span>
                <span>🎓 {project.faculty}</span>
                <span>📌 {project.tag}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onView(project.dbId)} title="Ver expediente" className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition">
                <FiEye />
              </button>
              {canEdit && (
                <button onClick={() => onEdit(project.dbId)} title="Editar proyecto" className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                  <FiEdit2 />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(project.dbId)} title="Eliminar proyecto" className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition">
                  <FiTrash2 />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}