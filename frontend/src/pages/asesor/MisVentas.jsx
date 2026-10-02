import { useSales } from '../../hooks/useSales';
import { estadoVenta } from '../../data/catalog.js';
import './asesor.css';

/** "2026-09-30" -> "30/09/2026". */
function fechaCorta(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

const COLUMNAS = [
  'Estado', 'Fecha de entrega', 'Fecha de ingreso', 'Hora', 'Nombre', 'DNI', 'N1', 'N2',
  'Departamento', 'Provincia', 'Distrito', 'Paquete', 'Canal', 'Tipo de operación', 'Monto', 'Observaciones',
];

export default function MisVentas() {
  const { sales, loading, error } = useSales();

  if (loading) return <p>Cargando ventas…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="ka-head">
        <h1 className="ka-title">Mis ventas</h1>
      </div>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table ka-table--compact">
            <thead>
              <tr>{COLUMNAS.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {!sales.length && (
                <tr><td colSpan={COLUMNAS.length} className="ka-empty"><p>Todavía no registraste ninguna venta.</p></td></tr>
              )}
              {sales.map((sale) => {
                const estado = estadoVenta(sale.status);
                return (
                  <tr key={sale.id}>
                    <td><span className={`badge ${estado.badge}`}>{estado.label}</span></td>
                    <td>{fechaCorta(sale.scheduledDate)}</td>
                    <td>{fechaCorta((sale.createdAt || '').slice(0, 10))}</td>
                    <td className="ka-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{(sale.createdAt || '').slice(11, 16) || '—'}</td>
                    <td>{sale.clientName}</td>
                    <td>{sale.documentNumber || '—'}</td>
                    <td>{sale.clientPhone || '—'}</td>
                    <td>{sale.referencePhone || '—'}</td>
                    <td>{sale.department || '—'}</td>
                    <td>{sale.province || '—'}</td>
                    <td>{sale.district || '—'}</td>
                    <td>{sale.productName}</td>
                    <td>{sale.channel || '—'}</td>
                    <td>{sale.saleType || '—'}</td>
                    <td>S/ {Number(sale.amount).toFixed(2)}</td>
                    <td className="ka-muted" style={{ minWidth: 180, whiteSpace: 'normal' }}>{sale.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="ka-foot">{sales.length} {sales.length === 1 ? 'venta' : 'ventas'}</div>
      </div>
    </div>
  );
}
