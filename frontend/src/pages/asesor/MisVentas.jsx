import { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import SaleModal from '../../components/SaleModal.jsx';

const STATUS_BADGE = {
  en_verificacion: 'text-bg-warning',
  aprobada: 'text-bg-success',
  auditada: 'text-bg-info',
  rechazada: 'text-bg-danger',
};

export default function MisVentas() {
  const { sales, loading, error, createSale } = useSales();
  const [showModal, setShowModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  if (loading) return <p>Cargando ventas…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Mis ventas</h1>
        <button className="btn btn-danger" onClick={() => { setModalKey((k) => k + 1); setShowModal(true); }}>+ Nueva venta</button>
      </div>

      {sales.length === 0 ? (
        <div className="card p-5 text-center text-muted">Todavía no registraste ninguna venta.</div>
      ) : (
        <div className="card">
          <ul className="list-group list-group-flush">
            {sales.map((sale) => (
              <li key={sale.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{sale.clientName} <span className="text-muted small">· {sale.clientPhone}</span></div>
                  <div className="small text-muted">{sale.folio} · {sale.productName}</div>
                </div>
                <div className="text-end">
                  <div className="fw-semibold">S/ {Number(sale.amount).toFixed(2)}</div>
                  <span className={`badge ${STATUS_BADGE[sale.status] || 'text-bg-secondary'}`}>{sale.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SaleModal
        key={modalKey}
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (payload) => { await createSale(payload); setShowModal(false); }}
        prefill={{}}
      />
    </div>
  );
}
