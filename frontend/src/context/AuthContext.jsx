import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const STORAGE_KEY = 'kratos:token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then((data) => setUser(data.user))
      .catch(() => { setToken(null); localStorage.removeItem(STORAGE_KEY); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (usuario, password) => {
    const data = await api.login(usuario, password);
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
