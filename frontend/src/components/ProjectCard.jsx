import {
  FiUser,
  FiCalendar
} from "react-icons/fi";

export default function ProjectCard({
  id,
  title,
  author,
  faculty,
  progress,
  status,
  tag
}) {

  const statusClass = status
    .toLowerCase()
    .replace(" ", "-");

  return (
    <div className="project-card">

      <div className="card-top">

        <span className="project-id">
          {id}
        </span>

        <span className={`status ${statusClass}`}>
          {status}
        </span>

      </div>

      <h3>{title}</h3>

      <div className="meta">

        <p>
          <FiUser />
          {author}
        </p>

        <p>
          <FiCalendar />
          {faculty}
        </p>

      </div>

      <div className="progress-area">

        <div className="progress-info">
          <span>Avance</span>
          <span>{progress}%</span>
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${statusClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      <span className="tag">
        {tag}
      </span>

    </div>
  );
}