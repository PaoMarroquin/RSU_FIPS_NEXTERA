export default function StatCard({
  title,
  value,
  icon,
  color
}) {
  return (
    <div className="stat-card">

      <div className={`card-icon ${color}`}>
        {icon}
      </div>

      <p>{title}</p>

      <h2>{value}</h2>

    </div>
  );
}