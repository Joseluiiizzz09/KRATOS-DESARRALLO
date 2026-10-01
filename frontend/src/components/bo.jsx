import { useEffect, useState } from 'react';

/** Aviso simple para que Base.jsx recargue cuando el panel "Agregar registro" del menú crea un contacto. */
const leadBus = new EventTarget();
export const notifyLeadCreated = () => leadBus.dispatchEvent(new Event('lead-created'));
export function useLeadCreated(callback) {
  useEffect(() => {
    leadBus.addEventListener('lead-created', callback);
    return () => leadBus.removeEventListener('lead-created', callback);
  }, [callback]);
}

/** Estado del panel «Rotación inteligente». */
const rotBus = new EventTarget();
let rotAbierta = false;
export function toggleRotacion(force) {
  rotAbierta = force !== undefined ? force : !rotAbierta;
  rotBus.dispatchEvent(new CustomEvent('rot', { detail: rotAbierta }));
}
export function useRotAbierta() {
  const [abierta, setAbierta] = useState(rotAbierta);
  useEffect(() => {
    const handler = (e) => setAbierta(e.detail);
    rotBus.addEventListener('rot', handler);
    return () => rotBus.removeEventListener('rot', handler);
  }, []);
  return abierta;
}

/** Devuelve el valor con retraso, para no consultar la API en cada tecla. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Fecha y hora en Lima a partir de un ISO (historiales). */
export function fmtDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Hora (HH:mm) de un DATETIME de MySQL ya guardado en hora de Lima. */
export function fmtTime(mysqlDate) {
  return mysqlDate ? String(mysqlDate).slice(11, 16) : '—';
}

export function prettyStatus(status) {
  const text = String(status || '').replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'lg' }) {
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.5)' }} role="dialog" aria-modal="true">
      <div className={`modal-dialog modal-${size} modal-dialog-centered modal-dialog-scrollable`}>
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title mb-0">{title}</h5>
              {subtitle && <div className="small text-muted">{subtitle}</div>}
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>
          {children}
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function HistoryList({ history }) {
  if (!history?.length) return <p className="small text-muted mb-0">Sin gestiones registradas.</p>;
  return (
    <ol className="list-unstyled mb-0">
      {[...history].reverse().map((item, index) => (
        <li className="border-start ps-3 pb-3" key={`${item.at}-${index}`}>
          <div className="small text-muted">{fmtDateTime(item.at)} · {item.actor}</div>
          <div className="small">{item.text}</div>
        </li>
      ))}
    </ol>
  );
}

export function MetricCards({ items }) {
  return (
    <div className="row g-3 mb-3">
      {items.map(([label, value, help]) => (
        <div className="col-6 col-lg-3" key={label}>
          <div className="ka-stat">
            <div className="ka-field-label">{label}</div>
            <div className="ka-stat-value">{value}</div>
            <div className="ka-stat-help">{help}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Pager({ total, page, pageSize, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="ka-foot d-flex justify-content-between align-items-center">
      <span>{total} registros · Página {page} de {pages}</span>
      <div className="d-flex gap-2">
        <button className="ka-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Anterior</button>
        <button className="ka-btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente →</button>
      </div>
    </div>
  );
}

export function Filters({ children }) {
  return <div className="ka-card mb-3"><div className="p-3 d-flex flex-wrap align-items-end gap-3">{children}</div></div>;
}

export function Field({ label, children, grow }) {
  return (
    <label className={`ka-field-label ${grow ? 'flex-grow-1' : ''}`}>
      {label}
      <div className="mt-1 fw-normal">{children}</div>
    </label>
  );
}
