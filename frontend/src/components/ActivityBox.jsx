export default function ActivityBox() {
  const data = [
    { text: "Proyecto Aprobado", sub: "Alfabetización Digital", time: "Hace 2 horas" },
    { text: "Nuevo Avance Registrado", sub: "Proyecto Ambiental", time: "Hace 5 horas" },
    { text: "Proyecto Finalizado", sub: "Salud Comunitaria", time: "Hace 1 día" },
  ];

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">Actividad Reciente</h3>

      <div className="flex flex-col gap-4">
        {data.map((item, i) => (
          <div 
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100" 
            key={i}
          >
            {/* Punto rojo indicador */}
            <div className="w-2 h-2 rounded-full bg-[#b1122b] mt-1.5 shrink-0"></div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700 leading-tight mb-1">{item.text}</p>
              <span className="text-xs font-medium text-slate-500 block">{item.sub}</span>
            </div>

            <small className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {item.time}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}