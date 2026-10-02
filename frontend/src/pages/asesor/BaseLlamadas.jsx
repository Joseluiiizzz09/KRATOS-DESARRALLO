import { useMemo, useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useSales } from '../../hooks/useSales';
import { statusColors, statusOptions } from '../../data/catalog';
import SaleModal from '../../components/SaleModal.jsx';
import { CheckIcon, CopyIcon, PhoneIcon, WhatsAppIcon } from '../../components/icons.jsx';
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
  const DOCUMENTOS = { DNI: 8, RUC: 11, CE: 9 }; // tipo de documento: cantidad exacta de digitos
  const [requisito, setRequisito] = useState(null); // { lead, status, tipo: 'dni' | 'coordenadas', valor, error, guardando }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) =>
      [lead.phone, lead.phone2, lead.whatsappUser, lead.zone, lead.address, lead.backNotes]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [leads, search]);

  async function handleStatusChange(lead, status) {
    if (status === 'venta_cerrada') {
      setSaleLead(lead);
      return;
    }
    if (status === 'preventa' || status === 'no_califica') {
      setRequisito({ lead, status, tipo: 'dni', doc: '', valor: '', error: '', guardando: false });
      return;
    }
    if (status === 'sin_cobertura') {
      setRequisito({ lead, status, tipo: 'coordenadas', valor: lead.coordinates || '', error: '', guardando: false });
      return;
    }
    await updateLead(lead.id, { status });
  }

  async function confirmarRequisito() {
    const { lead, status, tipo } = requisito;
    const valor = requisito.valor.trim();
    const largo = DOCUMENTOS[requisito.doc];
    if (tipo === 'dni' && !largo) {
      setRequisito((p) => ({ ...p, error: 'Selecciona el tipo de documento.' }));
      return;
    }
    if (tipo === 'dni' && valor.length !== largo) {
      setRequisito((p) => ({ ...p, error: `El ${requisito.doc} debe tener ${largo} dígitos.` }));
      return;
    }
    if (tipo === 'coordenadas' && !/-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?/.test(valor)) {
      setRequisito((p) => ({ ...p, error: 'Escribe las coordenadas, por ejemplo: -12.0464, -77.0428' }));
      return;
    }
    setRequisito((p) => ({ ...p, guardando: true, error: '' }));
    try {
      if (tipo === 'dni') {
        const nota = (lead.advisorNote || '').replace(/(DNI|RUC|CE)\s*:\s*\d+\s*\|?\s*/i, '').trim();
        await updateLead(lead.id, { status, advisorNote: `${requisito.doc}: ${valor}${nota ? ` | ${nota}` : ''}` });
      } else {
        await updateLead(lead.id, { status, coordinates: valor });
      }
      setRequisito(null);
    } catch (err) {
      setRequisito((p) => ({ ...p, guardando: false, error: err.message }));
    }
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
          <table className={`ka-table ka-table--compact${sinAsignaciones ? ' ka-table--empty' : ''}`}>
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

      {requisito && (
        <div className="va-overlay" onClick={(e) => { if (e.target === e.currentTarget && !requisito.guardando) setRequisito(null); }}>
          <div className="va-modal" style={{ width: 'min(460px,100%)' }} role="dialog" aria-modal="true">
            <header className="va-header">
              <div>
                <h3>{requisito.tipo === 'dni' ? 'Ingresa el documento del cliente' : 'Ingresa las coordenadas'}</h3>
                <p>{requisito.lead.phone} · {statusOptions(requisito.status).find(([v]) => v === requisito.status)?.[1]}</p>
              </div>
              <button type="button" className="va-close" onClick={() => setRequisito(null)} aria-label="Cerrar">×</button>
            </header>
            <div className="va-body">
              {requisito.error && <div className="va-alert error" style={{ marginTop: 0 }}>{requisito.error}</div>}
              {requisito.tipo === 'dni' && (
                <>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>Tipo de documento *</label>
                  <select
                    className="ka-select w-100"
                    style={{ marginTop: 4, marginBottom: 12 }}
                    value={requisito.doc}
                    onChange={(e) => setRequisito((p) => ({ ...p, doc: e.target.value, valor: '', error: '' }))}
                  >
                    <option value="">Seleccionar</option>
                    {Object.keys(DOCUMENTOS).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </>
              )}
              <label style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {requisito.tipo === 'dni' ? `${requisito.doc || 'Número de documento'} *` : 'Coordenadas *'}
              </label>
              <input
                autoFocus
                className="ka-note"
                style={{ width: '100%', height: 38, marginTop: 4 }}
                value={requisito.valor}
                inputMode={requisito.tipo === 'dni' ? 'numeric' : 'text'}
                maxLength={requisito.tipo === 'dni' ? (DOCUMENTOS[requisito.doc] || 11) : 60}
                placeholder={requisito.tipo === 'dni' ? '' : 'Ej. -12.0464, -77.0428'}
                onChange={(e) => setRequisito((p) => ({ ...p, valor: requisito.tipo === 'dni' ? e.target.value.replace(/\D/g, '') : e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmarRequisito(); }}
              />
            </div>
            <footer className="va-footer">
              <button type="button" className="va-button secondary" onClick={() => setRequisito(null)} disabled={requisito.guardando}>Cancelar</button>
              <button type="button" className="va-button primary" onClick={confirmarRequisito} disabled={requisito.guardando}>
                {requisito.guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </footer>
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

function FilaLead({ lead, onStatusChange, onNoteBlur }) {
  const [note, setNote] = useState(lead.advisorNote || '');
  const colores = statusColors(lead.status);

  return (
    <tr>
      <td><TelefonoConAcciones numero={lead.phone} /></td>
      <td><TelefonoConAcciones numero={lead.phone2} /></td>
      <td className="ka-user">{lead.whatsappUser || '—'}</td>
      <td><span className="ka-clamp" title={lead.backNotes || ''}>{lead.backNotes || 'Sin observaciones'}</span></td>
      <td>
        <select
          className="ka-status"
          style={{ backgroundColor: colores.bg, borderColor: colores.border, color: colores.text }}
          value={lead.status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label={`Estado de ${lead.phone}`}
        >
          {statusOptions(lead.status).map(([value, label]) => {
            const color = statusColors(value);
            return <option key={value} value={value} style={{ backgroundColor: color.bg, color: color.text }}>{label}</option>;
          })}
        </select>
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
