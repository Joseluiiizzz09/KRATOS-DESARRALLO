import { useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { localDay } from '../../utils/date';

const ACTIVAS = ['aprobada', 'auditada'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Tablero() {
  const { sales, loading } = useSales();

  const stats = useMemo(() => {
    const now = new Date();
    const hoy = ymd(now);
    const lunes = new Date(now);
    lunes.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const semana = ymd(lunes);
    const mes = hoy.slice(0, 7);

    const dias = sales.filter((s) => s.createdAt).map((s) => ({ dia: localDay(s.createdAt), status: s.status }));
    const enSemana = dias.filter((s) => s.dia >= semana && s.dia <= hoy);
    const enMes = dias.filter((s) => s.dia.slice(0, 7) === mes);
    const activas = (list) => list.filter((s) => ACTIVAS.includes(s.status)).length;
    const caidas = (list) => list.filter((s) => s.status === 'rechazada').length;

    return {
      diarias: dias.filter((s) => s.dia === hoy).length,
      semanales: enSemana.length,
      activasSemana: activas(enSemana),
      mensuales: enMes.length,
      activasMes: activas(enMes),
      caidasSemana: caidas(enSemana),
      caidasMes: caidas(enMes),
    };
  }, [sales]);

  if (loading) return <p>Cargando…</p>;

  const cards = [
    { label: 'Ventas diarias', value: stats.diarias, detail: 'Registradas hoy' },
    { label: 'Ventas semanales', value: stats.semanales, detail: 'Desde el lunes' },
    { label: 'Activas semanales', value: stats.activasSemana, detail: 'Esta semana' },
    { label: 'Ventas mensuales', value: stats.mensuales, detail: 'Este mes' },
    { label: 'Activas mensuales', value: stats.activasMes, detail: 'Este mes' },
    { label: 'Caídas', value: stats.caidasMes, detail: `${stats.caidasSemana} esta semana · ${stats.caidasMes} este mes` },
  ];

  return (
    <div>
      <h1 className="h4 mb-3">Tablero y métricas</h1>
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-sm-6 col-lg-4 col-xxl-2" key={card.label}>
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
