import { MdEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      
      {/* PANEL IZQUIERDO (Marca UNSA) - Oculto en móviles */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#b1122b] relative overflow-hidden flex-col justify-center items-center text-center p-12">
        {/* Adornos de fondo simulando el grid y círculos */}
        <div className="absolute inset-0 bg-black/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white text-[#b1122b] text-4xl rounded-2xl flex items-center justify-center shadow-xl mb-6">
            🎓
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">UNSA</h1>
          <p className="text-red-100 text-lg max-w-md font-medium leading-relaxed">
            Sistema de Gestión de Responsabilidad Social Universitaria
          </p>
        </div>
      </div>

      {/* PANEL DERECHO (Formulario) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 z-10 relative">
          
          <div className="inline-block bg-red-50 text-[#b1122b] text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide">
            Plataforma Institucional
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h2>
          <p className="text-slate-500 text-sm mb-8">
            Inicia sesión con tu cuenta institucional
          </p>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            
            {/* Input Correo */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">Correo institucional</label>
              <div className="relative flex items-center">
                <MdEmail className="absolute left-3.5 text-slate-400 text-lg" />
                <input
                  type="email"
                  placeholder="usuario@unsa.edu.pe"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">Contraseña</label>
              <div className="relative flex items-center">
                <FaLock className="absolute left-3.5 text-slate-400 text-sm" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Opciones extra */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#b1122b] focus:ring-[#b1122b]" />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Recordarme</span>
              </label>
              <a href="/" className="text-sm font-semibold text-[#b1122b] hover:text-[#8e0e22] transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón */}
            <button 
              type="submit"
              className="w-full h-11 mt-4 bg-[#b1122b] hover:bg-[#8e0e22] text-white font-semibold rounded-lg shadow-md shadow-red-900/10 transition-all active:scale-[0.98]"
            >
              Ingresar al Sistema
            </button>
          </form>
        </div>

        {/* Footer del login */}
        <div className="absolute bottom-6 text-center text-xs text-slate-400 font-medium">
          Universidad Nacional de San Agustín de Arequipa © 2026
        </div>
      </div>

    </div>
  );
}