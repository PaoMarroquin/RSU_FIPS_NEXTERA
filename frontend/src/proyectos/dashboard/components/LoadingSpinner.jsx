export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-[#7B1E3A]/20 border-t-[#7B1E3A] rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Cargando datos…</p>
    </div>
  );
}