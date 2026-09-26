import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './login.css';

const FEATURES = [
  {
    label: 'Portabilidad',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
        <path d="m12 16 4-4-4-4" />
      </>
    ),
  },
  {
    label: 'Altas de línea',
    icon: (
      <>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </>
    ),
  },
  {
    label: 'Ventas',
    icon: (
      <>
        <path d="M12 16v5" />
        <path d="M16 14v7" />
        <path d="M20 10v11" />
        <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
        <path d="M4 18v3" />
        <path d="M8 14v7" />
      </>
    ),
  },
  {
    label: 'Operaciones',
    icon: (
      <>
        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
];

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function Login() {
  const { token, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/asesor" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password, remember);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kl-page">
      <section className="kl-brand" aria-label="KRATOS">
        <h1 className="kl-brand-title">KRATOS</h1>
        <p className="kl-brand-tagline">Gestión comercial con control total.</p>
        <ul className="kl-features">
          {FEATURES.map((feature) => (
            <li className="kl-feature" key={feature.label}>
              <Icon>{feature.icon}</Icon>
              <span>{feature.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <main className="kl-form-panel">
        <div className="kl-form-wrap">
          <h2 className="kl-title">
            Bienvenido a <strong>KRATOS</strong>
          </h2>
          <p className="kl-subtitle">Ingrese sus credenciales para continuar.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="kl-field">
              <label className="kl-label" htmlFor="usuario">Nombre de usuario</label>
              <input
                id="usuario"
                className="kl-input"
                type="text"
                placeholder="Ingrese su nombre de usuario"
                autoComplete="username"
                maxLength={100}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
              />
            </div>

            <div className="kl-field">
              <label className="kl-label" htmlFor="password">Contraseña</label>
              <div className="kl-input-wrap">
                <input
                  id="password"
                  className="kl-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="kl-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon>
                    {showPassword ? (
                      <>
                        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                        <path d="m2 2 20 20" />
                      </>
                    ) : (
                      <>
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </Icon>
                </button>
              </div>
            </div>

            <label className="kl-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Mantener sesión iniciada
            </label>

            {error && <div className="kl-error" role="alert">{error}</div>}

            <button className="kl-submit" type="submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="kl-footer">
          Acceso solo para usuarios autorizados.
          <br />
          © 2026 KRATOS · Plataforma de Gestión Empresarial
        </p>
      </main>
    </div>
  );
}
