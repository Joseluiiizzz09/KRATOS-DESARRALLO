import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const STORAGE_KEY = 'kratos:token';
const AuthContext = createContext(null);

/** "Mantener sesión" guarda el token en localStorage; sin marcarla, en sessionStorage
 *  (se pierde al cerrar la pestaña o el navegador). */
function readStoredToken() {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || null;
}

function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then((data) => setUser(data.user))
      .catch(() => { setToken(null); clearStoredToken(); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (usuario, password, remember = false) => {
    const data = await api.login(usuario, password);
    clearStoredToken();
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  /** Sesión única: si hay sesión de KRONO (sessionStorage nc_token), la canjea por una de KRATOS. */
  const loginConKrono = async () => {
    const kronoToken = sessionStorage.getItem('nc_token');
    if (!kronoToken) return null;
    let como;
    try {
      const actor = JSON.parse(sessionStorage.getItem('nc_usuario') || 'null');
      const objetivo = JSON.parse(sessionStorage.getItem('nc_jefatura_usuario_objetivo') || 'null');
      if (actor?.cargo === 'jefatura' && objetivo?.usuario) como = objetivo.usuario;
    } catch { /* sin objetivo */ }
    const data = await api.kronoSso(kronoToken, como);
    clearStoredToken();
    sessionStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    ['nc_token', 'nc_usuario', 'nc_jefatura_usuario_objetivo', 'nc_dashboard_asesor_objetivo'].forEach((k) => sessionStorage.removeItem(k));
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, loginConKrono, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
