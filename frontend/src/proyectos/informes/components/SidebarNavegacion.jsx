import React from "react";
import { FiFileText, FiActivity, FiTarget, FiBookOpen, FiCalendar, FiDollarSign, FiEye, FiSend } from "react-icons/fi";

export const SidebarNavegacion = ({ seccionActiva, setSeccionActiva }) => {
  const opciones = [
    { num: "I", nom: "Datos generales", icon: FiFileText },
    { num: "II", nom: "Fortalezas y lim.", icon: FiActivity },
    { num: "III", nom: "Resultados", icon: FiTarget },
    { num: "IV", nom: "Lecciones", icon: FiBookOpen },
    { num: "V", nom: "Conclusiones", icon: FiFileText },
    { num: "VI", nom: "Recomendaciones", icon: FiFileText },
    { num: "VII", nom: "Cronología", icon: FiCalendar },
    { num: "VIII", nom: "Metas e ind.", icon: FiTarget },
    { num: "IX", nom: "Presupuesto", icon: FiDollarSign },
    { num: "X", nom: "Evidencias", icon: FiEye },
    { num: "XI", nom: "Envío y rev.", icon: FiSend },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {opciones.map((s, i) => {
          const Icono = s.icon;
          return (
            <button 
              key={i} 
              onClick={() => setSeccionActiva(i)} 
              className={`w-full text-left p-3 text-sm rounded-lg flex items-center gap-3 transition-colors ${
                seccionActiva === i ? 'bg-[#eee7e9] text-[#b1122b] font-bold border border-[#d9c8cc]' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Icono className={seccionActiva === i ? "text-[#b1122b]" : "text-slate-400"}/>
              <span>{s.nom}</span>
            </button>
          )
        })}
      </div>
    </aside>
  );
};