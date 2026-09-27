import { useMemo, useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { STATUSES } from '../../data/catalog';
import SaleModal from '../../components/SaleModal.jsx';
import TipificarModal from '../../components/TipificarModal.jsx';
import { CheckIcon, CopyIcon, FileTextIcon, PhoneIcon, WhatsAppIcon } from '../../components/icons.jsx';
import './asesor.css';

const COLUMNAS = [
  ['telefono', 'Teléfono'],
  ['telefono2', 'Teléfono 2'],
  ['whatsapp', 'Usuario WhatsApp'],
  ['obsBack', 'Obs. Back'],
  ['tipificacion', 'Tipificación'],
  ['estado', 'Estado'],
  ['obsAsesor', 'Observación asesor'],
  ['zona', 'Zona'],
  ['direccion', 'Dirección / Coord.'],
  ['hora', 'Hora asig.'],
];

const ETIQUETA_ESTADO = Object.fromEntries(STATUSES);

/** MySQL entrega "AAAA-MM-DD HH:MM:SS": se muestra solo la hora. */
function horaDe(valor) {
  return typeof valor === 'string' && valor.length >= 16 ? valor.slice(11, 16) : '—';
}

/** Copia con la API moderna y, si el navegador la bloquea (p. ej. sin foco o sin HTTPS), con un textarea temporal. */
async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(area);
    }
  }
}

function fechaDeHoy() {
  return new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BaseLlamadas() {
  const { leads, loading, error, updateLead } = useLeads();
  const { createSale } = useSales();
  const [search, setSearch] = useState('');
  const [saleLead, setSaleLead] = useState(null);
  const [tipLead, setTipLead] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) =>
      [lead.phone, lead.phone2, lead.whatsappUser, lead.zone, lead.address, lead.backNotes]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [leads, search]);

  async function handleTipificar(lead, status) {
    if (status === 'venta_cerrada') {
      setTipLead(null);
      setSaleLead(lead);
      return;
    }
    if (status !== lead.status) await updateLead(lead.id, { status });
    setTipLead(null);
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
        <div className="ka-head-tools">
          {!sinAsignaciones && (
            <input
              className="ka-search"
              placeholder="Filtrar número…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <span className="ka-date">{fechaDeHoy()}</span>
        </div>
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
                    onTipificar={() => setTipLead(lead)}
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

      {tipLead && (
        <TipificarModal
          key={tipLead.id}
          lead={tipLead}
          onClose={() => setTipLead(null)}
          onSave={(status) => handleTipificar(tipLead, status)}
        />
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

/** Teléfono con sus tres acciones: llamar, abrir WhatsApp y copiar el número. */
function TelefonoConAcciones({ numero }) {
  const [copiado, setCopiado] = useState(false);
  if (!numero) return <span className="ka-muted">—</span>;

  const digitos = numero.replace(/\D/g, '');

  async function copiar() {
    if (await copiarAlPortapapeles(numero)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1400);
    }
  }

  return (
    <span className="ka-phone-cell">
      <span className="ka-phone">{numero}</span>
      <a className="ka-ibtn" href={`tel:${digitos}`} title="Llamar" aria-label={`Llamar a ${numero}`}>
        <PhoneIcon />
      </a>
      <a
        className="ka-ibtn ka-ibtn--wa"
        href={`https://wa.me/${digitos}`}
        target="_blank"
        rel="noreferrer"
        title="Abrir WhatsApp"
        aria-label={`Abrir WhatsApp de ${numero}`}
      >
        <WhatsAppIcon />
      </a>
      <button type="button" className="ka-ibtn" onClick={copiar} title="Copiar número" aria-label={`Copiar ${numero}`}>
        {copiado ? <CheckIcon /> : <CopyIcon />}
      </button>
    </span>
  );
}

function FilaLead({ lead, onTipificar, onNoteBlur }) {
  const [note, setNote] = useState(lead.advisorNote || '');

  return (
    <tr>
      <td><TelefonoConAcciones numero={lead.phone} /></td>
      <td><TelefonoConAcciones numero={lead.phone2} /></td>
      <td className="ka-user">{lead.whatsappUser || '—'}</td>
      <td><span className="ka-clamp" title={lead.backNotes || ''}>{lead.backNotes || 'Sin observaciones'}</span></td>
      <td>
        <button type="button" className="ka-tipbtn" onClick={onTipificar} title="Tipificar llamada" aria-label={`Tipificar ${lead.phone}`}>
          <FileTextIcon size={16} />
        </button>
      </td>
      <td>
        <span className={`ka-pill ka-pill--${lead.status}`}>{ETIQUETA_ESTADO[lead.status] || lead.status}</span>
      </td>
      <td>
        <input
          className="ka-note"
          placeholder="Escribe una observación…"
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
