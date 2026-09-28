function NavIcon({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const ICON_LLAMADAS = <NavIcon><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></NavIcon>;
export const ICON_TABLERO = <NavIcon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></NavIcon>;
export const ICON_VENTAS = <NavIcon><path d="M6 3h12l2 4H4l2-4zM4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M9 11a3 3 0 0 0 6 0" /></NavIcon>;
export const ICON_CONTACTOS = <NavIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></NavIcon>;
export const ICON_SEGUIMIENTO = <NavIcon><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></NavIcon>;
export const ICON_BASE = <NavIcon><path d="M3 9.5 12 3l9 6.5" /><path d="M5 8.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V8.5" /></NavIcon>;
export const ICON_CARGA = <NavIcon><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></NavIcon>;
export const ICON_ROTACION = <NavIcon><path d="M17 2.1 21 6l-4 3.9" /><path d="M3 12a9 9 0 0 1 15-6.7L21 6" /><path d="M7 21.9 3 18l4-3.9" /><path d="M21 12a9 9 0 0 1-15 6.7L3 18" /></NavIcon>;
export const ICON_RENDIMIENTO = <NavIcon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></NavIcon>;
export const ICON_AVANCE = <NavIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></NavIcon>;
export const ICON_METRICAS = <NavIcon><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></NavIcon>;
export const ICON_EQUIPO = <NavIcon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></NavIcon>;
