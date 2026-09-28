import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { MetricCards } from '../../components/bo.jsx';

const VERDE = '#16a34a';
const NEGRO = '#111a2c';
const ROJO = '#dc2626';
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function pad(n) {
  return String(n).padStart(2, '0');
}
function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Fecha local (Lima) a partir del DATETIME de MySQL, tal como llega del backend. */
function localDay(mysqlDate) {
  return String(mysqlDate).slice(0, 10);
}

function DualBarChart({ title, data }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.activas, d.caidas]));
  const bar = (value, color) => (
    <div className="d-flex flex-column align-items-center justify-content-end h-100" style={{ width: 22 }}>
      <div className="small fw-semibold mb-1">{value}</div>
      <div style={{ width: '100%', height: `${(value / max) * 100}%`, minHeight: value ? 4 : 2, background: value ? color : '#d3d8df', borderRadius: '5px 5px 0 0' }} />
    </div>
  );
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div className="text-muted small text-uppercase fw-semibold">{title}</div>
          <div className="d-flex gap-3 text-muted" style={{ fontSize: 11 }}>
            <span><span className="d-inline-block rounded-circle me-1" style={{ width: 9, height: 9, background: VERDE }} />Activas</span>
            <span><span className="d-inline-block rounded-circle me-1" style={{ width: 9, height: 9, background: ROJO }} />Caídas</span>
          </div>
        </div>
        <div className="d-flex align-items-end" style={{ height: 180 }}>
          {data.map((d) => (
            <div className="flex-grow-1 d-flex align-items-end justify-content-center gap-1 h-100" key={d.label}>
              {bar(d.activas, VERDE)}
              {bar(d.caidas, ROJO)}
            </div>
          ))}
        </div>
        <div className="d-flex mt-2 border-top pt-2">
          {data.map((d) => (
            <div className="flex-grow-1 text-center text-muted" style={{ fontSize: 11 }} key={d.label}>{d.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ title, data, legend }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div className="text-muted small text-uppercase fw-semibold">{title}</div>
          {legend && (
            <div className="d-flex gap-3 text-muted" style={{ fontSize: 11 }}>
              {data.map((d) => (
                <span key={d.label}><span className="d-inline-block rounded-circle me-1" style={{ width: 9, height: 9, background: d.color }} />{d.label}</span>
              ))}
            </div>
          )}
        </div>
        <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
          {data.map((d) => (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100" key={d.label}>
              <div className="small fw-semibold mb-1">{d.value}</div>
              <div style={{ width: '100%', maxWidth: 64, height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2, background: d.value ? d.color || NEGRO : '#d3d8df', borderRadius: '6px 6px 0 0' }} />
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 mt-2 border-top pt-2">
          {data.map((d) => (
            <div className="flex-grow-1 text-center text-muted" style={{ fontSize: 11 }} key={d.label}>{d.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Metricas() {
  const { token } = useAuth();
  const [data, setData] = useState({
    porAsesor: [],
    totales: { contactos: 0, gestionados: 0, ventas: 0, aprobadas: 0, rechazadas: 0 },
    asesores: 0,
    hoy: { ventas: 0, activas: 0, caidas: 0, asesoresActivos: 0 },
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.supMetrics(token), api.supSales(token, {})])
      .then(([metrics, salesData]) => { setData(metrics); setSales(salesData.sales); })
      .finally(() => setLoading(false));
  }, [token]);

  const { hoy, porAsesor } = data;

  const stats = useMemo(() => {
    const now = new Date();
    const dias = sales.filter((s) => s.createdAt).map((s) => ({ dia: localDay(s.createdAt), status: s.status }));
    const activas = (list) => list.filter((s) => s.status === 'aprobada').length;
    const caidas = (list) => list.filter((s) => s.status === 'rechazada').length;

    const ultimosDias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const delDia = dias.filter((s) => s.dia === ymd(d));
      return { label: DIAS[d.getDay()], activas: activas(delDia), caidas: caidas(delDia) };
    });
    const anio = String(now.getFullYear());
    const todosMeses = MESES.map((label, i) => ({
      label,
      value: dias.filter((s) => s.dia.slice(0, 7) === `${anio}-${pad(i + 1)}`).length,
    }));
    const ventasPorAsesor = porAsesor.map((a) => ({ label: a.nombre, value: a.ventas, color: NEGRO }));

    return { ultimosDias, anio, todosMeses, ventasPorAsesor };
  }, [sales, porAsesor]);

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Supervisión</div>
          <h1 className="ka-title">Métricas</h1>
        </div>
      </div>

      {loading ? <p className="text-muted small">Cargando…</p> : (
        <>
          <MetricCards items={[
            ['Ventas del día', hoy.ventas, 'Registradas hoy en todo el equipo'],
            ['Activas', hoy.activas, 'Aprobadas hoy'],
            ['Caídas', hoy.caidas, 'Rechazadas hoy'],
            ['Asesores vendiendo', hoy.asesoresActivos, 'Con al menos una venta hoy'],
          ]}
          />

          <div className="row g-3 mb-3">
            <div className="col-lg-6"><DualBarChart title="Últimos 7 días · equipo" data={stats.ultimosDias} /></div>
            <div className="col-lg-6"><BarChart title="Ventas por asesor" data={stats.ventasPorAsesor} /></div>
          </div>

          <div className="mb-3">
            <BarChart title={`Ventas por mes · ${stats.anio}`} data={stats.todosMeses} />
          </div>

          <div className="ka-card">
            <div className="ka-scroll">
              <table className="ka-table" style={{ minWidth: 900, tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th>Asesor</th><th>Contactos</th><th>Gestionados</th><th>Avance</th><th>Ventas</th><th>Aprobadas</th><th>Rechazadas</th>
                  </tr>
                </thead>
                <tbody>
                  {!porAsesor.length && <tr><td colSpan={7} className="ka-empty"><p>Todavía no hay asesores con contactos asignados.</p></td></tr>}
                  {porAsesor.map((a) => (
                    <tr key={a.id}>
                      <td className="ka-phone">{a.nombre}</td>
                      <td>{a.contactos}</td>
                      <td>{a.gestionados}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded flex-grow-1" style={{ height: 8, background: '#eef0f3', maxWidth: 120 }}>
                            <div className="rounded" style={{ height: 8, width: `${a.avance}%`, background: '#111a2c' }} />
                          </div>
                          <span className="small">{a.avance}%</span>
                        </div>
                      </td>
                      <td>{a.ventas}</td>
                      <td>{a.aprobadas}</td>
                      <td>{a.rechazadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
