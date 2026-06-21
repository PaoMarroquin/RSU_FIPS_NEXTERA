const ActivityCard = ({ title, project, date, user, color, done }) => {
  // Diccionario para los colores de las etiquetas
  const tagColors = {
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700"
  };

  const currentTagColor = tagColors[color] || "bg-slate-100 text-slate-700";

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative transition-all hover:shadow-md ${done ? "opacity-60 bg-slate-50" : ""}`}>

      <small className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start uppercase tracking-wider ${currentTagColor}`}>
        {project}
      </small>

      <h4 className={`text-sm font-bold leading-snug pr-6 ${done ? "line-through text-slate-500" : "text-slate-800"}`}>
        {title}
      </h4>

      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
        📅 {date}
      </p>
      {/* Avatar flotante en la esquina inferior derecha */}
      <span className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm">
        {user}
      </span>
    </div>
  );
};

export default ActivityCard;