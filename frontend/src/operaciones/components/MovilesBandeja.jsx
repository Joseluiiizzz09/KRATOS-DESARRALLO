import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API, ncHeaders } from '../services/api'
import { setVisibleInterval, clearVisibleInterval } from '../utils/polling'
import '../styles/moviles.css'

/* Bandeja de la cuenta MÓVILES (CRM de WhatsApp) con la lógica y el aspecto de la bandeja de KRONO:
   - Nuevos / Sin responder: chats que nadie atendió todavía (nuevos, contactados e interesados).
   - Atendidos: chats ya respondidos por el equipo.
   - Black List: contactos que no desean información.
   Responder un chat lo pasa a Atendidos; desde el chat también se puede mandar a Black List
   o devolverlo a Nuevos. */

const COLORES = ['#16a34a', '#7c3aed', '#2563eb', '#0f172a', '#db2777', '#0891b2', '#ea580c', '#9f1239']
const ETIQUETA = {
  nuevo: { texto: 'NUEVO', clase: 'nuevo' },
  contactado: { texto: 'NUEVO', clase: 'nuevo' },
  interesado: { texto: 'INTERESADO', clase: 'interesado' },
  atendido: { texto: 'ATENDIDO', clase: 'atendido' },
  descartado: { texto: 'BLACK LIST', clase: 'black' },
}

const limpio = (t) => String(t || '').replace(/[^\p{L}\p{N} ]/gu, '').trim()
const iniciales = (t) => {
  const p = limpio(t).split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] || '?') + (p[1]?.[0] || '')).toUpperCase()
}
const colorDe = (t) => {
  let h = 0
  for (const c of String(t || '')) h = (h * 31 + c.charCodeAt(0)) % 997
  return COLORES[h % COLORES.length]
}
function telefonoVisible(l) {
  const t = String(l.telefono || '').replace(/\D/g, '')
  if (!t) return l.username ? `@${String(l.username).replace(/^@/, '')}` : ''
  return t.startsWith('51') && t.length === 11 ? `+51 ${t.slice(2, 5)} ${t.slice(5, 8)} ${t.slice(8)}` : `+${t}`
}
const nombreDe = (l) => (limpio(l.nombre) ? l.nombre : telefonoVisible(l) || 'Sin nombre')
function hora(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const f = (o) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', ...o }).format(d)
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d)
  return dia === hoy ? f({ hour: '2-digit', minute: '2-digit', hour12: false }) : f({ day: '2-digit', month: '2-digit', year: 'numeric' })
}
function campana(l) {
  const c = String(l.campana || '').trim()
  if (/mov\s*-?\s*2/i.test(c)) return 'MOV 2'
  if (/mov/i.test(c) || !c) return 'MOV 1'
  return c.toUpperCase()
}
const actividad = (l) => new Date(l.ultimo_mensaje_ts || l.fecha_ultima_actividad || 0).getTime() || 0

