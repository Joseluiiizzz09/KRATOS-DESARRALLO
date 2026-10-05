import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API, ncHeaders } from '../services/api'
import { setVisibleInterval, clearVisibleInterval } from '../utils/polling'
import '../styles/whatsapp.css'

const COLORES = ['#16a34a', '#7c3aed', '#2563eb', '#0f172a', '#db2777', '#0891b2', '#ea580c']

function iniciales(texto) {
  const partes = String(texto || '?').trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] || '?') + (partes[1]?.[0] || '')).toUpperCase()
}
function colorDe(texto) {
  let h = 0
  for (const c of String(texto || '')) h = (h * 31 + c.charCodeAt(0)) % 997
  return COLORES[h % COLORES.length]
}
function formatoHora(fecha) {
  if (!fecha) return ''
  const [dia, hora] = String(fecha).split(' ')
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
  if (dia === hoy) return (hora || '').slice(0, 5)
  const [y, m, d] = String(dia).split('-')
  return `${d}/${m}/${y}`
}
function telefonoVisible(c) {
  if (c.telefono) {
    const t = c.telefono.startsWith('51') && c.telefono.length === 11 ? `+51 ${c.telefono.slice(2, 5)} ${c.telefono.slice(5, 8)} ${c.telefono.slice(8)}` : `+${c.telefono}`
    return t
  }
  return c.usuario ? `@${String(c.usuario).replace(/^@/, '')}` : ''
}

const ETIQUETAS = {
  NUEVO: { texto: 'NUEVO', clase: 'wa-tag--nuevo' },
  ATENDIDO: { texto: 'ATENDIDO', clase: 'wa-tag--atendido' },
  BLACKLIST: { texto: 'BLACK LIST', clase: 'wa-tag--black' },
}

function Tarjeta({ c, onAbrir }) {
  const etiqueta = ETIQUETAS[c.estado] || ETIQUETAS.NUEVO
  return (
    <button type="button" className="wa-card" onClick={() => onAbrir(c)}>
      <span className="wa-avatar" style={{ background: colorDe(c.nombre || c.telefono) }}>{iniciales(c.nombre || c.telefono)}</span>
      <span className="wa-card-body">
        <span className="wa-card-top">
          <strong className="wa-card-nombre">{c.nombre || telefonoVisible(c)}</strong>
          <span className="wa-card-hora">{formatoHora(c.ultimo_at)}</span>
        </span>
        <span className="wa-card-tel">{telefonoVisible(c)}</span>
        <span className="wa-card-msg">{c.ultimo_mensaje || ''}</span>
        <span className="wa-card-tags">
          <span className={`wa-tag ${etiqueta.clase}`}>{etiqueta.texto}</span>
          {c.campana && <span className="wa-tag wa-tag--camp"><i />{c.campana}</span>}
          {c.asesor && <span className="wa-tag wa-tag--asesor">Asesor: {c.asesor}</span>}
        </span>
      </span>
      {Number(c.sin_leer) > 0 && <span className="wa-unread">{c.sin_leer > 99 ? '99+' : c.sin_leer}</span>}
    </button>
  )
}

function Columna({ titulo, total, tono, items, vacio, onAbrir }) {
  return (
    <section className="wa-col">
      <header className="wa-col-head">
        <h3>{titulo}</h3>
        <span className={`wa-count wa-count--${tono}`}>{total}</span>
      </header>
      <div className="wa-col-list">
        {items.length === 0 ? <p className="wa-vacio">{vacio}</p> : items.map((c) => <Tarjeta key={c.id} c={c} onAbrir={onAbrir} />)}
      </div>
    </section>
  )
}

