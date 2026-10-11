import { ESTADO_LABELS, ESTADO_COLORS } from "../constants/estados";

export default function EstadoBadge({ estado }) {
  const c = ESTADO_COLORS[estado] || ESTADO_COLORS.borrador;

  return (
    <span className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
      <span className="break-words">{ESTADO_LABELS[estado] || estado}</span>
    </span>
  );
}