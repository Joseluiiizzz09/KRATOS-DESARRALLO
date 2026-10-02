import { useState } from 'react';
import { DOCUMENT_TYPES, PRODUCTS_CATALOG, SALE_TYPES } from '../data/catalog';
import { UBIGEO } from '../operaciones/services/ubigeo';
import '../operaciones/styles/venta-assignment.css';

function Campo({ label, children, ancho }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: ancho ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  height: 36, padding: '0 10px', border: '1px solid #cbd5e1', borderRadius: 8,
  background: '#fff', color: '#111827', font: 'inherit', fontSize: 13, outline: 'none',
};

const EMPTY = {
  clientName: '', documentType: '', documentNumber: '', clientPhone: '',
  referencePhone: '', productName: '', saleType: '', notes: '',
  department: '', province: '', district: '', channel: '',
};

export default function SaleModal({ show, onClose, onSubmit, prefill, title = 'Registrar nueva venta', submitLabel = 'Confirmar venta' }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...prefill }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const product = PRODUCTS_CATALOG.find((item) => item.name === form.productName);
    if (!form.clientName || !form.documentType || !form.documentNumber || !form.clientPhone || !product || !form.saleType) {
      setError('Completa nombre, documento, teléfono, plan y tipo antes de continuar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        productName: product.name,
        category: product.category,
        amount: product.price,
        leadId: prefill?.leadId,
      });
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="va-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <form
        className="va-modal"
        style={{ width: 'min(700px,100%)', maxHeight: 'min(88vh,820px)' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={handleSubmit}
      >
        <header className="va-header">
          <div>
            <h3>{title}</h3>
            <p>{form.clientName || 'Cliente'} · Teléfono {form.clientPhone || '—'}</p>
          </div>
          <button type="button" className="va-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <div className="va-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
          {error && <div className="va-alert error" style={{ gridColumn: '1 / -1', marginTop: 0 }}>{error}</div>}

          <Campo label="Nombres y apellidos del titular" ancho>
            <input style={inputStyle} value={form.clientName} onChange={(e) => setField('clientName', e.target.value)} placeholder="Nombre y apellidos" required />
          </Campo>

          <Campo label="Tipo de documento">
            <select style={inputStyle} value={form.documentType} onChange={(e) => setField('documentType', e.target.value)} required>
              <option value="" disabled>Seleccionar</option>
              {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Campo>
          <Campo label="N° documento">
            <input style={inputStyle} value={form.documentNumber} onChange={(e) => setField('documentNumber', e.target.value)} required />
          </Campo>

          <Campo label="Teléfono principal">
            <input style={inputStyle} value={form.clientPhone} onChange={(e) => setField('clientPhone', e.target.value)} required />
          </Campo>
          <Campo label="Teléfono de referencia">
            <input style={inputStyle} value={form.referencePhone} onChange={(e) => setField('referencePhone', e.target.value)} placeholder="Opcional" />
          </Campo>

          <Campo label="Departamento">
            <select style={inputStyle} value={form.department} onChange={(e) => setForm((c) => ({ ...c, department: e.target.value, province: '', district: '' }))}>
              <option value="">Seleccionar</option>
              {Object.keys(UBIGEO).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Campo>
          <Campo label="Provincia">
            <select style={inputStyle} value={form.province} disabled={!form.department} onChange={(e) => setForm((c) => ({ ...c, province: e.target.value, district: '' }))}>
              <option value="">Seleccionar</option>
              {Object.keys(UBIGEO[form.department] || {}).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Campo>
          <Campo label="Distrito">
            <select style={inputStyle} value={form.district} disabled={!form.province} onChange={(e) => setField('district', e.target.value)}>
              <option value="">Seleccionar</option>
              {(UBIGEO[form.department]?.[form.province] || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Campo>

          <Campo label="Plan contratado">
            <select style={inputStyle} value={form.productName} onChange={(e) => setField('productName', e.target.value)} required>
              <option value="" disabled>Seleccionar plan</option>
              {PRODUCTS_CATALOG.map((p) => (
                <option key={p.name} value={p.name}>{p.name} (S/ {p.price.toFixed(2)})</option>
              ))}
            </select>
          </Campo>
          <Campo label="Tipo de operación">
            <select style={inputStyle} value={form.saleType} onChange={(e) => setField('saleType', e.target.value)} required>
              <option value="" disabled>Seleccionar tipo</option>
              {SALE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>

          <Campo label="Canal">
            <select style={inputStyle} value={form.channel} onChange={(e) => setField('channel', e.target.value)}>
              <option value="">Seleccionar canal</option>
              {['ACD', 'DELIVERY', 'CADENA'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>

          <Campo label="Observaciones / Acuerdos" ancho>
            <textarea
              style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }}
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Observaciones de la venta…"
            />
          </Campo>
        </div>

        <footer className="va-footer">
          <button type="button" className="va-button secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="va-button primary" disabled={saving}>
            {saving ? 'Guardando…' : submitLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}
