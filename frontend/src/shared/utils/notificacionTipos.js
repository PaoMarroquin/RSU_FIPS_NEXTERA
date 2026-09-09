import { FiCheckCircle, FiAlertTriangle, FiSend, FiEdit3, FiBell } from 'react-icons/fi';

export const NOTIFICACION_TIPOS = {
  aprobacion: {
    label: 'Aprobación',
    icon: FiCheckCircle,
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-100'
  },
  observacion: {
    label: 'Observación',
    icon: FiAlertTriangle,
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-100'
  },
  envio_revision: {
    label: 'En Revisión',
    icon: FiSend,
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'ring-blue-100'
  },
  correccion: {
    label: 'Corrección',
    icon: FiEdit3,
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    ring: 'ring-purple-100'
  }
};

export const DEFAULT_TIPO = {
  label: 'Notificación',
  icon: FiBell,
  text: 'text-slate-500',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  ring: 'ring-slate-100'
};

export function getTipoConfig(tipo) {
  return NOTIFICACION_TIPOS[tipo] || DEFAULT_TIPO;
}
