import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { toast } = useToast();

  if (!toast.text) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm w-full">
      <div
        className={`p-4 rounded-lg flex items-center gap-3 border text-sm shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        {toast.type === "success" ? (
          <FiCheckCircle className="text-lg shrink-0" />
        ) : (
          <FiAlertCircle className="text-lg shrink-0" />
        )}
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
