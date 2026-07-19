import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function ConfirmModal({
  open,
  titulo = "Confirmar acción",
  mensaje,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 flex items-start gap-3 border-b border-slate-100">
          <FiAlertTriangle className="text-2xl text-red-500 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{titulo}</h3>
            <p className="text-sm text-slate-600 mt-1">{mensaje}</p>
          </div>
        </div>
        <div className="p-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
