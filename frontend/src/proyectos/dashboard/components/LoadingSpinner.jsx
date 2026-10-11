export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7B1E3A]/20 border-t-[#7B1E3A]" />
      <p className="text-sm text-slate-500">Cargando datos…</p>
    </div>
  );
}