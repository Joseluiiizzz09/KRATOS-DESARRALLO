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

/* Cada estado se agrupa en un tono para el color del selector. */
const TONOS = {
  pendiente: 'pendiente',
  venta_cerrada: 'venta',
  agendado: 'agendado',
  no_contesta: 'sin-respuesta',
  buzon_de_voz: 'sin-respuesta',
  corta_llamada: 'sin-respuesta',
  sin_cobertura: 'negativo',
  no_califica: 'negativo',
  no_desea: 'negativo',
  no_interesado: 'negativo',
};

export function statusTone(status) {
  return TONOS[status] || 'gestion';
}

/** Opciones del selector: la lista fija y, si el contacto tiene un estado antiguo, ese estado también. */
export function statusOptions(current) {
  if (!current || STATUSES.some(([value]) => value === current)) return STATUSES;
  return [...STATUSES, [current, ESTADOS_ANTIGUOS[current] || current]];
}
