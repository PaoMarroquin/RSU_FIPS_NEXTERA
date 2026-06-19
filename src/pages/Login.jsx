import { MdEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";

export default function Login() {
  return (
    <div className="login-container">

      <div className="left-panel">
        <div className="grid-overlay"></div>

        <div className="branding">
          <div className="logo-box">
            🎓
          </div>

          <h1>UNSA</h1>

          <p className="main-text">
            Sistema de Gestión de Responsabilidad Social Universitaria
          </p>
        </div>
      </div>

      <div className="right-panel">

        <div className="floating-circle circle1"></div>
        <div className="floating-circle circle2"></div>

        <div className="login-card">

          <div className="badge">
            Plataforma Institucional
          </div>

          <h2>Bienvenido</h2>

          <p className="subtitle">
            Inicia sesión con tu cuenta institucional
          </p>

          <form>

            <label>Correo institucional</label>

            <div className="input-container">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="usuario@unsa.edu.pe"
              />
            </div>

            <label>Contraseña</label>

            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="••••••••••••"
              />
            </div>

            <div className="remember">

              <div className="remember-left">
                <input type="checkbox" />
                <span>Recordarme</span>
              </div>

              <a href="/">
                ¿Olvidaste tu contraseña?
              </a>

            </div>

            <button type="submit">
              Ingresar al Sistema
            </button>

          </form>

          <div className="footer-login">
            Universidad Nacional de San Agustín de Arequipa
          </div>

        </div>
      </div>
    </div>
  );
}