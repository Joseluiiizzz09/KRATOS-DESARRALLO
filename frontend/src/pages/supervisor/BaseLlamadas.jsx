import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, Filters, Modal, fmtTime, prettyStatus, useDebounced } from '../../components/bo.jsx';

export default function BaseLlamadas() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [filters, setFilters] = useState({ advisorId: '', status: '', q: '' });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState(null);
  const q = useDebounced(filters.q);

  const params = useMemo(() => ({ ...filters, q }), [filters, q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { leads: rows } = await api.supLeads(token, params);
      setLeads(rows);
    } finally {
      setLoading(false);
    }
  }, [token, params]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.supAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Supervisión</div>
          <h1 className="ka-title">Base de llamadas del equipo</h1>
        </div>
      </div>

      <Filters>
        <Field label="Buscar" grow>
          <input className="form-control form-control-sm" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Teléfono, cliente o zona" />
        </Field>
        <Field label="Asesor">
          <select className="form-select form-select-sm" value={filters.advisorId} onChange={(e) => setFilter('advisorId', e.target.value)}>
            <option value="">Todos</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="venta_cerrada">Venta cerrada</option>
          </select>
        </Field>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setFilters({ advisorId: '', status: '', q: '' })}>Limpiar</button>
      </Filters>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table" style={{ minWidth: 1100, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>Contacto</th><th>Asesor</th><th>Zona</th><th>Estado</th><th>Hora asig.</th><th>Observación</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="ka-empty"><p>Cargando…</p></td></tr>}
              {!loading && !leads.length && (
                <tr><td colSpan={7} className="ka-empty"><p>No hay contactos que coincidan con el filtro.</p></td></tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="ka-phone">{lead.phone}</div>
                    <div className="small ka-muted">{lead.phone2 || 'Sin teléfono secundario'}</div>
                  </td>
                  <td>{lead.advisor || <span className="ka-muted">Sin asignar</span>}</td>
                  <td>{lead.zone || '—'}</td>
                  <td><span className={`badge ${lead.status === 'venta_cerrada' ? 'text-bg-success' : 'text-bg-light border'}`}>{prettyStatus(lead.status)}</span></td>
                  <td>{fmtTime(lead.assignedAt)}</td>
                  <td><div className="ka-clamp">{lead.advisorNote || lead.backNotes || '—'}</div></td>
                  <td><button className="btn btn-outline-secondary btn-sm" onClick={() => setHistorial(lead)}>Historial</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ka-foot">{leads.length} contactos</div>
      </div>

      {historial && (
        <Modal title="Historial de gestión" subtitle={historial.phone} onClose={() => setHistorial(null)} size="md">
          <div className="modal-body">
            {historial.managementHistory?.length ? (
              <ul className="list-unstyled mb-0">
                {historial.managementHistory.map((iso, i) => <li key={i} className="small border-start ps-3 pb-2">{new Date(iso).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</li>)}
              </ul>
            ) : <p className="small text-muted mb-0">Sin gestiones registradas.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
