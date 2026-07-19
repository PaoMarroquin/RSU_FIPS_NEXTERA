import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, ResponsiveContainer } from "recharts";

const BAR_COLOR = "#b1122b";

function truncate(label, max = 20) {
  if (!label) return "";
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

// Tick propio: el <Text> interno de Recharts trunca por su cuenta con un cálculo
// de ancho poco fiable en layout="vertical" (corta nombres cortos a la mitad).
// Renderizando el <text> nosotros mismos evitamos esa lógica y controlamos el corte.
function YAxisTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#334155">
      {truncate(payload.value)}
    </text>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs max-w-[220px]">
      <p className="font-semibold text-slate-800 m-0">{name}</p>
      <p className="text-slate-500 m-0">{value} proyecto{value === 1 ? "" : "s"}</p>
    </div>
  );
}

export default function BarChartBox({ title = "Proyectos", data = [] }) {
  // Barras horizontales: con muchas categorías o nombres largos, un eje X vertical
  // termina ocultando la mayoría de las etiquetas (Recharts las salta si no caben).
  const chartHeight = Math.max(250, data.length * 42);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">{title}</h3>

      {data.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-8">Sin datos para mostrar todavía.</p>
      ) : (
        <div className="flex-1 w-full" style={{ minHeight: chartHeight }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid horizontal={false} stroke="#e1e0d9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={<YAxisTick />}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList dataKey="value" position="right" style={{ fill: '#52514e', fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
