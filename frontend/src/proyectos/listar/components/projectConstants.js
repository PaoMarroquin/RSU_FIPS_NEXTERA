export const STATUS_COLORS = {
  en_ejecucion: "bg-[#141E42]/10 text-[#141E42]",
  aprobado: "bg-[#5E151D]/10 text-[#5E151D]",
  finalizado: "bg-[#999999]/20 text-[#555555]",
  en_revision: "bg-amber-100 text-amber-800",
  observado: "bg-red-100 text-red-700",
  borrador: "bg-gray-100 text-gray-700",
};

export const PROGRESS_COLORS = {
  en_ejecucion: "bg-[#141E42]",
  aprobado: "bg-[#5E151D]",
  finalizado: "bg-[#999999]",
  en_revision: "bg-amber-500",
  observado: "bg-red-500",
  borrador: "bg-gray-400",
};

export const getStatusKey = (status) =>
  status ? status.toLowerCase().replace(/\s+/g, "_") : "borrador";