import { useAuth as useSesion } from '../operaciones/hooks/useAuth.js';

/** Sesión única de KRATOS: el login guarda nc_token / nc_usuario y todos los módulos la comparten.
 *  Si Jefatura entró "como" otro usuario, `user` es ese usuario. */
export function AuthProvider({ children }) {
  return children;
}

export function useAuth() {
  const { sesion, logout } = useSesion();
  const token = sessionStorage.getItem('nc_token') || '';
  const user = sesion
    ? { id: sesion.id, nombre: sesion.nombre, usuario: sesion.usuario, rol: sesion.cargo, sala: sesion.sala }
    : null;
  return { token, user, loading: false, logout };
}
