import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/kratos-logo.webp';
import '../pages/asesor/asesor.css';

/** Jefatura entró a este módulo como otro usuario (desde "Accesos directos"): puede volver a su panel. */
function entroDesdeJefatura() {
  try {
    const actor = JSON.parse(sessionStorage.getItem('nc_usuario') || 'null');
    return actor?.cargo === 'jefatura' && Boolean(sessionStorage.getItem('nc_jefatura_usuario_objetivo'));
  } catch {
    return false;
  }
}

function volverAJefatura() {
  sessionStorage.removeItem('nc_jefatura_usuario_objetivo');
  sessionStorage.removeItem('nc_dashboard_asesor_objetivo');
  sessionStorage.removeItem('kratos:token');
  localStorage.removeItem('kratos:token');
  window.location.assign('/jefatura');
}

/** Menú lateral plegable compartido por el portal del asesor y el de Back Office. */
export default function SidebarLayout({ items, extra }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 72 : extra ? 300 : 232;

  return (
    <div className="d-flex vh-100">
      <aside className="d-flex flex-column border-end bg-white" style={{ width, flexShrink: 0, transition: 'width .2s' }}>
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

        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
          <nav className="p-2">
            {(items[0]?.to ? [{ section: null, items }] : items).map((group, index) => (
              <div key={group.section || index} className={index > 0 ? 'mt-3' : ''}>
                {group.section && !collapsed && (
                  <div className="text-muted px-3 mb-1" style={{ fontSize: 10.5, letterSpacing: '.06em', fontWeight: 700 }}>{group.section}</div>
                )}
                {group.items.map((item) => {
                  const className = (isActive) =>
                    `d-block w-100 border-0 bg-transparent text-start rounded ${collapsed ? 'text-center' : ''} px-3 py-2 mb-1 text-decoration-none small fw-medium ${
                      isActive ? 'bg-danger-subtle text-danger fw-semibold' : 'text-secondary'
                    }`;
                  if (!item.to) {
                    return (
                      <button key={item.label} type="button" title={item.label} className={className(item.active)} onClick={item.onClick}>
                        {collapsed ? item.icon : item.label}
                      </button>
                    );
                  }
                  return (
                    <NavLink key={item.to} to={item.to} title={item.label} className={({ isActive }) => className(isActive)}>
                      {collapsed ? item.icon : item.label}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {!collapsed && extra && <div className="px-2 pb-2">{extra}</div>}
        </div>

        <div className="p-3 border-top flex-shrink-0">
          {!collapsed && <div className="small text-muted mb-2">{user?.nombre}</div>}
          {entroDesdeJefatura() && (
            <button className="btn btn-dark btn-sm w-100 mb-2" onClick={volverAJefatura} title="Volver a Jefatura">
              {collapsed ? '←' : '← Volver a Jefatura'}
            </button>
          )}
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
