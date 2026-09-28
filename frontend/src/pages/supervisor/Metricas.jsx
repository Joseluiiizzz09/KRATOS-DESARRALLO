import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { MetricCards } from '../../components/bo.jsx';

export default function Metricas() {
  const { token } = useAuth();
  const [data, setData] = useState({
    porAsesor: [],
    totales: { contactos: 0, gestionados: 0, ventas: 0, aprobadas: 0, rechazadas: 0 },
    asesores: 0,
    hoy: { ventas: 0, activas: 0, caidas: 0, asesoresActivos: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.supMetrics(token).then(setData).finally(() => setLoading(false));
  }, [token]);

  const { hoy } = data;

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

          <div className="ka-card">
            <div className="ka-scroll">
              <table className="ka-table" style={{ minWidth: 900, tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th>Asesor</th><th>Contactos</th><th>Gestionados</th><th>Avance</th><th>Ventas</th><th>Aprobadas</th><th>Rechazadas</th>
                  </tr>
                </thead>
                <tbody>
                  {!data.porAsesor.length && <tr><td colSpan={7} className="ka-empty"><p>Todavía no hay asesores con contactos asignados.</p></td></tr>}
                  {data.porAsesor.map((a) => (
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
