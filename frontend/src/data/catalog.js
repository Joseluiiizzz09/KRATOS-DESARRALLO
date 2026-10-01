export const DOCUMENT_TYPES = ['DNI', 'RUC', 'CE'];
export const SALE_TYPES = ['Alta', 'Portabilidad', 'Renovación'];

export const PRODUCTS_CATALOG = [
  { name: 'Plan Max 29.90', category: 'Plan Max', price: 29.90 },
  { name: 'Plan Max 39.90', category: 'Plan Max', price: 39.90 },
  { name: 'Plan Max 49.90', category: 'Plan Max', price: 49.90 },
  { name: 'Plan Max Ilimitado 69.90', category: 'Plan Max Ilimitado', price: 69.90 },
  { name: 'Plan Max Ilimitado 95.90', category: 'Plan Max Ilimitado', price: 95.90 },
  { name: 'Plan Max Ilimitado 159.90', category: 'Plan Max Ilimitado', price: 159.90 },
];

/* Estados de un contacto. "pendiente" es el inicial (aún sin gestionar); el resto son
   las tipificaciones del asesor, en el orden en que se muestran en el desplegable. */
export const STATUSES = [
  ['pendiente', 'Pendiente'],
  ['venta_cerrada', 'Venta cerrada'],
  ['agendado', 'Agendado'],
  ['buzon_de_voz', 'Buzón de voz'],
  ['en_ejecucion', 'En ejecución'],
  ['no_califica', 'No califica'],
  ['contacto_con_terceros', 'Contacto con terceros'],
  ['desea_hogar', 'Desea hogar'],
  ['preventa', 'Preventa'],
  ['no_contesta', 'No contesta'],
  ['corta_llamada', 'Corta llamada'],
  ['sin_cobertura', 'Sin cobertura'],
  ['no_desea', 'No desea'],
  ['servicio_activo', 'Servicio activo'],
];

/* Estados de versiones anteriores que pueden seguir guardados en la base de datos. */
const ESTADOS_ANTIGUOS = { contactado: 'Contactado', no_interesado: 'No le interesa' };

/* Colores de cada estado (fondo, borde y texto).
   "Pendiente" es gris: todavía no se gestionó. */
const COLOR_GRIS = { bg: '#eef0f3', border: '#d3d8df', text: '#5b6472' };
const COLORES = {
  pendiente: COLOR_GRIS,
  venta_cerrada: { bg: '#dcfce7', border: '#86efac', text: '#0f8a3c' },
  preventa: { bg: '#dbeafe', border: '#93c5fd', text: '#1e63a8' },
  agendado: { bg: '#fff3d6', border: '#f6c36b', text: '#ac630b' },
  no_contesta: { bg: '#fef9c3', border: '#feea7a', text: '#874f10' },
  buzon_de_voz: { bg: '#fff0f0', border: '#e99999', text: '#a83e3e' },
  corta_llamada: { bg: '#e7f5fb', border: '#9bd2e8', text: '#236b8d' },
  en_ejecucion: { bg: '#eeeeee', border: '#9b9b9b', text: '#3f3f3f' },
  sin_cobertura: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  no_califica: { bg: '#fff0e8', border: '#f4b494', text: '#8a4529' },
  no_desea: { bg: '#f8e9dc', border: '#c98a55', text: '#713707' },
  contacto_con_terceros: { bg: '#e1f4ed', border: '#62b89a', text: '#10684c' },
  desea_hogar: { bg: '#f8e9dc', border: '#c98a55', text: '#713707' },
  servicio_activo: { bg: '#444444', border: '#666666', text: '#ffffff' },
  // estados de versiones anteriores
  contactado: { bg: '#dbeafe', border: '#93c5fd', text: '#1e63a8' },
  no_interesado: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
};

/** Colores del estado; uno desconocido se muestra en gris. */
export function statusColors(status) {
  return COLORES[status] || COLOR_GRIS;
}

/** Opciones del selector: la lista fija y, si el contacto tiene un estado antiguo, ese estado también. */
export function statusOptions(current) {
  if (!current || STATUSES.some(([value]) => value === current)) return STATUSES;
  return [...STATUSES, [current, ESTADOS_ANTIGUOS[current] || current]];
}

/* Estado de una venta: son los mismos de Seguimiento. Mientras nadie le pone uno, queda "pendiente". */
export const ESTADOS_VENTA = [
  ['pendiente', 'Pendiente', 'text-bg-secondary'],
  ['programado', 'Programado', 'text-bg-primary'],
  ['no_contesta', 'No contesta', 'text-bg-warning'],
  ['activa', 'Activa', 'text-bg-success'],
  ['caida', 'Caída', 'text-bg-danger'],
];

export function estadoVenta(status) {
  const [, label, badge] = ESTADOS_VENTA.find(([value]) => value === status) || ESTADOS_VENTA[0];
  return { label, badge };
}
