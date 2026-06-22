import { FiBell, FiSearch } from "react-icons/fi";

export default function Topbar() {
  return (
    /* sticky top-0 lo mantiene pegado arriba al hacer scroll */
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20 w-full">

      <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-lg w-full max-w-md focus-within:ring-2 focus-within:ring-[#b1122b]/20 focus-within:bg-white border border-transparent focus-within:border-[#b1122b] transition-all">
        <FiSearch className="text-slate-400 text-lg shrink-0" />
        <input
          type="text"
          placeholder="Buscar proyectos, usuarios, informes..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-5 ml-auto pl-4">
        <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-[#b1122b] rounded-full transition-colors">
          <FiBell className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 bg-slate-100 border border-slate-200 text-[#b1122b] rounded-full flex items-center justify-center font-bold text-sm">P</div>
          <div className="hidden md:flex flex-col">
            <strong className="text-sm font-bold text-slate-800 leading-tight">Pedro Marroquín</strong>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">DOCENTE</span>
          </div>
        </div>
      </div>

    </header>
  );
}