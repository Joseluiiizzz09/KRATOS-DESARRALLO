import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { token, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/asesor" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex vh-100 align-items-center justify-content-center bg-dark">
      <div className="card shadow-lg" style={{ width: 360 }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-1 fw-bold">KRATOS</h1>
          <p className="text-muted small mb-4">Portal Asesor · Inicia sesión</p>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Usuario</label>
              <input
                className="form-control"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-danger w-100" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
