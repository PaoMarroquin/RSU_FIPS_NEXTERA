import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiCheckCircle, FiPlayCircle, FiClock, FiXCircle } from "react-icons/fi";

// Color de estado (semántico, no decorativo): aprobado=éxito, en ejecución=activo,
// en revisión=pendiente, rechazado=crítico. Siempre va acompañado de ícono + texto,
// nunca solo el color, para que también funcione para lectores con daltonismo.
const ESTADO_STYLE = {
  "Aprobados": { color: "#0ca30c", Icon: FiCheckCircle },
  "En Ejecución": { color: "#2a78d6", Icon: FiPlayCircle },
  "En Revisión": { color: "#fab219", Icon: FiClock },
  "Rechazados": { color: "#d03b3b", Icon: FiXCircle },
};
const FALLBACK_COLOR = "#898781";

function CustomTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800 m-0">{name}</p>
      <p className="text-slate-500 m-0">{value} proyecto{value === 1 ? "" : "s"} · {pct}%</p>
    </div>
  );
}

export default function PieChartBox({ title = "Distribución", data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6">{title}</h3>

      {data.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-8">Sin datos para mostrar todavía.</p>
      ) : (
        <>
          <div className="relative flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(ESTADO_STYLE[entry.name] || {}).color || FALLBACK_COLOR} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Total centrado en el donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">{total}</span>
              <span className="text-[11px] text-slate-400 font-medium">proyecto{total === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-slate-100">
            {data.map((d, i) => {
              const style = ESTADO_STYLE[d.name];
              const Icon = style?.Icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  {Icon ? (
                    <Icon style={{ color: style.color }} className="text-sm shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: FALLBACK_COLOR }}></span>
                  )}
                  {d.name} ({d.value})
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