async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${API}/moviles${ruta}`, { headers: ncHeaders(), ...opciones })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

function Tarjeta({ l, onAbrir }) {
  const et = ETIQUETA[l.estado] || ETIQUETA.nuevo
  const nombre = nombreDe(l)
  const mensaje = l.ultimo_mensaje || (l.ultimo_mensaje_tipo ? `(${l.ultimo_mensaje_tipo})` : '')
  return (
    <button type="button" className="mv-card" onClick={() => onAbrir(l)}>
      <span className="mv-avatar" style={{ background: colorDe(nombre) }}>{iniciales(nombre)}</span>
      <span className="mv-card-body">
        <span className="mv-card-top">
          <span className="mv-card-nombre"><small>PE</small> {nombre}</span>
          <span className="mv-card-hora">{hora(l.ultimo_mensaje_ts || l.fecha_ultima_actividad)}</span>
        </span>
        {limpio(l.nombre) && telefonoVisible(l) && <span className="mv-card-tel">{telefonoVisible(l)}</span>}
        {mensaje && <span className="mv-card-msg">{l.ultimo_mensaje_dir === 'saliente' ? 'Tú: ' : ''}{mensaje}</span>}
        <span className="mv-card-tags">
          <span className={`mv-tag mv-tag--${et.clase}`}>{et.texto}</span>
          <span className="mv-tag mv-tag--camp"><i />{campana(l)}</span>
        </span>
      </span>
      {Number(l.no_leidos) > 0 && <span className="mv-unread">{l.no_leidos > 99 ? '99+' : l.no_leidos}</span>}
    </button>
  )
}

function Columna({ titulo, total, tono, items, vacio, onAbrir }) {
  return (
    <section className="mv-col">
      <header className="mv-col-head">
        <h3>{titulo}</h3>
        <span className={`mv-count mv-count--${tono}`}>{Number(total || 0).toLocaleString('es-PE')}</span>
      </header>
      <div className="mv-col-list">
        {items.length === 0 ? <p className="mv-vacio">{vacio}</p> : items.map((l) => <Tarjeta key={l.id} l={l} onAbrir={onAbrir} />)}
      </div>
    </section>
  )
}

function Chat({ lead, onCerrar, onCambio }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const fin = useRef(null)
  const nombre = nombreDe(lead)

  const cargar = useCallback(async () => {
    const { data } = await pedir(`/leads/${lead.id}/mensajes`)
    if (data.ok) setMensajes(data.mensajes)
    else if (data.mensaje) setError(data.mensaje)
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
    if (res.ok && data.ok && lead.estado !== 'atendido') {
      await pedir(`/leads/${lead.id}/marcar-atendido`, { method: 'PATCH', body: '{}' })
    }
    setEnviando(false)
    if (!res.ok || !data.ok) { setError(data.mensaje || 'No se pudo enviar el mensaje'); return }
    setTexto('')
    cargar(); onCambio()
  }
  async function mover(estado) {
    if (estado === 'atendido') await pedir(`/leads/${lead.id}/marcar-atendido`, { method: 'PATCH', body: '{}' })
    else await pedir(`/leads/${lead.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
    onCambio(); onCerrar()
  }

  return (
    <aside className="mv-chat" role="dialog" aria-label={`Conversación con ${nombre}`}>
      <header className="mv-chat-head">
        <span className="mv-avatar" style={{ background: colorDe(nombre) }}>{iniciales(nombre)}</span>
        <div className="mv-chat-id">
          <strong>{nombre}</strong>
          <small>{telefonoVisible(lead)} · {campana(lead)}</small>
        </div>
        <button type="button" className="mv-x" onClick={onCerrar} aria-label="Cerrar">×</button>
      </header>
      <div className="mv-chat-acciones">
        {lead.estado !== 'atendido' && <button type="button" className="mv-mini" onClick={() => mover('atendido')}>Marcar atendido</button>}
        {!['nuevo', 'contactado'].includes(lead.estado) && <button type="button" className="mv-mini" onClick={() => mover('nuevo')}>Volver a nuevos</button>}
        {lead.estado !== 'descartado' && <button type="button" className="mv-mini mv-mini--black" onClick={() => mover('descartado')}>Black list</button>}
      </div>
      <div className="mv-chat-msgs">
        {mensajes.length === 0 && <p className="mv-vacio">Sin mensajes.</p>}
        {mensajes.map((m) => (
          <div key={m.id} className={`mv-burbuja mv-burbuja--${m.direccion === 'saliente' ? 'out' : 'in'}`}>
            <span>{m.contenido || (m.tipo ? `(${m.tipo})` : '')}</span>
            <small>{hora(m.timestamp)}{m.estado_envio === 'fallido' ? ' · no se envió' : ''}</small>
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
  const [estado, setEstado] = useState(null)
  const [datos, setDatos] = useState({ resumen: {}, columnas: { nuevos: [], interesados: [], descartados: [], atendidos: [] } })
  const [busqueda, setBusqueda] = useState('')
  const [antiguedad, setAntiguedad] = useState('14')
  const [abierto, setAbierto] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const colsRef = useRef(null)

  // Las columnas llegan exactamente hasta el borde inferior de la ventana (se mide su posición real).
  useEffect(() => {
    const ajustar = () => {
      const el = colsRef.current
      if (!el) return
      if (window.innerWidth <= 1100) { el.style.height = ''; return }
      const arriba = el.getBoundingClientRect().top
      el.style.height = Math.max(420, window.innerHeight - arriba - 16) + 'px'
    }
    ajustar()
    const t = setTimeout(ajustar, 200)
    window.addEventListener('resize', ajustar)
    return () => { clearTimeout(t); window.removeEventListener('resize', ajustar) }
  }, [estado, error])

  const cargar = useCallback(async () => {
    try {
      const { res, data } = await pedir(`/bandeja?antiguedad=${antiguedad}${busqueda.trim() ? `&q=${encodeURIComponent(busqueda.trim())}` : ''}`)
      if (data.configurado === false) { setEstado({ configurado: false }); setError(''); return }
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'No se pudo cargar la bandeja')
      setEstado({ configurado: true })
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
  const c = datos.columnas || {}
  const nuevos = useMemo(
    () => [...(c.nuevos || []), ...(c.interesados || [])].sort((a, b) => actividad(b) - actividad(a)),
    [c.nuevos, c.interesados],
  )
  const sinResponder = Number(r.nuevos || 0) + Number(r.interesados || 0)

  if (estado && estado.configurado === false) {
    return (
      <div className="mv-root">
        <div className="mv-aviso">
          <h3>MÓVILES todavía no está conectado</h3>
          <p>Falta configurar en el servidor el usuario del CRM de WhatsApp (<code>deploy/conectar-moviles.sh</code>).</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mv-root">
      <div className="mv-toolbar">
        <button type="button" className="mv-bandeja-btn" onClick={() => { setBusqueda(''); setAbierto(null); cargar() }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" /><path d="M4 13h4l1.5 2.5h5L16 13h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>
          Bandeja de conversaciones
        </button>
        <label className="mv-buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, número o @usuario" />
        </label>
        <select className="mv-select" value={antiguedad} onChange={(e) => setAntiguedad(e.target.value)} aria-label="Periodo">
          <option value="7">Últimos 7 días</option>
          <option value="14">Últimos 14 días</option>
          <option value="todos">Todos</option>
        </select>
        <div className="mv-toolbar-der">
          <span className="mv-sin-responder">Sin responder <b>{sinResponder.toLocaleString('es-PE')}</b></span>
          <span className="mv-bell" title="Mensajes sin leer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
            {Number(r.no_leidos_total) > 0 && <i>{r.no_leidos_total > 99 ? '99+' : r.no_leidos_total}</i>}
          </span>
        </div>
      </div>

      {error && <div className="mv-error mv-error--page">{error}</div>}

      <div className="mv-cols" ref={colsRef}>
        <Columna titulo="Atendidos" total={r.atendidos} tono="naranja" items={c.atendidos || []}
          vacio={cargando ? 'Cargando…' : 'Sin contactos atendidos'} onAbrir={setAbierto} />
        <Columna titulo="Nuevos / Sin responder" total={sinResponder} tono="rojo" items={nuevos}
          vacio={cargando ? 'Cargando…' : 'Sin contactos pendientes'} onAbrir={setAbierto} />
        <Columna titulo="Black List / No desea" total={r.descartados} tono="gris" items={c.descartados || []}
          vacio={cargando ? 'Cargando…' : 'Sin contactos en la Black List'} onAbrir={setAbierto} />
      </div>

      {abierto && <Chat key={abierto.id} lead={abierto} onCerrar={() => setAbierto(null)} onCambio={cargar} />}
    </div>
  )
}
