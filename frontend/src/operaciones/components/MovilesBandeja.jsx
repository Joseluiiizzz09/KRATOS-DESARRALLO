import { useCallback, useEffect, useRef, useState } from 'react'
import { API, ncHeaders } from '../services/api'
import { setVisibleInterval, clearVisibleInterval } from '../utils/polling'
import '../styles/moviles.css'

const COLORES = ['#16a34a', '#7c3aed', '#2563eb', '#0f172a', '#db2777', '#0891b2', '#ea580c', '#9f1239']
const COLUMNAS = [
  { id: 'nuevos', titulo: 'Nuevos / Sin responder', tono: 'rojo' },
  { id: 'interesados', titulo: 'Desean información', tono: 'verde' },
  { id: 'descartados', titulo: 'No desean información', tono: 'gris' },
  { id: 'atendidos', titulo: 'Seguimiento / Atendido', tono: 'naranja' },
]
const ETIQUETA_ESTADO = {
  nuevo: 'NUEVO', contactado: 'CONTACTADO', interesado: 'INTERESADO', descartado: 'DESCARTADO', atendido: 'ATENDIDO',
}

const iniciales = (t) => {
  const p = String(t || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] || '?') + (p[1]?.[0] || '')).toUpperCase()
}
const colorDe = (t) => {
  let h = 0
  for (const c of String(t || '')) h = (h * 31 + c.charCodeAt(0)) % 997
  return COLORES[h % COLORES.length]
}
const nombreDe = (l) => l.nombre || (l.telefono ? `+${l.telefono}` : l.username ? `@${l.username}` : 'Sin nombre')
function telefonoVisible(l) {
  const t = String(l.telefono || '').replace(/\D/g, '')
  if (!t) return l.username ? `@${l.username}` : ''
  return t.startsWith('51') && t.length === 11 ? `+51 ${t.slice(2, 5)} ${t.slice(5, 8)} ${t.slice(8)}` : `+${t}`
}
function hora(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d)
  return dia === hoy
    ? new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
    : new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'numeric' }).format(d)
}
const campanaVisible = (l) => (/mov\s*-?\s*2/i.test(String(l.campana || '')) ? 'MOV 2' : /mov/i.test(String(l.campana || '')) ? 'MOV 1' : (l.campana || ''))

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${API}/moviles${ruta}`, { headers: ncHeaders(), ...opciones })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

function Tarjeta({ l, onAbrir }) {
  const camp = campanaVisible(l)
  return (
    <button type="button" className="mv-card" onClick={() => onAbrir(l)}>
      <span className="mv-avatar" style={{ background: colorDe(nombreDe(l)) }}>{iniciales(nombreDe(l))}</span>
      <span className="mv-card-body">
        <span className="mv-card-top">
          <strong>{nombreDe(l)}</strong>
          <span className="mv-card-hora">{hora(l.ultimo_mensaje_ts || l.fecha_ultima_actividad)}</span>
        </span>
        {l.telefono && l.nombre && <span className="mv-card-tel">{telefonoVisible(l)}</span>}
        <span className="mv-card-msg">{l.ultimo_mensaje || ''}</span>
        <span className="mv-card-tags">
          <span className={`mv-tag mv-tag--${l.estado}`}>{ETIQUETA_ESTADO[l.estado] || String(l.estado || '').toUpperCase()}</span>
          {camp && <span className="mv-tag mv-tag--camp">{camp}</span>}
        </span>
      </span>
      {Number(l.no_leidos) > 0 && <span className="mv-unread">{l.no_leidos > 99 ? '99+' : l.no_leidos}</span>}
    </button>
  )
}

function Chat({ lead, onCerrar, onCambio }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const fin = useRef(null)

  const cargar = useCallback(async () => {
    const { data } = await pedir(`/leads/${lead.id}/mensajes`)
    if (data.ok) setMensajes(data.mensajes)
  }, [lead.id])

  useEffect(() => {
    cargar()
    const t = setVisibleInterval(cargar, 4000)
    return () => clearVisibleInterval(t)
  }, [cargar])
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [mensajes.length])

  async function enviar(e) {
    e.preventDefault()
    const m = texto.trim()
    if (!m || enviando) return
    setEnviando(true); setError('')
    const { res, data } = await pedir(`/leads/${lead.id}/responder`, { method: 'POST', body: JSON.stringify({ mensaje: m }) })
    setEnviando(false)
    if (!res.ok || !data.ok) { setError(data.mensaje || 'No se pudo enviar el mensaje'); return }
    setTexto('')
    cargar(); onCambio()
  }
  async function marcar(ruta, cuerpo) {
    await pedir(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo || {}) })
    onCambio(); onCerrar()
  }

  return (
    <aside className="mv-chat" role="dialog" aria-label="Conversación">
      <header className="mv-chat-head">
        <span className="mv-avatar" style={{ background: colorDe(nombreDe(lead)) }}>{iniciales(nombreDe(lead))}</span>
        <div className="mv-chat-id">
          <strong>{nombreDe(lead)}</strong>
          <small>{telefonoVisible(lead)}{campanaVisible(lead) ? ` · ${campanaVisible(lead)}` : ''}</small>
        </div>
        <button type="button" className="mv-x" onClick={onCerrar} aria-label="Cerrar">×</button>
      </header>
      <div className="mv-chat-acciones">
        <button type="button" className="mv-mini" onClick={() => marcar(`/leads/${lead.id}/marcar-atendido`)}>Marcar atendido</button>
        <button type="button" className="mv-mini" onClick={() => marcar(`/leads/${lead.id}/estado`, { estado: 'interesado' })}>Desea información</button>
        <button type="button" className="mv-mini mv-mini--gris" onClick={() => marcar(`/leads/${lead.id}/estado`, { estado: 'descartado' })}>No desea</button>
      </div>
      <div className="mv-chat-msgs">
        {mensajes.length === 0 && <p className="mv-vacio">Sin mensajes.</p>}
        {mensajes.map((m) => (
          <div key={m.id} className={`mv-burbuja mv-burbuja--${m.direccion === 'saliente' ? 'out' : 'in'}`}>
            <span>{m.contenido || (m.tipo ? `(${m.tipo})` : '')}</span>
            <small>{hora(m.timestamp)}{m.estado_envio === 'fallido' ? ' · falló' : ''}</small>
          </div>
        ))}
        <div ref={fin} />
      </div>
      <form className="mv-chat-form" onSubmit={enviar}>
        {error && <div className="mv-error">{error}</div>}
        <div className="mv-chat-fila">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje…" maxLength={4000} />
          <button type="submit" className="mv-enviar" disabled={enviando || !texto.trim()}>Enviar</button>
        </div>
      </form>
    </aside>
  )
}

export default function MovilesBandeja() {
  const [estado, setEstado] = useState(null) // { configurado, conectado, mensaje }
  const [datos, setDatos] = useState({ resumen: {}, columnas: { nuevos: [], interesados: [], descartados: [], atendidos: [] } })
  const [busqueda, setBusqueda] = useState('')
  const [antiguedad, setAntiguedad] = useState('14')
  const [abierto, setAbierto] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const { res, data } = await pedir(`/bandeja?antiguedad=${antiguedad}${busqueda.trim() ? `&q=${encodeURIComponent(busqueda.trim())}` : ''}`)
      if (data.configurado === false) { setEstado({ configurado: false }); setError(''); return }
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'No se pudo cargar la bandeja')
      setEstado({ configurado: true, conectado: true })
      setDatos(data); setError('')
    } catch (e) {
      setError(e.message)
    } finally { setCargando(false) }
  }, [antiguedad, busqueda])

  useEffect(() => {
    cargar()
    const t = setVisibleInterval(cargar, 6000)
    return () => clearVisibleInterval(t)
  }, [cargar])

  const r = datos.resumen || {}

  if (estado && estado.configurado === false) {
    return (
      <div className="mv-root">
        <div className="mv-aviso">
          <h3>MÓVILES todavía no está conectado</h3>
          <p>Para ver aquí la bandeja de la cuenta MÓVILES hay que configurar en el servidor la conexión con el CRM de WhatsApp
            (<code>MOVILES_CRM_URL</code>, <code>MOVILES_CRM_USER</code> y <code>MOVILES_CRM_PASSWORD</code> en <code>backend/.env</code>).
            Cuando esté, las conversaciones aparecen solas y quienes queden interesados pasan a la Base de KRATOS como MOV 1 o MOV 2.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mv-root">
      <div className="mv-toolbar">
        <label className="mv-buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar contacto, teléfono o @usuario" />
        </label>
        <select className="mv-select" value={antiguedad} onChange={(e) => setAntiguedad(e.target.value)}>
          <option value="7">Últimos 7 días</option>
          <option value="14">Últimos 14 días</option>
          <option value="todos">Todos</option>
        </select>
        <span className="mv-cuenta">MÓVILES</span>
      </div>

      {error && <div className="mv-error mv-error--page">{error}</div>}

      <div className="mv-stats">
        <div><small>Total</small><b>{Number(r.total || 0).toLocaleString('es-PE')}</b></div>
        <div><small>Sin responder</small><b>{Number(r.nuevos || 0).toLocaleString('es-PE')}</b></div>
        <div><small>Interesados</small><b>{Number(r.interesados || 0).toLocaleString('es-PE')}</b></div>
        <div><small>Atendidos</small><b>{Number(r.atendidos || 0).toLocaleString('es-PE')}</b></div>
      </div>

      <div className="mv-cols">
        {COLUMNAS.map((col) => (
          <section key={col.id} className={`mv-col mv-col--${col.tono}`}>
            <header className="mv-col-head">
              <h3>{col.titulo}</h3>
              <span className="mv-count">{Number(r[col.id] || 0).toLocaleString('es-PE')}</span>
            </header>
            <div className="mv-col-list">
              {(datos.columnas[col.id] || []).length === 0
                ? <p className="mv-vacio">{cargando ? 'Cargando…' : 'Sin contactos.'}</p>
                : datos.columnas[col.id].map((l) => <Tarjeta key={l.id} l={l} onAbrir={setAbierto} />)}
            </div>
          </section>
        ))}
      </div>

      {abierto && <Chat key={abierto.id} lead={abierto} onCerrar={() => setAbierto(null)} onCambio={cargar} />}
    </div>
  )
}
