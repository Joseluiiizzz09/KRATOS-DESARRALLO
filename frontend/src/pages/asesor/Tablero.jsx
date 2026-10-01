import { useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { localDay } from '../../utils/date';
import { BarChart, DualBarChart, VERDE, NEGRO, ROJO } from '../../components/charts.jsx';
import './asesor.css';

const ACTIVAS = ['activa'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    const caidas = (list) => list.filter((s) => s.status === 'caida').length;

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
      <div className="ka-head">
        <h1 className="ka-title">Tablero y métricas</h1>
      </div>
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-sm-6 col-lg-4 col-xxl-2" key={card.label}>
            <div className="ka-stat">
              <div className="ka-field-label">{card.label}</div>
              <div className="ka-stat-value">{card.value}</div>
              <div className="ka-stat-help">{card.detail}</div>
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
