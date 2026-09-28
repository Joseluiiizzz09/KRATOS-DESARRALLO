import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, Filters, fmtDateTime, prettyStatus } from '../../components/bo.jsx';

const ESTADOS = [
  ['', 'Todos'],
  ['en_verificacion', 'En verificación'],
  ['aprobada', 'Aprobada'],
  ['rechazada', 'Rechazada'],
];

export default function Ventas() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [filters, setFilters] = useState({ advisorId: '', status: '' });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { sales: rows } = await api.supSales(token, filters);
      setSales(rows);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.supAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const totalMonto = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Supervisión</div>
          <h1 className="ka-title">Ventas del equipo</h1>
        </div>
      </div>

      <Filters>
        <Field label="Asesor">
          <select className="form-select form-select-sm" value={filters.advisorId} onChange={(e) => setFilter('advisorId', e.target.value)}>
            <option value="">Todos</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="form-select form-select-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            {ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setFilters({ advisorId: '', status: '' })}>Limpiar</button>
        <span className="small text-muted ms-auto">{sales.length} ventas · S/ {totalMonto.toFixed(2)}</span>
      </Filters>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table" style={{ minWidth: 1150, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>Folio</th><th>Cliente</th><th>Asesor</th><th>Plan</th><th>Monto</th><th>Estado</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="ka-empty"><p>Cargando…</p></td></tr>}
              {!loading && !sales.length && (
                <tr><td colSpan={7} className="ka-empty"><p>No hay ventas que coincidan con el filtro.</p></td></tr>
              )}
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="ka-phone">{sale.folio}</td>
                  <td>{sale.clientName}<div className="small ka-muted">{sale.clientPhone}</div></td>
                  <td>{sale.advisor || '—'}</td>
                  <td>{sale.productName}</td>
                  <td>S/ {Number(sale.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${sale.status === 'aprobada' ? 'text-bg-success' : sale.status === 'rechazada' ? 'text-bg-danger' : 'text-bg-light border'}`}>
                      {prettyStatus(sale.status)}
                    </span>
                  </td>
                  <td className="small ka-muted">{fmtDateTime(sale.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
