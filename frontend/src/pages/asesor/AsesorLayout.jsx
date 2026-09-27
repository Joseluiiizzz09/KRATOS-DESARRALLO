import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './asesor.css';

const TABS = [
  { to: 'llamadas', label: 'Llamadas' },
  { to: 'tablero', label: 'Tablero' },
  { to: 'ventas', label: 'Mis ventas' },
];

export default function AsesorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="ka-app">
      <header className="ka-topbar">
        <div className="ka-brand">
          <div className="ka-logo" aria-hidden="true">K</div>
          <div>
            <div className="ka-brand-name">KRATOS</div>
            <div className="ka-brand-sub">Sistema de llamadas</div>
          </div>
        </div>

        <nav className="ka-tabs" aria-label="Secciones del asesor">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `ka-tab${isActive ? ' is-active' : ''}`}>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="ka-userbox">
          <span>Vista de: {user?.nombre}</span>
          <button type="button" className="ka-exit" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="ka-main">
        <Outlet />
      </main>
    </div>
  );
}
