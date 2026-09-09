import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../shared/api/usuario/authApi';
import { tokenStore } from '../../shared/auth/tokenStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
  const navigate = useNavigate();

  // Estado del formulario y flujo de UI
  const [formData, setFormData] = useState({
    correo: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  // Auto-login: verifica tokens activos antes de renderizar el formulario
  useEffect(() => {
    const verificarSesion = async () => {
      if (tokenStore.getAccessToken()) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          await refreshAccessToken(); // ← ahora comparte el mismo lock que axiosConfig
          navigate('/dashboard', { replace: true });
          return;
        } catch (err) {
          tokenStore.clear();
        }
      }

      setCheckingSession(false);
    };

    verificarSesion();
  }, [navigate]);

  // Manejador de campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar en tokenStore y redirigir
  const saveSessionAndRedirect = useCallback(
    (data) => {
      if (data.access) tokenStore.setAccessToken(data.access);
      if (data.refresh) tokenStore.setRefreshToken(data.refresh);

      if (data.usuario) {
        localStorage.setItem('user', JSON.stringify(data.usuario));
        localStorage.setItem('user_role', data.usuario.rol || '');
        localStorage.setItem('user_name', data.usuario.nombres || '');
        localStorage.setItem('user_email', data.usuario.correo_institucional || '');
      }

      navigate('/dashboard');
    },
    [navigate]
  );

  // Login Credenciales (Correo + Contraseña)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(formData.correo, formData.password);
      saveSessionAndRedirect(response);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error al conectar con el servidor. Verifica tus credenciales.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login Google OAuth
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const response = await authApi.loginConGoogle(credentialResponse.credential);
      saveSessionAndRedirect(response);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'No se pudo iniciar sesión con Google.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Spinner mientras se valida si ya existe una sesión previa
  if (checkingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7B1E3A]/20 border-t-[#7B1E3A] rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* PANEL IZQUIERDO: Branding Institucional */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#7B1E3A] relative overflow-hidden flex-col justify-center items-center text-center p-12">
          <div className="absolute inset-0 bg-black/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">UNSA</h1>
            <p className="text-red-50 text-lg max-w-md font-medium leading-relaxed opacity-90">
              Sistema de Gestión de Responsabilidad Social Universitaria
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Login */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 z-10 relative">
            <div className="inline-block bg-pink-50 text-[#7B1E3A] text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide">
              Plataforma Institucional
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido</h2>
            <p className="text-slate-500 text-sm mb-6">
              Inicia sesión con tu cuenta institucional
            </p>

            {/* Alerta de Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 animate-fadeIn">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              {/* Campo Correo */}
              <div className="space-y-1.5">
                <label htmlFor="correo" className="text-sm font-semibold text-slate-700 block">
                  Correo institucional
                </label>
                <div className="relative flex items-center">
                  <MdEmail className="absolute left-3.5 text-slate-400 text-lg pointer-events-none" />
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    required
                    autoComplete="username"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="usuario@unsa.edu.pe"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 block">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <FaLock className="absolute left-3.5 text-slate-400 text-sm pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-slate-300 bg-slate-50/50 text-sm outline-none focus:ring-2 focus:ring-[#7B1E3A]/20 focus:border-[#7B1E3A] transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label="Alternar visibilidad de contraseña"
                  >
                    {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                  </button>
                </div>
              </div>

              {/* Recordarme & Olvidó Contraseña */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#7B1E3A] focus:ring-[#7B1E3A]"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                    Recordarme
                  </span>
                </label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-sm font-semibold text-[#7B1E3A] hover:text-[#5c152a] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-[#7B1E3A] hover:bg-[#5c152a] text-white font-semibold rounded-lg shadow-md shadow-red-950/10 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </form>

            {/* Separador */}
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">
                O ingresa con
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Botón Google OAuth */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Falló la autenticación con Google. Intenta nuevamente.')}
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