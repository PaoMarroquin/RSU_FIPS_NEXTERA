import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Gestión", value: 20 },
  { name: "Formación", value: 35 },
  { name: "Investigación", value: 25 },
  { name: "Extensión", value: 45 },
  { name: "Voluntariado", value: 22 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export default function PieChartBox() {
  return (
    <div className="chart-box">
      <h3>Distribución por Eje RSU</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="legend">
        {data.map((d, i) => (
          <div key={i}>
            <span style={{ background: COLORS[i] }}></span>
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}