function Chat({ conversacion, onCerrar, onCambioEstado, onEnviado }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const finRef = useRef(null)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API}/whatsapp/conversaciones/${conversacion.id}/mensajes`, { headers: ncHeaders() })
      const data = await res.json()
      if (data.ok) setMensajes(data.mensajes)
    } catch { /* se reintenta en el siguiente ciclo */ }
  }, [conversacion.id])

  useEffect(() => {
    cargar()
    const t = setVisibleInterval(cargar, 4000)
    return () => clearVisibleInterval(t)
  }, [cargar])
  useEffect(() => { finRef.current?.scrollIntoView({ block: 'end' }) }, [mensajes.length])

  async function enviar(e) {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    setError('')
    try {
      const res = await fetch(`${API}/whatsapp/conversaciones/${conversacion.id}/mensajes`, {
        method: 'POST', headers: ncHeaders(), body: JSON.stringify({ texto: limpio }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.mensaje || 'No se pudo enviar')
      setTexto('')
      await cargar()
      onEnviado()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <aside className="wa-chat" role="dialog" aria-label="Conversación">
      <header className="wa-chat-head">
        <span className="wa-avatar" style={{ background: colorDe(conversacion.nombre || conversacion.telefono) }}>{iniciales(conversacion.nombre || conversacion.telefono)}</span>
        <div className="wa-chat-id">
          <strong>{conversacion.nombre || telefonoVisible(conversacion)}</strong>
          <small>{telefonoVisible(conversacion)}{conversacion.sala ? ` · ${conversacion.sala}` : ''}</small>
        </div>
        <button type="button" className="wa-x" onClick={onCerrar} aria-label="Cerrar">×</button>
      </header>
      <div className="wa-chat-acciones">
        <button type="button" className="wa-mini" onClick={() => onCambioEstado(conversacion, 'ATENDIDO')}>Marcar atendido</button>
        <button type="button" className="wa-mini wa-mini--black" onClick={() => onCambioEstado(conversacion, 'BLACKLIST')}>Black list</button>
        <button type="button" className="wa-mini" onClick={() => onCambioEstado(conversacion, 'NUEVO')}>Volver a nuevo</button>
      </div>
      <div className="wa-chat-msgs">
        {mensajes.length === 0 && <p className="wa-vacio">Aún no hay mensajes en esta conversación.</p>}
        {mensajes.map((m) => (
          <div key={m.id} className={`wa-burbuja wa-burbuja--${m.direccion === 'SALIENTE' ? 'out' : 'in'}`}>
            <span>{m.texto}</span>
            <small>
              {formatoHora(m.created_at)}
              {m.direccion === 'SALIENTE' && m.estado_envio === 'PENDIENTE_ENVIO' ? ' · pendiente de envío' : ''}
            </small>
          </div>
        ))}
        <div ref={finRef} />
      </div>
      <form className="wa-chat-form" onSubmit={enviar}>
        {error && <div className="wa-error">{error}</div>}
        <div className="wa-chat-fila">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje…" maxLength={4000} />
          <button type="submit" className="wa-enviar" disabled={enviando || !texto.trim()}>Enviar</button>
        </div>
      </form>
    </aside>
  )
}

export default function WhatsappBandeja() {
  const [datos, setDatos] = useState({ atendidos: [], nuevos: [], blacklist: [], totalAtendidos: 0, sinResponder: 0 })
  const [busqueda, setBusqueda] = useState('')
  const [abierta, setAbierta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const qs = busqueda.trim() ? `?q=${encodeURIComponent(busqueda.trim())}` : ''
      const res = await fetch(`${API}/whatsapp/conversaciones${qs}`, { headers: ncHeaders() })
      const data = await res.json()
      if (!data.ok) throw new Error(data.mensaje || 'No se pudo cargar la bandeja')
      setDatos(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [busqueda])

  useEffect(() => {
    cargar()
    const t = setVisibleInterval(cargar, 5000)
    return () => clearVisibleInterval(t)
  }, [cargar])

  async function cambiarEstado(conv, estado) {
    await fetch(`${API}/whatsapp/conversaciones/${conv.id}`, {
      method: 'PATCH', headers: ncHeaders(), body: JSON.stringify({ estado }),
    })
    setAbierta((a) => (a && a.id === conv.id ? { ...a, estado } : a))
    cargar()
  }

  // Una barra por sala con conversaciones, como en la parte de abajo de la bandeja.
  const salas = useMemo(() => {
    const mapa = new Map()
    ;[...datos.nuevos, ...datos.atendidos, ...datos.blacklist].forEach((c) => {
      if (!c.sala) return
      mapa.set(c.sala, (mapa.get(c.sala) || 0) + Number(c.sin_leer || 0))
    })
    return [...mapa.entries()]
  }, [datos])

  return (
    <div className="wa-root">
      <div className="wa-toolbar">
        <button type="button" className="wa-bandeja-btn" onClick={() => { setBusqueda(''); setAbierta(null) }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 13h4l1.5 2.5h5L16 13h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>
          Bandeja de conversaciones
        </button>
        <label className="wa-buscar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, número o @usuario" />
        </label>
        <div className="wa-toolbar-der">
          <span className="wa-sin-responder">Sin responder <b>{datos.sinResponder}</b></span>
          <button type="button" className="wa-bell" aria-label="Notificaciones">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>
          </button>
        </div>
      </div>

      {error && <div className="wa-error wa-error--page">{error}</div>}

      <div className="wa-cols">
        <Columna titulo="Atendidos" total={datos.totalAtendidos} tono="naranja" items={datos.atendidos}
          vacio={cargando ? 'Cargando…' : 'Aún no hay conversaciones atendidas.'} onAbrir={setAbierta} />
        <Columna titulo="Nuevos / Sin responder" total={datos.nuevos.length} tono="rojo" items={datos.nuevos}
          vacio={cargando ? 'Cargando…' : 'No hay conversaciones nuevas. Cuando se vincule WhatsApp, los mensajes entrantes aparecerán aquí.'} onAbrir={setAbierta} />
        <Columna titulo="Black List" total={datos.blacklist.length} tono="gris" items={datos.blacklist}
          vacio={cargando ? 'Cargando…' : 'La Black List está vacía.'} onAbrir={setAbierta} />
      </div>

      {salas.length > 0 && (
        <div className="wa-dock">
          {salas.map(([sala, sinLeer]) => (
            <div key={sala} className="wa-dock-sala">
              <i />
              <span>{sala}</span>
              {sinLeer > 0 && <b>{sinLeer > 99 ? '99+' : sinLeer}</b>}
            </div>
          ))}
        </div>
      )}

      {abierta && (
        <Chat key={abierta.id} conversacion={abierta} onCerrar={() => setAbierta(null)}
          onCambioEstado={cambiarEstado} onEnviado={cargar} />
      )}
    </div>
  )
}
