import { useState } from 'react';
import { STATUSES } from '../data/catalog';

/** Ventana para tipificar la llamada: el asesor elige el resultado y se actualiza el estado del contacto. */
export default function TipificarModal({ lead, onClose, onSave }) {
  const [selected, setSelected] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(selected);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal d-block" style={{ background: 'rgba(17,24,39,.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
        <div className="modal-content ka-modal">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title mb-1">Tipificar llamada</h5>
              <div className="text-muted small">{lead.phone}{lead.zone ? ` · ${lead.zone}` : ''}</div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="ka-tip-grid" role="radiogroup" aria-label="Resultado de la llamada">
              {STATUSES.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  role="radio"
                  aria-checked={selected === value}
                  className={`ka-tip-option ka-tip-option--${value}${selected === value ? ' is-selected' : ''}`}
                  onClick={() => setSelected(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {selected === 'venta_cerrada' && (
              <p className="small text-muted mt-3 mb-0">Al continuar se abrirá el formulario para registrar la venta.</p>
            )}
          </div>

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : selected === 'venta_cerrada' ? 'Continuar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
