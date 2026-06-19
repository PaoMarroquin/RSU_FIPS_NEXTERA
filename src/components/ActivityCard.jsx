const ActivityCard = ({ title, project, date, user, color, done }) => {
  return (
    <div className={`card ${done ? "done" : ""}`}>
      <small className={`tag ${color}`}>{project}</small>
      <h4 className={done ? "completed" : ""}>{title}</h4>
      <p>📅 {date}</p>
      <span className="avatar">{user}</span>
    </div>
  );
};

export default ActivityCard;