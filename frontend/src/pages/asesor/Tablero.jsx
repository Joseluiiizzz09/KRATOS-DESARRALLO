import { useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { localDay, today } from '../../utils/date';

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
    return { managed, salesToday, activas, caidas };
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
    </div>
  );
}
