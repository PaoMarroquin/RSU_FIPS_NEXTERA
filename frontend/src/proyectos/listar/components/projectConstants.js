export const STATUS_COLORS = {
  en_ejecucion: "bg-blue-100 text-blue-700",
  aprobado: "bg-emerald-100 text-emerald-700",
  finalizado: "bg-purple-100 text-purple-700",
  en_revision: "bg-amber-100 text-amber-700",
  observado: "bg-red-100 text-red-700",
  borrador: "bg-slate-100 text-slate-700",
};

export const PROGRESS_COLORS = {
  en_ejecucion: "bg-blue-500",
  aprobado: "bg-emerald-500",
  finalizado: "bg-purple-500",
  en_revision: "bg-amber-500",
  observado: "bg-red-500",
  borrador: "bg-slate-400",
};

export const getStatusKey = (status) =>
  status ? status.toLowerCase().replace(/\s+/g, "_") : "borrador";