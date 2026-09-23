import { useState } from 'react';
import { DOCUMENT_TYPES, PRODUCTS_CATALOG, SALE_TYPES } from '../data/catalog';

const EMPTY = {
  clientName: '', documentType: '', documentNumber: '', clientPhone: '',
  referencePhone: '', productName: '', saleType: '', notes: '',
};

export default function SaleModal({ show, onClose, onSubmit, prefill }) {
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.5)' }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Registrar nueva venta</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="mb-3">
                <label className="form-label small fw-semibold">Nombres y apellidos del titular</label>
                <input className="form-control" value={form.clientName} onChange={(e) => setField('clientName', e.target.value)} required />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Tipo de documento</label>
                  <select className="form-select" value={form.documentType} onChange={(e) => setField('documentType', e.target.value)} required>
                    <option value="" disabled>Seleccionar</option>
                    {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Número de documento</label>
                  <input className="form-control" value={form.documentNumber} onChange={(e) => setField('documentNumber', e.target.value)} required />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Teléfono principal</label>
                  <input className="form-control" value={form.clientPhone} onChange={(e) => setField('clientPhone', e.target.value)} required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Teléfono de referencia</label>
                  <input className="form-control" value={form.referencePhone} onChange={(e) => setField('referencePhone', e.target.value)} />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Plan contratado</label>
                  <select className="form-select" value={form.productName} onChange={(e) => setField('productName', e.target.value)} required>
                    <option value="" disabled>Seleccionar plan</option>
                    {PRODUCTS_CATALOG.map((p) => (
                      <option key={p.name} value={p.name}>{p.name} (S/ {p.price.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Tipo de operación</label>
                  <select className="form-select" value={form.saleType} onChange={(e) => setField('saleType', e.target.value)} required>
                    <option value="" disabled>Seleccionar tipo</option>
                    {SALE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-1">
                <label className="form-label small fw-semibold">Observaciones / Acuerdos</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-danger" disabled={saving}>
                {saving ? 'Guardando…' : 'Confirmar venta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
