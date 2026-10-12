
export const ESTADO_LABELS = {
  borrador: "Borrador",
  en_revision: "En revisión",
  corregido: "Corregido",
  aprobado: "Aprobado",
  en_ejecucion: "En ejecución",
  finalizado: "Finalizado",
  observado: "Observado",
  rechazado: "Rechazado",
};

export const ESTADO_COLORS = {
  borrador: {
    bg: "bg-[#999999]/15",
    text: "text-[#666666]",
    dot: "bg-[#999999]",
  },
  en_revision: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  corregido: {
    bg: "bg-[#141E42]/10",
    text: "text-[#141E42]",
    dot: "bg-[#141E42]",
  },
  aprobado: {
    bg: "bg-[#5E151D]/10",
    text: "text-[#5E151D]",
    dot: "bg-[#5E151D]",
  },
  en_ejecucion: {
    bg: "bg-[#141E42]/10",
    text: "text-[#141E42]",
    dot: "bg-[#141E42]",
  },
  finalizado: {
    bg: "bg-[#999999]/20",
    text: "text-[#555555]",
    dot: "bg-[#999999]",
  },
  observado: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-400",
  },
  rechazado: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export const HEADER = {
  docente: {
    title: "Panel del Docente",
    subtitle: "Mis proyectos de Responsabilidad Social (RSU)",
  },
  departamento: {
    title: "Gestión de Departamento",
    subtitle: "Seguimiento y aprobación de proyectos del área",
  },
  autoridad: {
    title: "Dashboard Institucional",
    subtitle: "Resumen macro y cumplimiento de metas FIPS",
  },
};
