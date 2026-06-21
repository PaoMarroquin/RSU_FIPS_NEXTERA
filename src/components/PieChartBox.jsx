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
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">Distribución por Eje RSU</h3>

      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-slate-100">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span 
              className="w-3 h-3 rounded-sm" 
              style={{ background: COLORS[i % COLORS.length] }}
            ></span>
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}