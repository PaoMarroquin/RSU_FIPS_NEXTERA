import { FiAlertCircle } from "react-icons/fi";

export default function EmptyState({ mensaje }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
      <FiAlertCircle className="text-3xl" />
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}