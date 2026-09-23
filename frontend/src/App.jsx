import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import AsesorLayout from './pages/asesor/AsesorLayout.jsx';
import BaseLlamadas from './pages/asesor/BaseLlamadas.jsx';
import Tablero from './pages/asesor/Tablero.jsx';
import MisVentas from './pages/asesor/MisVentas.jsx';

function RutaPrivada({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="d-flex vh-100 align-items-center justify-content-center">Cargando…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/asesor"
        element={
          <RutaPrivada>
            <AsesorLayout />
          </RutaPrivada>
        }
      >
        <Route index element={<Navigate to="llamadas" replace />} />
        <Route path="llamadas" element={<BaseLlamadas />} />
        <Route path="tablero" element={<Tablero />} />
        <Route path="ventas" element={<MisVentas />} />
      </Route>
      <Route path="*" element={<Navigate to="/asesor" replace />} />
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
