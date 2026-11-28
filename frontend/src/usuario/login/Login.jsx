import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdEmail } from 'react-icons/md';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../shared/api/usuario/authApi';
import { tokenStore } from '../../shared/auth/tokenStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const allowPasswordLogin = import.meta.env.VITE_ALLOW_PASSWORD_LOGIN?.toLowerCase() === 'true'; // predeterminado falso

// Botón visual institucional (#7B1E3A + Escudo UNSA). El clic lo recibe el
// GoogleLogin oficial superpuesto e invisible, que devuelve el ID token (credential).
function InstitutionalGoogleButton({ onSuccess, onError, disabled }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      setWidth(Math.min(400, Math.max(200, w)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="group relative w-full h-12 overflow-hidden rounded-lg">
      {/* Apariencia */}
      <div
        className={`absolute inset-0 bg-[#7B1E3A] group-hover:bg-[#5c152a] text-white font-semibold rounded-lg shadow-md shadow-red-950/15 transition-all flex items-center justify-center gap-3 px-4 pointer-events-none ${
          disabled ? 'opacity-70' : ''
        }`}
      >
        <span className="bg-white p-1 rounded-md flex items-center justify-center shrink-0 shadow-sm">
          <img src="/img/Escudo_UNSA.png" alt="Escudo UNSA" className="w-6 h-6 object-contain" />
        </span>
        <span className="text-base tracking-wide">Continuar con Google</span>
      </div>

      {/* GoogleLogin real, encima y casi transparente (opacity 0 exacto a veces bloquea el clic) */}
      <div
        className={`absolute inset-0 z-10 flex items-start justify-center ${
          disabled ? 'pointer-events-none' : 'cursor-pointer'
        }`}
        style={{ opacity: 0.01 }}
      >
        <div style={{ transform: 'scale(1, 1.25)', transformOrigin: 'top center' }}>
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            size="large"
            width={String(width)}
            text="continue_with"
            shape="rectangular"
            theme="outline"
          />
        </div>
      </div>
    </div>
  );
}

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
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          await authApi.refreshToken(refreshToken);
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
    if (!allowPasswordLogin) return;

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

  // Login Google OAuth (ID token / credential, igual que el flujo original)
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
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">RSU FIPS</h1>
            <p className="text-red-50 text-lg max-w-md font-medium leading-relaxed opacity-90">
              Sistema de Gestión de Responsabilidad Social Universitaria — Facultad de Ingeniería de Producción y Servicios
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Login */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-7 sm:p-9 z-10 relative">
            {/* Cabecera Institucional Comprimida */}
            <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-slate-100">
              <div className="flex items-center justify-center gap-4 mb-3">
                <img
                  src="/img/Escudo_UNSA.png"
                  alt="Escudo UNSA"
                  className="h-14 w-auto object-contain shrink-0"
                />
                <div className="h-11 w-[2px] bg-slate-800 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-2xl sm:text-3xl font-light tracking-wide text-slate-600 leading-none">
                    <strong className="font-bold text-[#7B1E3A]">RSU</strong>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#7B1E3A] mt-1">
                    FIPS
                  </span>
                </div>
              </div>

              <span className="inline-block bg-pink-50 text-[#7B1E3A] text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1.5 tracking-wide">
                Plataforma Institucional
              </span>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">Bienvenido</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Inicia sesión con tu correo institucional{' '}
                <span className="font-medium text-slate-700">@unsa.edu.pe</span>
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200 animate-fadeIn">
                {error}
              </div>
            )}

            {/* Formulario Tradicional (Solo si VITE_ALLOW_PASSWORD_LOGIN=true) */}
            {allowPasswordLogin && (
              <>
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  {/* Campo Correo */}
                  <div className="space-y-1">
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
                  <div className="space-y-1">
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
                  <div className="flex items-center justify-between pt-0.5">
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
                    className="w-full h-11 mt-1 bg-[#7B1E3A] hover:bg-[#5c152a] text-white font-semibold rounded-lg shadow-md shadow-red-950/10 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase">
                    O ingresa con
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
              </>
            )}

            {/* Botón Google OAuth con Escudo UNSA en color institucional #7B1E3A */}
            <div className="w-full">
              <InstitutionalGoogleButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Falló la autenticación con Google. Intenta nuevamente.')}
                disabled={loading}
              />
            </div>

            {/* Nota de soporte institucional no usado aun */}
            {/* <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              <p>
                ¿Problemas con tu correo institucional?{' '}
                <a
                  href="mailto:soportecorreo@unsa.edu.pe"
                  className="font-semibold text-[#7B1E3A] hover:underline"
                >
                  soportecorreo@unsa.edu.pe
                </a>
              </p>
            </div>*/}
          </div>

          <div className="absolute bottom-5 text-center text-xs text-slate-400 font-medium">
            Universidad Nacional de San Agustín de Arequipa © 2026
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}