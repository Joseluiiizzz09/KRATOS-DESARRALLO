import { useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { localDay } from '../../utils/date';

const VERDE = '#16a34a';
const NEGRO = '#111a2c';
const ROJO = '#dc2626';
const ACTIVAS = ['aprobada', 'auditada'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

    const ultimosDias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const delDia = dias.filter((s) => s.dia === ymd(d));
      return { label: DIAS[d.getDay()], activas: activas(delDia), caidas: caidas(delDia) };
    });
    const ultimosMeses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const clave = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      return { label: MESES[d.getMonth()], value: dias.filter((s) => s.dia.slice(0, 7) === clave).length };
    });
    const anio = String(now.getFullYear());
    const todosMeses = MESES.map((label, i) => ({
      label,
      value: dias.filter((s) => s.dia.slice(0, 7) === `${anio}-${pad(i + 1)}`).length,
    }));
    const hoyDias = dias.filter((s) => s.dia === hoy);
    const resumenDia = [
      { label: 'Ventas', value: hoyDias.length, color: NEGRO },
      { label: 'Activas', value: activas(hoyDias), color: VERDE },
      { label: 'Caídas', value: caidas(hoyDias), color: ROJO },
    ];
    const resumenMes = [
      { label: 'Ventas', value: enMes.length, color: NEGRO },
      { label: 'Activas', value: activas(enMes), color: VERDE },
      { label: 'Caídas', value: caidas(enMes), color: ROJO },
    ];

    return {
      ultimosDias,
      todosMeses,
      resumenDia,
      anio,
      ultimosMeses,
      resumenMes,
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

      <div className="row g-3 mt-1">
        <div className="col-lg-4"><BarChart title="Hoy · ventas, activas y caídas" data={stats.resumenDia} legend /></div>
        <div className="col-lg-4"><DualBarChart title="Últimos 7 días" data={stats.ultimosDias} /></div>
        <div className="col-lg-4"><BarChart title="Este mes · ventas, activas y caídas" data={stats.resumenMes} legend /></div>
      </div>

      <div className="mt-3">
        <BarChart title={`Ventas por mes · ${stats.anio}`} data={stats.todosMeses} />
      </div>
    </div>
  );
}
