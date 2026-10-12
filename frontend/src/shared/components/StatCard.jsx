export default function StatCard({ title, value, icon, color }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-600",
    gray: "bg-slate-100 text-slate-600",
    red: "bg-red-50 text-red-600",
  };

  const iconStyle = colorStyles[color] || "bg-slate-50 text-slate-500";

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-3 sm:p-5">
      <div
        className={`mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-base sm:mb-1 sm:h-11 sm:w-11 sm:text-xl ${iconStyle}`}
      >
        {icon}
      </div>

      <p className="break-words text-xs font-semibold tracking-wide text-slate-500 sm:text-sm">
        {title}
      </p>

      <h2 className="m-0 text-xl font-bold leading-none text-slate-800 sm:text-2xl">
        {value}
      </h2>
    </div>
  );
}