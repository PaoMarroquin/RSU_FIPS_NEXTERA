import { FiSearch, FiGrid, FiList } from "react-icons/fi";

export default function ProyectosToolbar({ searchTerm, onSearchChange, viewMode, onViewModeChange }) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white w-full max-w-md focus-within:ring-2 focus-within:ring-[#b1122b]/10 focus-within:border-[#b1122b] transition-all">
        <FiSearch className="text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por título o código..."
          className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400 text-slate-700"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-4 shrink-0">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`p-1.5 rounded-md transition-all ${
            viewMode === "grid" ? "bg-white shadow-sm text-[#b1122b]" : "text-slate-500 hover:bg-white hover:text-slate-700"
          }`}
        >
          <FiGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={`p-1.5 rounded-md transition-all ${
            viewMode === "list" ? "bg-white shadow-sm text-[#b1122b]" : "text-slate-500 hover:bg-white hover:text-slate-700"
          }`}
        >
          <FiList className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}