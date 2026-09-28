import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, Filters, Modal, Pager, fmtTime, prettyStatus, useDebounced } from '../../components/bo.jsx';

/** Lista de asesores como tarjetas: clic en una para entrar a su base completa. */
function AdvisorGrid({ advisors, metricsByAdvisor, onOpen }) {
  return (
    <div className="row g-3">
      {advisors.map((a) => {
        const m = metricsByAdvisor[a.id];
        return (
          <div className="col-sm-6 col-lg-4 col-xxl-3" key={a.id}>
            <button type="button" className="card h-100 w-100 text-start border-0" style={{ cursor: 'pointer' }} onClick={() => onOpen(a.id)}>
              <div className="card-body">
                <div className="fw-semibold">{a.nombre}</div>
                <div className="display-6 fw-bold mt-1">{a.contactos}</div>
                <div className="small text-muted">contacto{a.contactos === 1 ? '' : 's'} asignados</div>
                {m && <div className="small text-muted mt-2">{m.gestionados} gestionados · {m.ventas} ventas</div>}
              </div>
            </button>
          </div>
        );
      })}
      {!advisors.length && <div className="col-12"><div className="ka-card ka-empty"><p>Todavía no hay asesores.</p></div></div>}
    </div>
  );
}

export default function BaseLlamadas() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [metricsByAdvisor, setMetricsByAdvisor] = useState({});
  const [filters, setFilters] = useState({ advisorId: '', status: '', q: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ leads: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState(null);
  const q = useDebounced(filters.q);

  const params = useMemo(() => ({ ...filters, q }), [filters, q]);

  const load = useCallback(async () => {
    if (!filters.advisorId) return;
    setLoading(true);
    try {
      setData(await api.supLeads(token, { ...params, page }));
    } finally {
      setLoading(false);
    }
  }, [token, params, page, filters.advisorId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.supAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);
  useEffect(() => {
    api.supMetrics(token).then((r) => {
      setMetricsByAdvisor(Object.fromEntries(r.porAsesor.map((a) => [a.id, a])));
    }).catch(() => {});
  }, [token]);

  const setFilter = (field, value) => { setFilters((current) => ({ ...current, [field]: value })); setPage(1); };
  const abrirAsesor = (advisorId) => { setFilters({ advisorId: String(advisorId), status: '', q: '' }); setPage(1); };
  const volver = () => setFilters({ advisorId: '', status: '', q: '' });

  const asesorActivo = advisors.find((a) => String(a.id) === String(filters.advisorId));
  const { leads } = data;

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Supervisión</div>
          <h1 className="ka-title">Base de llamadas del equipo</h1>
        </div>
      </div>

      {!filters.advisorId ? (
        <AdvisorGrid advisors={advisors} metricsByAdvisor={metricsByAdvisor} onOpen={abrirAsesor} />
      ) : (
        <>
          <div className="d-flex align-items-center gap-2 mb-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={volver}>← Todos los asesores</button>
            <span className="fw-semibold">{asesorActivo?.nombre}</span>
          </div>

          <Filters>
            <Field label="Buscar" grow>
              <input className="form-control form-control-sm" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Teléfono, cliente o zona" />
            </Field>
            <Field label="Estado">
              <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="venta_cerrada">Venta cerrada</option>
              </select>
            </Field>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setFilters((current) => ({ ...current, status: '', q: '' }))}>Limpiar</button>
          </Filters>

          <div className="ka-card">
            <div className="ka-scroll">
              <table className="ka-table" style={{ minWidth: 1150, tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th>Contacto</th><th>Zona</th><th>Tipif. Back</th><th>Estado asesor</th><th>Hora asig.</th><th>Observación asesor</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} className="ka-empty"><p>Cargando…</p></td></tr>}
                  {!loading && !leads.length && (
                    <tr><td colSpan={7} className="ka-empty"><p>Este asesor no tiene contactos que coincidan con el filtro.</p></td></tr>
                  )}
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className="ka-phone">{lead.phone}</div>
                        <div className="small ka-muted">{lead.phone2 || 'Sin teléfono secundario'}</div>
                      </td>
                      <td>{lead.zone || '—'}</td>
                      <td>{lead.tipificacion || '—'}</td>
                      <td><span className={`badge ${lead.status === 'venta_cerrada' ? 'text-bg-success' : 'text-bg-light border'}`}>{prettyStatus(lead.status)}</span></td>
                      <td>{fmtTime(lead.assignedAt)}</td>
                      <td><div className="ka-clamp">{lead.advisorNote || lead.backNotes || '—'}</div></td>
                      <td><button className="btn btn-outline-secondary btn-sm" onClick={() => setHistorial(lead)}>Historial</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager total={data.total} page={page} pageSize={data.pageSize || 20} onPage={setPage} />
          </div>
        </>
      )}

      {historial && (
        <Modal title="Historial de gestión" subtitle={`${historial.phone} · ${historial.advisor || 'Sin asignar'}`} onClose={() => setHistorial(null)} size="md">
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
