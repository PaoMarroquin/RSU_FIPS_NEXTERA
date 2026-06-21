import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Ene", value: 10 },
  { name: "Feb", value: 15 },
  { name: "Mar", value: 25 },
  { name: "Abr", value: 40 },
  { name: "May", value: 55 },
  { name: "Jun", value: 80 },
];

export default function LineChartBox() {
  return (
    <div className="chart-box">
      <h3>Evolución Mensual</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <Tooltip />
          <Line
            dataKey="value"
            stroke="#d02b45"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}