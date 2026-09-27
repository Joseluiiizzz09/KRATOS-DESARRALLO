import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { notifyLeadCreated } from './bo.jsx';
import { ALL_DISTRICTS, ALL_PROVINCES, DEPARTMENTS, departmentOfProvince, districtsOf, locationOfDistrict, provincesOf } from '../data/peru.js';

const EMPTY = {
  phone: '', phone2: '', clientName: '', whatsappUser: '', campaign: '', department: '', province: '', zone: '',
  address: '', coordinates: '', back1: '', back2: '', backNotes: '',
};

/** Panel del menú lateral para dar de alta un contacto rápido; solo visible en «Base». */
export default function AddRegistroPanel() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => { api.boCampaigns(token).then((r) => setCampaigns(r.campaigns)).catch(() => {}); }, [token]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.boCreateLead(token, form);
      setForm(EMPTY);
      notifyLeadCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-top pt-3">
      <div className="text-muted px-1 mb-2" style={{ fontSize: 10.5, letterSpacing: '.06em', fontWeight: 700 }}>Agregar registro</div>
      <form onSubmit={submit} className="d-flex flex-column gap-2">
        {error && <div className="alert alert-danger py-1 px-2 small mb-0">{error}</div>}
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">Campaña</span>
          <select className="form-select form-select-sm mt-1" value={form.campaign} onChange={(e) => set('campaign', e.target.value)}>
            <option value="">— Selecciona —</option>
            {campaigns.map((c) => <option key={c}>{c}</option>)}
            {form.campaign && !campaigns.includes(form.campaign) && <option>{form.campaign}</option>}
          </select>
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">N1</span>
          <input className="form-control form-control-sm mt-1" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">N2 (opcional)</span>
          <input className="form-control form-control-sm mt-1" value={form.phone2} onChange={(e) => set('phone2', e.target.value)} />
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">Usuario WhatsApp</span>
          <input className="form-control form-control-sm mt-1" value={form.whatsappUser} onChange={(e) => set('whatsappUser', e.target.value)} />
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">Departamento (opcional)</span>
          <select className="form-select form-select-sm mt-1" value={form.department} onChange={(e) => { set('department', e.target.value); set('province', ''); set('zone', ''); }}>
            <option value="">— Seleccionar —</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">Provincia (opcional)</span>
          <select className="form-select form-select-sm mt-1" value={form.province} onChange={(e) => { set('province', e.target.value); if (!form.department) set('department', departmentOfProvince(e.target.value)); }}>
            <option value="">— Seleccionar —</option>
            {(form.department ? provincesOf(form.department) : ALL_PROVINCES).map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="d-block" style={{ fontSize: 12 }}>
          <span className="text-muted">Distrito (opcional)</span>
          <select
            className="form-select form-select-sm mt-1"
            value={form.zone}
            onChange={(e) => {
              set('zone', e.target.value);
              if (!form.department && !form.province && e.target.value) {
                const { department, province } = locationOfDistrict(e.target.value);
                set('department', department);
                set('province', province);
              }
            }}
          >
            <option value="">— Seleccionar —</option>
            {(form.province ? districtsOf(form.department || departmentOfProvince(form.province), form.province) : form.department ? provincesOf(form.department).flatMap((p) => districtsOf(form.department, p)) : ALL_DISTRICTS).map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <div className="d-flex gap-2 mt-1">
          <button type="button" className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setForm(EMPTY)}>Limpiar</button>
          <button className="btn btn-dark btn-sm flex-grow-1" disabled={saving}>{saving ? 'Agregando…' : '+ Agregar'}</button>
        </div>
      </form>
    </div>
  );
}
