import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import AsesorLayout from './pages/asesor/AsesorLayout.jsx';
import BaseLlamadas from './pages/asesor/BaseLlamadas.jsx';
import Tablero from './pages/asesor/Tablero.jsx';
import MisVentas from './pages/asesor/MisVentas.jsx';
import BackofficeLayout from './pages/backoffice/BackofficeLayout.jsx';
import Base from './pages/backoffice/Base.jsx';
import CargaMasiva from './pages/backoffice/CargaMasiva.jsx';
import Rendimiento from './pages/backoffice/Rendimiento.jsx';
import AvanceAsesores from './pages/backoffice/AvanceAsesores.jsx';
import KronoBackoffice from './krono-backoffice/pages/Backoffice.jsx';

const HOME = { asesor: '/asesor', backoffice: '/backoffice', admin: '/backoffice' };

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
        path="/backoffice"
        element={
          <RutaPrivada roles={['backoffice', 'admin']}>
            <BackofficeLayout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="base" replace />} />
        <Route path="base" element={<Base />} />
        <Route path="carga-masiva" element={<CargaMasiva />} />
        <Route path="rendimiento" element={<Rendimiento />} />
        <Route path="avance-asesores" element={<AvanceAsesores />} />
      </Route>
      <Route
        path="/krono-backoffice"
        element={
          <RutaPrivada roles={['backoffice', 'admin']}>
            <KronoBackoffice />
          </RutaPrivada>
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
