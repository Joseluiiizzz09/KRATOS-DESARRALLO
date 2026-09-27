import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AvanceAsesores() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.boReportAdvisors(token).then((r) => setAdvisors(r.advisors)).finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Reportes</div>
          <h1 className="ka-title">Avance Asesores</h1>
        </div>
      </div>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table" style={{ minWidth: 900, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th>Asesor</th><th>Asignados</th><th>Gestionados</th><th>Avance</th><th>Ventas</th><th>Instaladas</th><th>Caídas</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="ka-empty"><p>Cargando…</p></td></tr>}
              {!loading && !advisors.length && <tr><td colSpan={7} className="ka-empty"><p>Todavía no hay asesores con contactos asignados.</p></td></tr>}
              {advisors.map((a) => (
                <tr key={a.id}>
                  <td className="ka-phone">{a.nombre}</td>
                  <td>{a.asignados}</td>
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
                  <td>{a.instaladas}</td>
                  <td>{a.caidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
