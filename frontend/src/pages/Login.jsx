import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authService } from '../api/authService';

export default function Login() {
  const navigate = useNavigate();
  
  // Estados para el formulario
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ID de Cliente desde tu .env (VITE_GOOGLE_CLIENT_ID)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Función para Login Tradicional
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(correo, password);
      saveSessionAndRedirect(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Función para Login con Google
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const data = await authService.loginWithGoogle(credentialResponse.credential);
      saveSessionAndRedirect(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para guardar TODO en el localStorage
  const saveSessionAndRedirect = (data) => {
    // 1. Guardamos los tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    // 2. Guardamos el objeto completo por si acaso
    localStorage.setItem('user', JSON.stringify(data.usuario));

    // 3. Guardamos datos clave sueltos para facilitar su uso (restringir rutas, topbar, etc.)
    localStorage.setItem('user_role', data.usuario.rol);
    localStorage.setItem('user_name', data.usuario.nombres);
    localStorage.setItem('user_email', data.usuario.correo_institucional);

    navigate('/dashboard'); 
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex min-h-screen w-full bg-slate-50">
        
        {/* PANEL IZQUIERDO */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#b1122b] relative overflow-hidden flex-col justify-center items-center text-center p-12">
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

        {/* PANEL DERECHO */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 z-10 relative">
            
            <div className="inline-block bg-red-50 text-[#b1122b] text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide">
              Plataforma Institucional
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h2>
            <p className="text-slate-500 text-sm mb-6">
              Inicia sesión con tu cuenta institucional
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Correo institucional</label>
                <div className="relative flex items-center">
                  <MdEmail className="absolute left-3.5 text-slate-400 text-lg" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@unsa.edu.pe"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block">Contraseña</label>
                <div className="relative flex items-center">
                  <FaLock className="absolute left-3.5 text-slate-400 text-sm" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#b1122b]/20 focus:border-[#b1122b] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#b1122b] focus:ring-[#b1122b]" />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Recordarme</span>
                </label>
                <a href="/" className="text-sm font-semibold text-[#b1122b] hover:text-[#8e0e22] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-4 bg-[#b1122b] hover:bg-[#8e0e22] text-white font-semibold rounded-lg shadow-md shadow-red-900/10 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
              </button>
            </form>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">O ingresa con</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login falló. Intenta de nuevo.')}
                theme="outline"
                size="large"
                shape="rectangular"
                text="continue_with"
              />
            </div>

          </div>

          <div className="absolute bottom-6 text-center text-xs text-slate-400 font-medium">
            Universidad Nacional de San Agustín de Arequipa © 2026
          </div>
        </div>

      </div>
    </GoogleOAuthProvider>
  );
}