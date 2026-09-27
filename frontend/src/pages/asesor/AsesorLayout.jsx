import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/kratos-logo.webp';
import './asesor.css';

const NAV_ITEMS = [
  { to: 'llamadas', label: 'Base de llamadas' },
  { to: 'tablero', label: 'Tablero y métricas' },
  { to: 'ventas', label: 'Mis ventas' },
];

export default function AsesorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex vh-100">
      <aside className="d-flex flex-column border-end bg-white" style={{ width: 232, flexShrink: 0 }}>
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="" width={40} height={40} style={{ flexShrink: 0 }} />
            <div>
              <div className="fw-bold" style={{ letterSpacing: '.05em' }}>KRATOS</div>
              <div className="text-muted" style={{ fontSize: 11 }}>Sistema de llamadas</div>
            </div>
          </div>
        </div>

        <nav className="flex-grow-1 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `d-block rounded px-3 py-2 mb-1 text-decoration-none small fw-medium ${
                  isActive ? 'bg-danger-subtle text-danger fw-semibold' : 'text-secondary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-top">
          <div className="small text-muted mb-2">{user?.nombre}</div>
          <button className="btn btn-outline-secondary btn-sm w-100" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ka-main flex-grow-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
