import { FiPlus } from "react-icons/fi";

export default function ProyectosHeader({ canCreate, onNuevoProyecto }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 m-0">Proyectos RSU</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona los proyectos de responsabilidad social</p>
      </div>
      {canCreate && (
        <button
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b1122b] text-white rounded-lg text-sm font-semibold hover:bg-[#8e0e22] transition-colors shadow-sm"
          onClick={onNuevoProyecto}
        >
          <FiPlus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      )}
    </div>
  );
}