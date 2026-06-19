import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Ing. Prod.", value: 45 },
  { name: "Medicina", value: 30 },
  { name: "Derecho", value: 25 },
  { name: "Arquitectura", value: 18 },
  { name: "Cs. Biológicas", value: 15 },
  { name: "Economía", value: 12 },
];

export default function BarChartBox() {
  return (
    <div className="chart-box">
      <h3>Proyectos por Facultad</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" fill="#a6192e" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}