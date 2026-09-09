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
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">Evolución Mensual</h3>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#b1122b"
              strokeWidth={3}
              dot={{ r: 4, fill: "#b1122b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}