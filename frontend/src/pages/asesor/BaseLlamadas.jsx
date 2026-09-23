import { useMemo, useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { STATUSES } from '../../data/catalog';
import SaleModal from '../../components/SaleModal.jsx';

export default function BaseLlamadas() {
  const { leads, loading, error, updateLead } = useLeads();
  const { createSale } = useSales();
  const [search, setSearch] = useState('');
  const [saleLead, setSaleLead] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) =>
      [lead.phone, lead.phone2, lead.whatsappUser, lead.zone, lead.backNotes]
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Base de llamadas</h1>
        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Filtrar número"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {leads.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          Esperando asignación de Back Data…
          <div className="small mt-2">Back Data asignará registros a tu usuario.</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Teléfono</th>
                  <th>Teléfono 2</th>
                  <th>WhatsApp</th>
                  <th>Obs. Back</th>
                  <th>Estado</th>
                  <th>Observación asesor</th>
                  <th>Zona</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <FilaLead
                    key={lead.id}
                    lead={lead}
                    onStatusChange={(status) => handleStatusChange(lead, status)}
                    onNoteBlur={(value) => handleNoteBlur(lead, value)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer text-muted small">
            Mostrando {filtered.length} de {leads.length} contactos asignados
          </div>
        </div>
      )}

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
      <td className="fw-semibold">{lead.phone}</td>
      <td className="text-muted">{lead.phone2 || '—'}</td>
      <td>
        {lead.whatsappUser && (
          <a href={`https://wa.me/${lead.whatsappUser.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-success">
            {lead.whatsappUser}
          </a>
        )}
      </td>
      <td style={{ maxWidth: 220 }} className="text-truncate">{lead.backNotes || 'Sin observaciones'}</td>
      <td>
        <select className="form-select form-select-sm" value={lead.status} onChange={(e) => onStatusChange(e.target.value)}>
          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </td>
      <td>
        <input
          className="form-control form-control-sm"
          placeholder="Escribe una observación"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={(e) => onNoteBlur(e.target.value)}
        />
      </td>
      <td className="text-muted">{lead.zone || '—'}</td>
    </tr>
  );
}
