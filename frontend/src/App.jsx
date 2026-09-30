import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import AsesorLayout from './pages/asesor/AsesorLayout.jsx';
import BaseLlamadas from './pages/asesor/BaseLlamadas.jsx';
import Tablero from './pages/asesor/Tablero.jsx';
import MisVentas from './pages/asesor/MisVentas.jsx';
import KronoBackoffice from './krono-backoffice/pages/Backoffice.jsx';
import KronoSeguimiento from './krono-backoffice/pages/Seguimiento.jsx';
import KronoJefatura from './krono-backoffice/pages/Jefatura.jsx';
import KronoLogin from './krono-backoffice/pages/Login.jsx';
import SupervisorLayout from './pages/supervisor/SupervisorLayout.jsx';
import SupervisorMetricas from './pages/supervisor/Metricas.jsx';
import SupervisorBaseLlamadas from './pages/supervisor/BaseLlamadas.jsx';
import SupervisorVentas from './pages/supervisor/Ventas.jsx';
import { leerSesionActual, useAuth as useAuthKrono } from './krono-backoffice/hooks/useAuth.js';

const HOME = { asesor: '/asesor', backoffice: '/backoffice', admin: '/backoffice', supervisor: '/supervisor' };

function RutaPrivada({ children, roles }) {
  const { token, user, loading } = useAuth();
  if (loading) return <div className="d-flex vh-100 align-items-center justify-content-center">Cargando…</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}

/** Envía a cada usuario a su portal según el rol. */
function Inicio() {
  const { token, user, loading } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME[user.rol] || '/asesor'} replace />;
}

/** Puerta propia de KRONO (sessionStorage nc_token), igual que en su App.jsx original: sin sesión, a su login. */
function RutaKrono({ children }) {
  useAuthKrono();
  const sesion = leerSesionActual();
  if (!sesion) return <Navigate to="/backoffice/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/asesor"
        element={
          <RutaPrivada roles={['asesor']}>
            <AsesorLayout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="llamadas" replace />} />
        <Route path="llamadas" element={<BaseLlamadas />} />
        <Route path="tablero" element={<Tablero />} />
        <Route path="ventas" element={<MisVentas />} />
      </Route>
      <Route
        path="/supervisor"
        element={
          <RutaPrivada roles={['supervisor', 'admin']}>
            <SupervisorLayout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="ventas" replace />} />
        <Route path="ventas" element={<SupervisorVentas />} />
        <Route path="metricas" element={<SupervisorMetricas />} />
        <Route path="llamadas" element={<SupervisorBaseLlamadas />} />
      </Route>
      <Route path="/backoffice/login" element={<KronoLogin />} />
      <Route
        path="/backoffice"
        element={
          <RutaKrono>
            <KronoBackoffice />
          </RutaKrono>
        }
      />
      <Route
        path="/seguimiento"
        element={
          <RutaKrono>
            <KronoSeguimiento />
          </RutaKrono>
        }
      />
      <Route
        path="/jefatura"
        element={
          <RutaKrono>
            <KronoJefatura />
          </RutaKrono>
        }
      />
      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
