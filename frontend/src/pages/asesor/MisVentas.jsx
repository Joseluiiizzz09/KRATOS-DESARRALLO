import { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import { estadoVenta } from '../../data/catalog.js';
import '../../operaciones/styles/venta-assignment.css';
import './asesor.css';

/** "2026-09-30" -> "30/09/2026". */
function fechaCorta(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

const COLUMNAS = [
  'Estado', 'Fecha de entrega', 'Fecha de ingreso', 'Hora', 'Nombre', 'DNI', 'N1', 'N2',
  'Departamento', 'Provincia', 'Distrito', 'Paquete', 'Canal', 'Tipo de operación', 'Observaciones', 'Acción',
];

export default function MisVentas() {
  const { sales, loading, error } = useSales();
  const [ver, setVer] = useState(null);

  if (loading) return <p>Cargando ventas…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="ka-head">
        <h1 className="ka-title">Mis ventas</h1>
      </div>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table ka-table--ventas">
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
                    <td><span className={`ka-pill ka-pill--${sale.status || 'pendiente'}`}>{estado.label}</span></td>
                    <td>{fechaCorta(sale.scheduledDate)}</td>
                    <td>{fechaCorta((sale.createdAt || '').slice(0, 10))}</td>
                    <td className="ka-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{(sale.createdAt || '').slice(11, 16) || '—'}</td>
                    <td className="ka-cut" title={sale.clientName}>{sale.clientName}</td>
                    <td>{sale.documentNumber || '—'}</td>
                    <td className="ka-num">{sale.clientPhone || '—'}</td>
                    <td>{sale.referencePhone || '—'}</td>
                    <td>{sale.department || '—'}</td>
                    <td>{sale.province || '—'}</td>
                    <td>{sale.district || '—'}</td>
                    <td className="ka-cut" title={sale.productName}>{sale.productName}</td>
                    <td>{sale.channel || '—'}</td>
                    <td>{sale.saleType || '—'}</td>
                    <td className="ka-muted" title={sale.notes || ''} style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.notes || '—'}</td>
                    <td><button type="button" className="ka-btn" onClick={() => setVer(sale)}>Ver</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="ka-foot">{sales.length} {sales.length === 1 ? 'venta' : 'ventas'}</div>
      </div>

      {ver && (
        <div className="va-overlay" onClick={(e) => { if (e.target === e.currentTarget) setVer(null); }}>
          <div className="va-modal" style={{ width: 'min(640px,100%)', maxHeight: 'min(88vh,820px)' }} role="dialog" aria-modal="true" aria-label="Detalle de la venta">
            <header className="va-header">
              <div>
                <h3>Detalle de la venta</h3>
                <p>{ver.clientName} · {estadoVenta(ver.status).label}</p>
              </div>
              <button type="button" className="va-close" onClick={() => setVer(null)} aria-label="Cerrar">×</button>
            </header>
            <div className="va-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
              {[
                ['Estado', estadoVenta(ver.status).label],
                ['Fecha de entrega', fechaCorta(ver.scheduledDate)],
                ['Fecha de ingreso', fechaCorta((ver.createdAt || '').slice(0, 10))],
                ['Hora', (ver.createdAt || '').slice(11, 16) || '—'],
                ['Nombre', ver.clientName],
                ['Documento', `${ver.documentType || ''} ${ver.documentNumber || ''}`.trim() || '—'],
                ['N1', ver.clientPhone],
                ['N2', ver.referencePhone],
                ['Departamento', ver.department],
                ['Provincia', ver.province],
                ['Distrito', ver.district],
                ['Paquete', ver.productName],
                ['Canal', ver.channel],
                ['Tipo de operación', ver.saleType],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
                  <div style={{ fontSize: 14, color: '#111827' }}>{v || '—'}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>Observaciones</div>
                <div style={{ fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap' }}>{ver.notes || '—'}</div>
              </div>
            </div>
            <footer className="va-footer">
              <button type="button" className="va-button secondary" onClick={() => setVer(null)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
