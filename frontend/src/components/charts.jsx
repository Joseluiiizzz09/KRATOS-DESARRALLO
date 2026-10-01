/** Gráficos de barras compartidos por el Tablero del asesor y las Métricas del supervisor. */
export const VERDE = '#16a34a';
export const NEGRO = '#111a2c';
export const ROJO = '#dc2626';

export function DualBarChart({ title, data }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.activas, d.caidas]));
  const bar = (value, color) => (
    <div className="d-flex flex-column align-items-center justify-content-end h-100" style={{ width: 16 }}>
      <div className="ka-bar-value">{value}</div>
      <div style={{ width: '100%', height: `${(value / max) * 100}%`, minHeight: value ? 4 : 2, background: value ? color : '#e2e8f0', borderRadius: '5px 5px 0 0' }} />
    </div>
  );
  return (
    <div className="ka-chart">
      <div className="ka-chart-head">
        <div className="ka-field-label">{title}</div>
        <div className="ka-legend">
          <span><i style={{ background: VERDE }} />Activas</span>
          <span><i style={{ background: ROJO }} />Caídas</span>
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
      <div className="ka-axis">
        {data.map((d) => <div key={d.label}>{d.label}</div>)}
      </div>
    </div>
  );
}

export function BarChart({ title, data, legend }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="ka-chart">
      <div className="ka-chart-head">
        <div className="ka-field-label">{title}</div>
        {legend && (
          <div className="ka-legend">
            {data.map((d) => <span key={d.label}><i style={{ background: d.color }} />{d.label}</span>)}
          </div>
        )}
      </div>
      <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
        {data.map((d) => (
          <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100" key={d.label}>
            <div className="ka-bar-value">{d.value}</div>
            <div style={{ width: '100%', maxWidth: 40, height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2, background: d.value ? d.color || NEGRO : '#e2e8f0', borderRadius: '6px 6px 0 0' }} />
          </div>
        ))}
      </div>
      <div className="ka-axis">
        {data.map((d) => <div key={d.label}>{d.label}</div>)}
      </div>
    </div>
  );
}
