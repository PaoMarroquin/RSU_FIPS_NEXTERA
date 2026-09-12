export default function StatCard({ title, value, icon, color }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-600",
    gray: "bg-slate-100 text-slate-600",
    red: "bg-red-50 text-red-600"
  };

  const iconStyle = colorStyles[color] || "bg-slate-50 text-slate-500";

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl mb-1 ${iconStyle}`}>
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500 tracking-wide">
        {title}
      </p>

      <h2 className="text-2xl font-bold text-slate-800 m-0 leading-none">
        {value}
      </h2>

    </div>
  );
}