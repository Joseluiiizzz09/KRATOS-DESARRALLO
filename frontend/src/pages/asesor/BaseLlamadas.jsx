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

  return (
    <tr>
      <td className="ka-phone">{lead.phone}</td>
      <td className="ka-muted">{lead.phone2 || '—'}</td>
      <td className="ka-user">{lead.whatsappUser || '—'}</td>
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
