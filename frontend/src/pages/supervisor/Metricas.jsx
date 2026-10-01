import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { MetricCards } from '../../components/bo.jsx';
import { BarChart, DualBarChart, VERDE, NEGRO, ROJO } from '../../components/charts.jsx';

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
    const activas = (list) => list.filter((s) => s.status === 'activa').length;
    const caidas = (list) => list.filter((s) => s.status === 'caida').length;

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
        </>
      )}
    </div>
  );
}
