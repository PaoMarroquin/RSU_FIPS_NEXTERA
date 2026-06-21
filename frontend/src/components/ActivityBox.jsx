export default function ActivityBox() {
  const data = [
    { text: "Proyecto Aprobado", sub: "Alfabetización Digital", time: "Hace 2 horas" },
    { text: "Nuevo Avance Registrado", sub: "Proyecto Ambiental", time: "Hace 5 horas" },
    { text: "Proyecto Finalizado", sub: "Salud Comunitaria", time: "Hace 1 día" },
  ];

  return (
    <div className="activity-box">
      <h3>Actividad Reciente</h3>

      {data.map((item, i) => (
        <div className="activity-item" key={i}>
          <div className="dot"></div>

          <div>
            <p>{item.text}</p>
            <span>{item.sub}</span>
          </div>

          <small>{item.time}</small>
        </div>
      ))}
    </div>
  );
}