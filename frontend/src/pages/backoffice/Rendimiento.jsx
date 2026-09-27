import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { MetricCards } from '../../components/bo.jsx';

function Bars({ data, field, label }) {
  const max = Math.max(1, ...data.map((d) => d[field]));
  return (
    <div className="ka-card p-3">
      <div className="text-muted small text-uppercase fw-semibold mb-3">{label}</div>
      <div className="d-flex align-items-end gap-1" style={{ height: 160 }}>
        {data.map((d) => (
          <div className="flex-grow-1 h-100 d-flex flex-column align-items-center justify-content-end" key={d.day} title={`${d.day}: ${d[field]}`}>
            <div style={{ width: '100%', maxWidth: 18, height: `${(d[field] / max) * 100}%`, minHeight: d[field] ? 4 : 2, background: d[field] ? '#111a2c' : '#d3d8df', borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-between mt-2 border-top pt-2 text-muted" style={{ fontSize: 10.5 }}>
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export default function Rendimiento() {
  const { token } = useAuth();
  const [data, setData] = useState({ series: [], totals: { asignados: 0, gestionados: 0, ventas: 0 }, conversion: 0 });
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.boReportPerformance(token, days).then(setData).finally(() => setLoading(false));
  }, [token, days]);

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Reportes</div>
          <h1 className="ka-title">Rendimiento</h1>
        </div>
        <div className="ka-head-tools">
          <select className="form-select form-select-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
          </select>
        </div>
      </div>

      {loading ? <p className="text-muted small">Cargando…</p> : (
        <>
          <MetricCards items={[
            ['Asignados', data.totals.asignados, 'En el período'],
            ['Gestionados', data.totals.gestionados, 'En el período'],
            ['Ventas', data.totals.ventas, 'En el período'],
            ['Conversión', `${data.conversion}%`, 'Ventas sobre gestionados'],
          ]}
          />
          <div className="row g-3">
            <div className="col-lg-4"><Bars data={data.series} field="asignados" label="Asignados por día" /></div>
            <div className="col-lg-4"><Bars data={data.series} field="gestionados" label="Gestionados por día" /></div>
            <div className="col-lg-4"><Bars data={data.series} field="ventas" label="Ventas por día" /></div>
          </div>
        </>
      )}
    </div>
  );
}
