import { useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { localDay, today } from '../../utils/date';
import { STATUSES } from '../../data/catalog';

function isManaged(status) {
  return status && status !== 'pendiente';
}

export default function Tablero() {
  const { leads, loading: loadingLeads } = useLeads();
  const { sales, loading: loadingSales } = useSales();

  const stats = useMemo(() => {
    const todayStr = today();
    const managed = leads.filter((lead) => isManaged(lead.status)).length;
    const salesToday = sales.filter((sale) => sale.createdAt && localDay(sale.createdAt) === todayStr).length;
    const activas = sales.filter((sale) => sale.status === 'aprobada' || sale.status === 'auditada').length;
    const caidas = sales.filter((sale) => sale.status === 'rechazada').length;
    const porEstado = STATUSES.map(([value, label]) => ({ label, n: leads.filter((l) => l.status === value).length })).filter((e) => e.n > 0);
    const ventasTotal = sales.length;
    const contactabilidad = leads.length ? Math.round((managed / leads.length) * 100) : 0;
    const conversion = managed ? Math.round((leads.filter((l) => l.status === 'venta_cerrada').length / managed) * 100) : 0;
    return { managed, salesToday, activas, caidas, porEstado, ventasTotal, contactabilidad, conversion };
  }, [leads, sales]);

  if (loadingLeads || loadingSales) return <p>Cargando…</p>;

  const cards = [
    { label: 'Contactos asignados', value: leads.length, detail: `${leads.length - stats.managed} pendientes de gestión` },
    { label: 'Gestionados hoy', value: stats.managed, detail: leads.length ? `${Math.round((stats.managed / leads.length) * 100)}% de la cartera` : 'Sin cartera' },
    { label: 'Ventas del día', value: stats.salesToday, detail: 'Registradas en la jornada' },
    { label: 'Ventas activas', value: stats.activas, detail: `${stats.caidas} caídas` },
  ];

  return (
    <div>
      <h1 className="h4 mb-3">Tablero y métricas</h1>
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-sm-6 col-lg-3" key={card.label}>
            <div className="card h-100">
              <div className="card-body">
                <div className="text-muted small text-uppercase fw-semibold">{card.label}</div>
                <div className="display-6 fw-bold">{card.value}</div>
                <div className="small text-muted">{card.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold mb-3">Gestión por estado</div>
              {stats.porEstado.length === 0 ? (
                <div className="small text-muted">Aún no hay contactos gestionados.</div>
              ) : (
                stats.porEstado.map((e) => (
                  <div className="d-flex align-items-center gap-3 mb-2" key={e.label}>
                    <div className="small" style={{ width: 160 }}>{e.label}</div>
                    <div className="flex-grow-1 rounded" style={{ height: 8, background: '#eef0f3' }}>
                      <div className="rounded" style={{ height: 8, width: `${(e.n / leads.length) * 100}%`, background: '#111a2c' }} />
                    </div>
                    <div className="small fw-semibold text-end" style={{ width: 28 }}>{e.n}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small text-uppercase fw-semibold mb-3">Resumen</div>
              {[
                ['Contactabilidad', `${stats.contactabilidad}%`],
                ['Conversión sobre gestionados', `${stats.conversion}%`],
                ['Ventas registradas', stats.ventasTotal],
                ['Ventas activas', stats.activas],
                ['Ventas caídas', stats.caidas],
              ].map(([k, v]) => (
                <div className="d-flex justify-content-between py-2 border-bottom small" key={k}>
                  <span className="text-muted">{k}</span>
                  <span className="fw-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
