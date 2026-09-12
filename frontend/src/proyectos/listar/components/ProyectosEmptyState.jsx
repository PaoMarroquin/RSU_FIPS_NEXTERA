export default function ProyectosEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed flex-1">
      <span className="text-slate-400 text-lg font-medium">No se encontraron proyectos</span>
      <span className="text-slate-400 text-sm mt-1">Intenta ajustando el término de búsqueda</span>
    </div>
  );
}