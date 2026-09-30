import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import "../../pages/login.css";
import { RUTAS, CARGO_LABELS } from "../utils/rutas";
import { cargosDeUsuario } from "../utils/roles";

const API = "/api";

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
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [seleccionCargo, setSeleccionCargo] = useState(null);

  const passRef = useRef(null);
  const userRef = useRef(null);

  /* ===== Si ya hay sesión activa → redirigir ===== */
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("nc_token");
      const raw = sessionStorage.getItem("nc_usuario");
      if (token && raw) {
        const u = JSON.parse(raw);
        const ruta = RUTAS[u.cargo];
        if (ruta) navigate(ruta, { replace: true });
      }
    } catch (e) { /* noop */ }
    userRef.current?.focus();
  }, [navigate]);

  /* ===== ANIMACIÓN DE BIENVENIDA ===== */
  const mostrarBienvenida = (user) => {
    const primerNombre = user.nombre.split(" ")[0];
    const fem = primerNombre.toUpperCase().endsWith("A");
    setWelcome({ primerNombre, femenino: fem, cargo: CARGO_LABELS[user.cargo] || user.cargo });

    const ruta = RUTAS[user.cargo] || "/dashboard";
    navigate(ruta, { replace: true });
  };

  const completarLogin = (data) => {
    sessionStorage.setItem("nc_token", data.token);
    sessionStorage.setItem("nc_usuario", JSON.stringify(data.usuario));
    localStorage.removeItem("nc_token");
    localStorage.removeItem("nc_usuario");

    // Cargos reales del usuario (principal + adicionales) que además tienen
    // ruta navegable. Con más de uno, el usuario elige con cuál entrar —
    // sin volver a autenticar, es la misma sesión/token ya guardada arriba.
    const cargosReales = cargosDeUsuario(data.usuario).filter((c) => RUTAS[c]);
    if (cargosReales.length > 1) {
      setSeleccionCargo({ cargos: cargosReales, usuario: data.usuario });
      setCargando(false);
      return;
    }

    setSeleccionCargo(null);
    mostrarBienvenida(data.usuario);
  };

  const elegirArea = (cargo) => {
    if (!seleccionCargo) return;
    setSeleccionCargo(null);
    mostrarBienvenida({ ...seleccionCargo.usuario, cargo });
  };

  const cancelarSeleccion = () => {
    sessionStorage.removeItem("nc_token");
    sessionStorage.removeItem("nc_usuario");
    setSeleccionCargo(null);
    setError("");
    setUsuario("");
    setPassword("");
  };

  /* ===== LOGIN ===== */
  const autenticar = async () => {
    setError("");

    const u = usuario.trim().toLowerCase();
    const p = password;

    if (!u) { setError("Ingresa tu usuario."); return; }
    if (!p) { setError("Ingresa tu contraseña."); return; }

    setCargando(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: u, password: p }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.mensaje || "Usuario o contraseña incorrectos.");
        setCargando(false);
        return;
      }

      completarLogin(data);
    } catch (err) {
      console.error("Error de conexión:", err);
      setError("No se pudo conectar al servidor. ¿Está corriendo el backend?");
      setCargando(false);
    }
  };

  const doLogin = async (e) => {
    if (e) e.preventDefault();
    await autenticar();
  };

  /* ===== PANTALLA DE TRANSICIÓN (bienvenida) ===== */
  if (welcome) {
    return (
      <div className={styles.transition}>
        <div className={styles.transGreet}>
          {welcome.femenino ? "¡Bienvenida de nuevo," : "¡Bienvenido de nuevo,"}
        </div>
        <div className={styles.transName}>
          {welcome.primerNombre.split("").map((c, i) =>
            i === 0 ? <span key={i} className={styles.transAccent}>{c}</span> : <span key={i}>{c}</span>
          )}
        </div>
        <div className={styles.transCargo}>{welcome.cargo}</div>
        <div className={styles.transLabel}>
          CARGANDO TU PANEL
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    );
  }

  /* ===== SELECCIÓN DE ÁREA (varios cargos) ===== */
  if (seleccionCargo) {
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
            <h2 className="kl-title">Selecciona el área de trabajo</h2>
            <p className="kl-subtitle">
              {seleccionCargo.usuario?.nombre || usuario}, tienes más de un área asignada.
            </p>
            {error && <div className="kl-error" role="alert">{error}</div>}
            <div className={styles.roleList}>
              {seleccionCargo.cargos.map((cargo) => (
                <button type="button" key={cargo} className={styles.roleButton} onClick={() => elegirArea(cargo)}>
                  <span className={styles.roleIcon}>{(CARGO_LABELS[cargo] || cargo).slice(0, 1)}</span>
                  <span>
                    <strong>{CARGO_LABELS[cargo] || cargo}</strong>
                    <small>Abrir este módulo</small>
                  </span>
                  <b>→</b>
                </button>
              ))}
            </div>
            <button type="button" className="kl-submit" style={{ background: '#374151', boxShadow: 'none', marginTop: 18 }} onClick={cancelarSeleccion}>
              Cerrar sesión
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ===== LOGIN NORMAL: mismo diseño (partido, panel oscuro + formulario) del login de KRATOS ===== */
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

          <form onSubmit={doLogin} noValidate>
            <div className="kl-field">
              <label className="kl-label" htmlFor="kratos-usuario">Nombre de usuario</label>
              <input
                id="kratos-usuario"
                ref={userRef}
                className="kl-input"
                type="text"
                placeholder="Ingrese su nombre de usuario"
                autoComplete="off"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); passRef.current?.focus(); } }}
                autoFocus
              />
            </div>

            <div className="kl-field">
              <label className="kl-label" htmlFor="kratos-password">Contraseña</label>
              <div className="kl-input-wrap">
                <input
                  id="kratos-password"
                  ref={passRef}
                  className="kl-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  autoComplete="new-password"
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

            {error && <div className="kl-error" role="alert">{error}</div>}

            <button className="kl-submit" type="submit" disabled={cargando}>
              {cargando ? 'Verificando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="kl-footer">
          Acceso solo para usuarios autorizados.
          <br />
          © 2026 KRATOS · Back Office
        </p>
      </main>
    </div>
  );
}
