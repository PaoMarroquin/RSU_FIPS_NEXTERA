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
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">Proyectos por Facultad</h3>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" fill="#b1122b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}