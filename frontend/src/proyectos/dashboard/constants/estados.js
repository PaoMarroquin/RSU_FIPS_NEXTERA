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
  borrador: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  en_revision: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  corregido: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  aprobado: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  en_ejecucion: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  finalizado: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  observado: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  rechazado: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
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