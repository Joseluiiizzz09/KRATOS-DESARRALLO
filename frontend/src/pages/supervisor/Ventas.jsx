import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Field, Filters, Pager } from '../../components/bo.jsx';
import { ESTADOS_VENTA, estadoVenta } from '../../data/catalog.js';
import SaleModal from '../../components/SaleModal.jsx';

/** "2026-09-30" -> "30/09/2026". */
function fechaCorta(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

const ESTADOS = [['', 'Todos'], ...ESTADOS_VENTA.map(([value, label]) => [value, label])];

export default function Ventas() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [filters, setFilters] = useState({ advisorId: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ sales: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.supSales(token, { ...filters, page }));
    } finally {
      setLoading(false);
    }
  }, [token, filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.supAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);

  const setFilter = (field, value) => { setFilters((current) => ({ ...current, [field]: value })); setPage(1); };
  const { sales } = data;

  return (
    <div>
      <div className="ka-head">
        <div>
          <h1 className="ka-title">Ventas del equipo</h1>
        </div>
      </div>

      <Filters>
        <Field label="Asesor" grow>
          <select className="ka-select" value={filters.advisorId} onChange={(e) => setFilter('advisorId', e.target.value)}>
            <option value="">Todos los asesores</option>
            {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="ka-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            {ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <button className="ka-btn" onClick={() => { setFilters({ advisorId: '', status: '' }); setPage(1); }}>Limpiar</button>
      </Filters>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table ka-table--compact">
            <thead>
              <tr>
                <th>Estado</th><th>Fecha programada</th><th>Fecha de ingreso</th><th>Nombre</th><th>DNI</th>
                <th>N1</th><th>N2</th><th>Departamento</th><th>Distrito</th><th>Paquete</th><th>Asesor</th><th>Hora</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={13} className="ka-empty"><p>Cargando…</p></td></tr>}
              {!loading && !sales.length && (
                <tr><td colSpan={13} className="ka-empty"><p>No hay ventas que coincidan con el filtro.</p></td></tr>
              )}
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <span className={`badge ${estadoVenta(sale.status).badge}`}>{estadoVenta(sale.status).label}</span>
                  </td>
                  <td>{fechaCorta(sale.scheduledDate)}</td>
                  <td>{fechaCorta((sale.createdAt || '').slice(0, 10))}</td>
                  <td>{sale.clientName}</td>
                  <td>{sale.documentNumber || '—'}</td>
                  <td>{sale.clientPhone || '—'}</td>
                  <td>{sale.referencePhone || '—'}</td>
                  <td>{sale.department || '—'}</td>
                  <td>{sale.district || '—'}</td>
                  <td>{sale.productName}</td>
                  <td>{sale.advisor || '—'}</td>
                  <td className="ka-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{(sale.createdAt || '').slice(11, 16) || '—'}</td>
                  <td>
                    <button type="button" className="ka-btn" onClick={() => setEditando(sale)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager total={data.total} page={page} pageSize={data.pageSize || 20} onPage={setPage} />
      </div>

      {editando && (
        <SaleModal
          key={editando.id}
          show
          title="Editar datos de la venta"
          submitLabel="Guardar cambios"
          prefill={{
            clientName: editando.clientName || '', documentType: editando.documentType || '',
            documentNumber: editando.documentNumber || '', clientPhone: editando.clientPhone || '',
            referencePhone: editando.referencePhone || '', productName: editando.productName || '',
            saleType: editando.saleType || '', notes: editando.notes || '', leadId: editando.leadId,
          }}
          onClose={() => setEditando(null)}
          onSubmit={async (payload) => { await api.supUpdateSale(token, editando.id, payload); setEditando(null); load(); }}
        />
      )}
    </div>
  );
}
