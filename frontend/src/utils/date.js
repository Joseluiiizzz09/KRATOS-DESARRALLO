/** Día local (AAAA-MM-DD) de una fecha. MySQL entrega "AAAA-MM-DD HH:MM:SS" en hora
 *  local (sin 'Z'), así que Date la interpreta como local; usar getFullYear/getMonth/getDate
 *  (no las variantes UTC) evita que la fecha salte al día siguiente cerca de medianoche. */
export function localDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today() {
  return localDay(new Date());
}
