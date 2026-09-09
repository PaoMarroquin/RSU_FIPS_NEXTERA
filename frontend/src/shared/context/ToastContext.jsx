import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ type: "", text: "" });
  const timeoutRef = useRef(null);

  const showToast = useCallback((type, text) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ type, text });
    timeoutRef.current = setTimeout(() => {
      setToast({ type: "", text: "" });
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ type: "", text: "" });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}
