import { useMemo, useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { STATUSES } from '../../data/catalog';
import SaleModal from '../../components/SaleModal.jsx';
import './asesor.css';

const COLUMNAS = [
  ['telefono', 'Teléfono'],
  ['telefono2', 'Teléfono 2'],
  ['whatsapp', 'Usuario WhatsApp'],
  ['obsBack', 'Obs. Back'],
  ['estado', 'Estado'],
  ['obsAsesor', 'Observación asesor'],
  ['zona', 'Zona'],
  ['direccion', 'Dirección / Coord.'],
  ['hora', 'Hora asig.'],
];

/** MySQL entrega "AAAA-MM-DD HH:MM:SS": se muestra solo la hora. */
function horaDe(valor) {
  return typeof valor === 'string' && valor.length >= 16 ? valor.slice(11, 16) : '—';
}

function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.7 8.6c.2-.5.6-.5.9-.4.2.5.6 1.3.6 1.5 0 .3-.4.7-.6 1 .6 1.1 1.4 1.9 2.6 2.5.3-.3.6-.8.9-.8.3 0 1.2.5 1.5.7.1.3-.1 1-.6 1.3-.7.4-1.7.3-3-.4a7.6 7.6 0 0 1-3-3c-.4-1-.3-1.7.7-2.4z" />
    </svg>
  );
}

export default function BaseLlamadas() {
  const { leads, loading, error, updateLead } = useLeads();
  const { createSale } = useSales();
  const [search, setSearch] = useState('');
  const [saleLead, setSaleLead] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) =>
      [lead.phone, lead.phone2, lead.whatsappUser, lead.zone, lead.address, lead.backNotes]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [leads, search]);

  async function handleStatusChange(lead, nextStatus) {
    if (nextStatus === 'venta_cerrada') {
      setSaleLead(lead);
      return;
    }
    await updateLead(lead.id, { status: nextStatus });
  }

  async function handleNoteBlur(lead, value) {
    if (value === (lead.advisorNote || '')) return;
    await updateLead(lead.id, { advisorNote: value });
  }

  async function handleCreateSale(payload) {
    await createSale(payload);
    setSaleLead(null);
  }

  if (loading) return <p>Cargando contactos…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const sinAsignaciones = leads.length === 0;

  return (
    <div>
      <div className="ka-head">
        <h1 className="ka-title">Base de llamadas</h1>
        {!sinAsignaciones && (
          <input
            className="ka-search"
            placeholder="Filtrar número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>

      <div className="ka-card">
        <div className="ka-scroll">
          <table className={`ka-table${sinAsignaciones ? ' ka-table--empty' : ''}`}>
            <thead>
              <tr>
                {COLUMNAS.map(([clave, etiqueta]) => <th key={clave}>{etiqueta}</th>)}
              </tr>
            </thead>
            <tbody>
              {sinAsignaciones ? (
                <tr>
                  <td className="ka-empty" colSpan={COLUMNAS.length}>
                    <p>Esperando asignación de Back Data…</p>
                    <small>Back Data asignará registros a tu usuario.</small>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="ka-empty" colSpan={COLUMNAS.length}>
                    <p>No se encontraron contactos con ese filtro.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <FilaLead
                    key={lead.id}
                    lead={lead}
                    onStatusChange={(status) => handleStatusChange(lead, status)}
                    onNoteBlur={(value) => handleNoteBlur(lead, value)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {!sinAsignaciones && (
          <div className="ka-foot">
            Mostrando {filtered.length} de {leads.length} contactos asignados
          </div>
        )}
      </div>

      <SaleModal
        key={saleLead?.id || 'none'}
        show={Boolean(saleLead)}
        onClose={() => setSaleLead(null)}
        onSubmit={handleCreateSale}
        prefill={saleLead ? { clientPhone: saleLead.phone, leadId: saleLead.id } : {}}
      />
    </div>
  );
}

function FilaLead({ lead, onStatusChange, onNoteBlur }) {
  const [note, setNote] = useState(lead.advisorNote || '');
  const whatsapp = lead.whatsappUser ? lead.whatsappUser.replace(/\D/g, '') : '';

  return (
    <tr>
      <td className="ka-phone">{lead.phone}</td>
      <td className="ka-muted">{lead.phone2 || '—'}</td>
      <td>
        {whatsapp ? (
          <a className="ka-wa" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            <span className="ka-wa-icon"><IconoWhatsApp /></span>
            {lead.whatsappUser}
          </a>
        ) : '—'}
      </td>
      <td><span className="ka-clamp" title={lead.backNotes || ''}>{lead.backNotes || 'Sin observaciones'}</span></td>
      <td>
        <select
          className={`ka-status ka-status--${lead.status}`}
          value={lead.status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label={`Estado de ${lead.phone}`}
        >
          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </td>
      <td>
        <input
          className="ka-note"
          placeholder="Escribe una observación"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={(e) => onNoteBlur(e.target.value)}
        />
      </td>
      <td>{lead.zone || '—'}</td>
      <td><span className="ka-clamp">{lead.address || lead.coordinates || '—'}</span></td>
      <td className="ka-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{horaDe(lead.assignedAt)}</td>
    </tr>
  );
}
