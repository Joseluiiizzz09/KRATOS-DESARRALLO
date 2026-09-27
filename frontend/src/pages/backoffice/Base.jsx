import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, Filters, HistoryList, MetricCards, Modal, Pager, fmtTime, prettyStatus, useDebounced, useLeadCreated, useRotAbierta } from '../../components/bo.jsx';
import RotacionPanel from '../../components/RotacionPanel.jsx';

const EMPTY = {
  phone: '', phone2: '', clientName: '', whatsappUser: '', campaign: '', zone: '', address: '', coordinates: '',
  back1: '', back2: '', backNotes: '',
};

function LeadForm({ lead, backOptions, onClose, onSaved }) {
  const { token } = useAuth();
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(lead || {}) }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.boUpdateLead(token, lead.id, form);
      onSaved('Contacto actualizado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Datos del contacto" subtitle="Información de Back Office" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body">
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="row g-3">
            {[
              ['phone', 'Teléfono 1', true], ['phone2', 'Teléfono 2'], ['clientName', 'Nombre del cliente'], ['whatsappUser', 'Usuario WhatsApp'],
              ['campaign', 'Campaña'], ['zone', 'Zona / Distrito'], ['address', 'Dirección'], ['coordinates', 'Coordenadas'],
            ].map(([key, label, required]) => (
              <div className="col-md-6" key={key}>
                <label className="form-label small fw-semibold">{label}</label>
                <input className="form-control" value={form[key]} onChange={(e) => set(key, e.target.value)} required={required} />
              </div>
            ))}
            {[['back1', 'Tipificación Back 1'], ['back2', 'Tipificación Back 2']].map(([key, label]) => (
              <div className="col-md-6" key={key}>
                <label className="form-label small fw-semibold">{label}</label>
                <select className="form-select" value={form[key]} onChange={(e) => set(key, e.target.value)}>
                  <option value="">Sin tipificar</option>
                  {backOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            ))}
            <div className="col-12">
              <label className="form-label small fw-semibold">Observaciones de Back Office</label>
              <textarea className="form-control" rows={3} maxLength={2000} value={form.backNotes} onChange={(e) => set('backNotes', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-dark" disabled={saving}>{saving ? 'Guardando…' : 'Guardar contacto'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Base() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ q: '', advisorId: '', status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ leads: [], total: 0, stats: { total: 0, unassigned: 0, assigned: 0, closed: 0 }, statuses: [], backOptions: [] });
  const [advisors, setAdvisors] = useState([]);
  const [selected, setSelected] = useState([]);
  const [target, setTarget] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const q = useDebounced(filters.q);
  const rotAbierta = useRotAbierta();

  const params = useMemo(() => ({ ...filters, q }), [filters, q]);

  const load = useCallback(async () => {
    try {
      setData(await api.boLeads(token, { ...params, page }));
    } catch (err) {
      setNotice({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [token, params, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.boAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);
  useLeadCreated(useCallback(() => { setNotice({ type: 'success', text: 'Contacto creado.' }); load(); }, [load]));

  const setFilter = (field, value) => { setFilters((current) => ({ ...current, [field]: value })); setPage(1); setSelected([]); };
  const visibleIds = data.leads.map((lead) => lead.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function assign() {
    if (!selected.length) { setNotice({ type: 'danger', text: 'Selecciona al menos un contacto.' }); return; }
    try {
      await api.boAssign(token, selected, target || null);
      setNotice({ type: 'success', text: 'Asignación actualizada. Los contactos aparecerán en la base del asesor indicado.' });
      setSelected([]);
      load();
    } catch (err) {
      setNotice({ type: 'danger', text: err.message });
    }
  }

  const { stats } = data;

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Distribución y control</div>
          <h1 className="ka-title">Base</h1>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2 small d-flex justify-content-between`} role="status">
          <span>{notice.text}</span>
          <button className="btn-close btn-sm" onClick={() => setNotice(null)} aria-label="Cerrar" />
        </div>
      )}

      {rotAbierta && <RotacionPanel />}

      <MetricCards items={[
        ['Contactos', stats.total, 'Base total'],
        ['Sin asignar', stats.unassigned, 'Pendientes de distribución'],
        ['Asignados', stats.assigned, 'En la base del asesor'],
        ['Ventas cerradas', stats.closed, 'Cierres protegidos'],
      ]}
      />

      <Filters>
        <Field label="Buscar" grow>
          <input className="form-control form-control-sm" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Teléfono, cliente, zona o campaña" />
        </Field>
        <Field label="Asesor">
          <select className="form-select form-select-sm" value={filters.advisorId} onChange={(e) => setFilter('advisorId', e.target.value)}>
            <option value="">Todos</option>
            <option value="none">Sin asignar</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">Todos</option>
            {data.statuses.map((s) => <option key={s} value={s}>{prettyStatus(s)}</option>)}
          </select>
        </Field>
        <Field label="Desde"><input type="date" className="form-control form-control-sm" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} /></Field>
        <Field label="Hasta"><input type="date" className="form-control form-control-sm" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} /></Field>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilters({ q: '', advisorId: '', status: '', from: '', to: '' }); setPage(1); }}>Limpiar</button>
      </Filters>

      <div className="ka-card mb-3">
        <div className="p-3 d-flex flex-wrap align-items-end gap-3">
          <Field label="Asignar o rotar seleccionados">
            <select className="form-select form-select-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Liberar (sin asesor)</option>
              {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </Field>
          <button className="btn btn-dark btn-sm" onClick={assign}>Aplicar asignación ({selected.length})</button>
          <span className="small text-muted">Elige «Liberar» para quitar la asignación.</span>
        </div>
      </div>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table" style={{ minWidth: 1250, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : visibleIds)} aria-label="Seleccionar página" />
                </th>
                <th>Contacto</th><th>Campaña / Zona</th><th>Back 1</th><th>Back 2</th><th>Estado asesor</th>
                <th>Asesor</th><th>Hora asig.</th><th>Rot.</th><th>Observaciones</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="ka-empty"><p>Cargando…</p></td></tr>}
              {!loading && !data.leads.length && (
                <tr><td colSpan={11} className="ka-empty"><p>Tu base está lista para recibir contactos</p><small>Agrégalos desde el panel del menú.</small></td></tr>
              )}
              {data.leads.map((lead) => (
                <tr key={lead.id}>
                  <td><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggle(lead.id)} aria-label={`Seleccionar ${lead.phone}`} /></td>
                  <td>
                    <div className="ka-phone">{lead.phone}</div>
                    <div className="small ka-muted">{lead.phone2 || 'Sin teléfono secundario'}</div>
                    <div className="small ka-muted">{lead.whatsappUser ? (lead.whatsappUser.startsWith('@') ? lead.whatsappUser : `@${lead.whatsappUser}`) : '—'}</div>
                  </td>
                  <td>{lead.campaign || '—'}<div className="small ka-muted">{lead.zone || '—'}</div></td>
                  <td>{lead.back1 || '—'}</td>
                  <td>{lead.back2 || '—'}</td>
                  <td><span className={`badge ${['venta_cerrada', 'instalado'].includes(lead.status) ? 'text-bg-success' : 'text-bg-light border'}`}>{prettyStatus(lead.status)}</span></td>
                  <td>{lead.advisor || <span className="ka-muted">Sin asignar</span>}</td>
                  <td>{fmtTime(lead.assignedAt)}</td>
                  <td>{lead.rotations}</td>
                  <td><div className="ka-clamp">{lead.backNotes || lead.advisorNote || '—'}</div></td>
                  <td className="text-nowrap">
                    <button className="btn btn-outline-dark btn-sm me-1" onClick={() => setModal({ type: 'edit', lead })}>Editar</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ type: 'history', lead })}>Historial</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager total={data.total} page={page} pageSize={data.pageSize || 20} onPage={setPage} />
      </div>

      {modal?.type === 'edit' && (
        <LeadForm key={modal.lead.id} lead={modal.lead} backOptions={data.backOptions} onClose={() => setModal(null)} onSaved={(text) => { setModal(null); setNotice({ type: 'success', text }); load(); }} />
      )}
      {modal?.type === 'history' && (
        <Modal title="Historial de asignaciones y cambios" subtitle={modal.lead.phone} onClose={() => setModal(null)} size="md">
          <div className="modal-body"><HistoryList history={modal.lead.history} /></div>
        </Modal>
      )}
    </div>
  );
}
