import React from 'react';

// Ajustado a los campos exactos de tu CronogramaAccionSerializer
const ActivityCard = ({ accion, onToggleComplete }) => {
  // En tu serializer: estado_avance puede ser el indicador de si está 'completado' o no
  const isDone = accion.estado_avance === 'completado' || accion.completado;

  // Obtener iniciales del responsable de forma segura
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative transition-all hover:shadow-md ${isDone ? "opacity-60 bg-slate-50" : ""}`}>
      
      {/* Selector de estado rápido */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isDone ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {isDone ? "✓ Ejecutado" : "⏳ Pendiente"}
        </span>
        
        {/* Checkbox interactivo */}
        <input 
          type="checkbox"
          checked={isDone}
          onChange={(e) => onToggleComplete(accion.id, e.target.checked)}
          className="w-4 h-4 text-[#b1122b] border-slate-300 rounded focus:ring-[#b1122b] cursor-pointer"
        />
      </div>

      {/* Descripción de la acción (visto en tu serializer) */}
      <h4 className={`text-sm font-bold leading-snug pr-8 ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
        {accion.descripcion || "Acción sin descripción"}
      </h4>

      {/* Fechas del Cronograma (visto en tu serializer) */}
      <div className="text-[11px] font-semibold text-slate-500 flex flex-col gap-0.5">
        <p>📅 Inicio: {accion.fecha_inicio || 'Por definir'}</p>
        <p>🏁 Fin: {accion.fecha_fin || 'Por definir'}</p>
      </div>

      {/* Avatar flotante con el responsable real del Back */}
      <span 
        title={`Responsable: ${accion.responsable}`}
        className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm uppercase"
      >
        {getInitials(accion.responsable)}
      </span>
    </div>
  );
};

export default ActivityCard;