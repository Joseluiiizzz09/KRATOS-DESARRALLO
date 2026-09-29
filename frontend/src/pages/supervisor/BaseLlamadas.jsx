import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Pager, useDebounced } from '../../components/bo.jsx';
import { statusColors, statusOptions } from '../../data/catalog.js';
import { CopyIcon, PhoneIcon, WhatsAppIcon } from '../../components/icons.jsx';
import '../asesor/asesor.css';

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111a2c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

/** Lista de asesores como tarjetas: clic en una para entrar a su base completa. */
function AdvisorGrid({ advisors, metricsByAdvisor, onOpen }) {
  return (
    <div className="row g-3">
      {advisors.map((a) => {
        const m = metricsByAdvisor[a.id];
        return (
          <div className="col-sm-6 col-lg-4 col-xxl-3" key={a.id}>
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style={{ width: 40, height: 40 }}>
                  <PersonIcon />
                </div>
                <div className="fw-bold fs-5">{a.contactos}</div>
                <div className="text-muted small mb-2">contacto{a.contactos === 1 ? '' : 's'} asignado{a.contactos === 1 ? '' : 's'}</div>
                <div className="fw-semibold">{a.nombre}</div>
                <div className="small text-muted mb-3">{m ? `${m.gestionados} gestionados · ${m.ventas} ventas` : 'Cargando…'}</div>
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none mt-auto d-flex align-items-center gap-1" onClick={() => onOpen(a.id)}>
                  Ver base de llamadas <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {!advisors.length && <div className="col-12"><div className="ka-card ka-empty"><p>Todavía no hay asesores.</p></div></div>}
    </div>
  );
}

/** Igual que en la base del asesor: número + llamar/WhatsApp/copiar, sin editar nada. */
function TelefonoConAcciones({ numero }) {
  const [copiado, setCopiado] = useState(false);
  if (!numero) return <span className="ka-muted">—</span>;
  const digitos = numero.replace(/\D/g, '');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(numero);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
    } catch { /* noop */ }
  }

  return (
    <span className="ka-phone-cell">
      <span className="ka-phone">{numero}</span>
      <a className="ka-ibtn" href={`tel:${digitos}`} title="Llamar" aria-label={`Llamar a ${numero}`}>
        <PhoneIcon />
      </a>
      <a className="ka-ibtn ka-ibtn--wa" href={`https://wa.me/${digitos}`} target="_blank" rel="noreferrer" title="Abrir WhatsApp" aria-label={`Abrir WhatsApp de ${numero}`}>
        <WhatsAppIcon />
      </a>
      <button type="button" className="ka-ibtn" onClick={copiar} title="Copiar número" aria-label={`Copiar ${numero}`}>
        <CopyIcon />
      </button>
      {copiado && <span className="small text-success">✓</span>}
    </span>
  );
}

/** Nombre del estado tal como lo ve el asesor (mismas 13 tipificaciones + las antiguas). */
function labelEstado(status) {
  const match = statusOptions(status).find(([value]) => value === status);
  return match ? match[1] : status;
}

const COLUMNAS = ['Teléfono', 'Teléfono 2', 'Usuario WhatsApp', 'Obs. Back', 'Estado', 'Observación asesor', 'Zona', 'Dirección / Coord.', 'Hora asig.'];

/** Misma tabla de 9 columnas que ve el asesor en su propia Base de llamadas, pero de solo lectura. */
function FilaLead({ lead }) {
  const colores = statusColors(lead.status);
  const hora = typeof lead.assignedAt === 'string' && lead.assignedAt.length >= 16 ? lead.assignedAt.slice(11, 16) : '—';
  return (
    <tr>
      <td><TelefonoConAcciones numero={lead.phone} /></td>
      <td><TelefonoConAcciones numero={lead.phone2} /></td>
      <td className="ka-user">{lead.whatsappUser || '—'}</td>
      <td><span className="ka-clamp" title={lead.backNotes || ''}>{lead.backNotes || 'Sin observaciones'}</span></td>
      <td>
        <span
          className="ka-status"
          style={{
            backgroundColor: colores.bg, borderColor: colores.border, color: colores.text,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            backgroundImage: 'none', paddingRight: 12, cursor: 'default',
          }}
        >
          {labelEstado(lead.status)}
        </span>
      </td>
      <td><span className="ka-clamp">{lead.advisorNote || 'Sin observación'}</span></td>
      <td>{lead.zone || '—'}</td>
      <td><span className="ka-clamp">{lead.address || lead.coordinates || '—'}</span></td>
      <td className="ka-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{hora}</td>
    </tr>
  );
}

export default function BaseLlamadas() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [metricsByAdvisor, setMetricsByAdvisor] = useState({});
  const [advisorId, setAdvisorId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ leads: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const q = useDebounced(search);

  const load = useCallback(async () => {
    if (!advisorId) return;
    setLoading(true);
    try {
      setData(await api.supLeads(token, { advisorId, q, page }));
    } finally {
      setLoading(false);
    }
  }, [token, advisorId, q, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.supAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);
  useEffect(() => {
    api.supMetrics(token).then((r) => {
      setMetricsByAdvisor(Object.fromEntries(r.porAsesor.map((a) => [a.id, a])));
    }).catch(() => {});
  }, [token]);

  const abrirAsesor = (id) => { setAdvisorId(String(id)); setSearch(''); setPage(1); };
  const volver = () => { setAdvisorId(''); setSearch(''); setPage(1); };

  const asesorActivo = advisors.find((a) => String(a.id) === String(advisorId));
  const { leads } = data;

  return (
    <div>
      {!advisorId ? (
        <>
          <div className="ka-head">
            <div>
              <div className="text-muted small text-uppercase fw-semibold">Supervisión</div>
              <h1 className="ka-title">Base de llamadas del equipo</h1>
            </div>
          </div>
          <AdvisorGrid advisors={advisors} metricsByAdvisor={metricsByAdvisor} onOpen={abrirAsesor} />
        </>
      ) : (
        <>
          <div className="ka-head">
            <div>
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none mb-1 d-block" onClick={volver}>← Todos los asesores</button>
              <h1 className="ka-title">{asesorActivo?.nombre}</h1>
            </div>
            <div className="ka-head-tools">
              <input className="ka-search" placeholder="Filtrar número…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="ka-card">
            <div className="ka-scroll">
              <table className="ka-table" style={{ minWidth: 1500 }}>
                <thead>
                  <tr>
                    {COLUMNAS.map((etiqueta) => <th key={etiqueta}>{etiqueta}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={COLUMNAS.length} className="ka-empty"><p>Cargando…</p></td></tr>}
                  {!loading && !leads.length && (
                    <tr><td colSpan={COLUMNAS.length} className="ka-empty"><p>Este asesor no tiene contactos que coincidan con el filtro.</p></td></tr>
                  )}
                  {leads.map((lead) => <FilaLead key={lead.id} lead={lead} />)}
                </tbody>
              </table>
            </div>
            <Pager total={data.total} page={page} pageSize={data.pageSize || 20} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
