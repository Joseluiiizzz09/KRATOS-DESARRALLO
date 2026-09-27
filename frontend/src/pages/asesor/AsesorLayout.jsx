import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/kratos-logo.webp';
import './asesor.css';

function NavIcon({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS = {
  llamadas: (
    <NavIcon><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></NavIcon>
  ),
  tablero: (
    <NavIcon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></NavIcon>
  ),
  ventas: (
    <NavIcon><path d="M6 3h12l2 4H4l2-4zM4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M9 11a3 3 0 0 0 6 0" /></NavIcon>
  ),
};

const NAV_ITEMS = [
  { to: 'llamadas', label: 'Base de llamadas' },
  { to: 'tablero', label: 'Tablero y métricas' },
  { to: 'ventas', label: 'Mis ventas' },
];

export default function AsesorLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex vh-100">
      <aside className="d-flex flex-column border-end bg-white" style={{ width: collapsed ? 72 : 232, flexShrink: 0, transition: 'width .2s' }}>
        <div className={`p-3 border-bottom d-flex ${collapsed ? 'flex-column align-items-center gap-2' : 'align-items-center justify-content-between'}`}>
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="" width={40} height={40} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <div>
                <div className="ka-wordmark">KRATOS</div>
                <div className="text-muted" style={{ fontSize: 11 }}>Sistema de llamadas</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="ka-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
            title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" />
              <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
            </svg>
          </button>
        </div>

        <nav className="flex-grow-1 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `d-block rounded ${collapsed ? 'text-center' : ''} px-3 py-2 mb-1 text-decoration-none small fw-medium ${
                  isActive ? 'bg-danger-subtle text-danger fw-semibold' : 'text-secondary'
                }`
              }
            >
              {collapsed ? ICONS[item.to] : item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-top">
          {!collapsed && <div className="small text-muted mb-2">{user?.nombre}</div>}
          <button className="btn btn-outline-secondary btn-sm w-100" onClick={logout}>
            {collapsed ? '⏻' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <main className="ka-main flex-grow-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
