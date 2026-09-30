import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import Login from './operaciones/pages/Login.jsx';
import AsesorLayout from './pages/asesor/AsesorLayout.jsx';
import BaseLlamadas from './pages/asesor/BaseLlamadas.jsx';
import Tablero from './pages/asesor/Tablero.jsx';
import MisVentas from './pages/asesor/MisVentas.jsx';
import SupervisorLayout from './pages/supervisor/SupervisorLayout.jsx';
import SupervisorMetricas from './pages/supervisor/Metricas.jsx';
import SupervisorBaseLlamadas from './pages/supervisor/BaseLlamadas.jsx';
import SupervisorVentas from './pages/supervisor/Ventas.jsx';
import Backoffice from './operaciones/pages/Backoffice.jsx';
import Seguimiento from './operaciones/pages/Seguimiento.jsx';
import Jefatura from './operaciones/pages/Jefatura.jsx';
import { usuarioTieneCargo } from './operaciones/utils/roles.js';
import { RUTAS } from './operaciones/utils/rutas.js';
import { leerSesionActual, useAuth } from './operaciones/hooks/useAuth.js';

/** Puerta de cada módulo: sin sesión va al login; con sesión pero sin el cargo, a su propio módulo.
 *  Jefatura puede entrar a cualquiera. */
function RutaPrivada({ children, cargo }) {
  useAuth();
  const sesion = leerSesionActual();
  if (!sesion) return <Navigate to="/login" replace />;
  const actor = sesion._actorJefatura || sesion;
  const permitido = !cargo || actor.cargo === 'jefatura' || usuarioTieneCargo(sesion, cargo);
  if (!permitido) return <Navigate to={RUTAS[sesion.cargo] || '/login'} replace />;
  return children;
}

/** Envía a cada usuario a su módulo según su cargo. */
function Inicio() {
  useAuth();
  const sesion = leerSesionActual();
  return <Navigate to={sesion ? RUTAS[sesion.cargo] || '/login' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/backoffice/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/asesor"
        element={
          <RutaPrivada cargo="asesor">
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
          <RutaPrivada cargo="supervisor">
            <SupervisorLayout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="ventas" replace />} />
        <Route path="ventas" element={<SupervisorVentas />} />
        <Route path="metricas" element={<SupervisorMetricas />} />
        <Route path="llamadas" element={<SupervisorBaseLlamadas />} />
      </Route>
      <Route path="/backoffice" element={<RutaPrivada cargo="backoffice"><Backoffice /></RutaPrivada>} />
      <Route path="/seguimiento" element={<RutaPrivada cargo="seguimiento"><Seguimiento /></RutaPrivada>} />
      <Route path="/jefatura" element={<RutaPrivada cargo="jefatura"><Jefatura /></RutaPrivada>} />
      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}
