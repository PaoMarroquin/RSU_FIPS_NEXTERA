import { FiAlertCircle } from "react-icons/fi";

export default function EmptyState({ mensaje }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-slate-400">
      <FiAlertCircle className="text-3xl" />
      <p className="break-words text-sm">{mensaje}</p>
    </div>
  );
}