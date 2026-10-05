import { useCallback, useEffect, useRef, useState } from 'react'

// Recuadros flotantes de las salas internas de WhatsApp (grupos "SALA 1 BASE", "SALA CHANCAY"...),
// abajo a la derecha en todo Backoffice. Cada sala se abre/minimiza y permite leer y escribir.
// Los datos vienen del servicio de WhatsApp (/wa/api/salas...), autenticado con el mismo token de Krono.

const WA = '/wa/api'
const ABIERTAS_KEY = 'bo_salas_abiertas'
// Mensajes rapidos: un clic y se envian a la sala
const MENSAJES_RAPIDOS = [
  'Tienes leads nuevos, ciérralos',
  'Te puse full leads',
  'Tienes clientes A1',
  'F5'
]

function headers(json = false) {
  const token = sessionStorage.getItem('nc_token') || ''
  return { Authorization: `Bearer ${token}`, ...(json ? { 'Content-Type': 'application/json' } : {}) }
}

function hora(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const hhmm = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString() ? hhmm : `${d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} ${hhmm}`
}

function urlMedia(u) {
  if (!u) return ''
  return u.startsWith('/') ? `/wa${u}` : u
}

function RecuadroSala({ sala, abierta, onAlternar, onCerrar }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const listaRef = useRef(null)
  const pegadoAbajo = useRef(true)
  const ultimoId = useRef('')

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`${WA}/salas/mensajes?chatKey=${encodeURIComponent(sala.chatKey)}&limit=80`, { headers: headers() })
      if (!r.ok) return
      const d = await r.json()
      if (!d?.ok) return
      const lista = Array.isArray(d.mensajes) ? d.mensajes : []
      const ultimo = lista.length ? `${lista[lista.length - 1].id}|${lista.length}` : ''
      if (ultimo !== ultimoId.current) {
        ultimoId.current = ultimo
        setMensajes(lista)
        // Si llego algo nuevo con el recuadro abierto, ya cuenta como leido
        fetch(`${WA}/salas/leer`, { method: 'POST', headers: headers(true), body: JSON.stringify({ chatKey: sala.chatKey }) }).catch(() => {})
      }
    } catch { /* sin conexion con el servicio: se reintenta en el siguiente ciclo */ }
  }, [sala.chatKey])

  useEffect(() => {
    if (!abierta) return
    pegadoAbajo.current = true
    ultimoId.current = ''
    cargar()
    const t = setInterval(cargar, 3000)
    return () => clearInterval(t)
  }, [abierta, cargar])

  // Bajar al ultimo mensaje solo si el usuario ya estaba abajo (no le mueve la lectura)
  useEffect(() => {
    const el = listaRef.current
    if (el && pegadoAbajo.current) el.scrollTop = el.scrollHeight
  }, [mensajes, abierta])

  const [enviadoRapido, setEnviadoRapido] = useState('')
  const enviar = async (rapido) => {
    const limpio = (typeof rapido === 'string' ? rapido : texto).trim()
    if (!limpio || enviando) return
    setEnviando(true)
    setError('')
    try {
      const r = await fetch(`${WA}/salas/enviar`, { method: 'POST', headers: headers(true), body: JSON.stringify({ chatKey: sala.chatKey, text: limpio }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.ok) throw new Error(d.error === 'cuenta-no-conectada' ? `La línea ${sala.linea} no está conectada` : 'No se pudo enviar')
      if (typeof rapido === 'string') {
        setEnviadoRapido(limpio)
        setTimeout(() => setEnviadoRapido(''), 1500)
      } else {
        setTexto('')
      }
      pegadoAbajo.current = true
      setTimeout(cargar, 700)
      setTimeout(cargar, 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const sinLeer = !abierta && sala.count > 0

  return (
    <div style={{
      width: abierta ? 330 : 190, flex: '0 0 auto', background: '#fff', borderRadius: '12px 12px 0 0',
      boxShadow: '0 -2px 18px rgba(15,23,42,.18)', border: '1px solid #e5e7eb', borderBottom: 0,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto',
      transition: 'width .15s ease'
    }}>
      <div onClick={onAlternar} title={abierta ? 'Minimizar' : 'Abrir sala'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer', userSelect: 'none',
          background: sinLeer ? '#e53e3e' : '#111827', color: '#fff'
        }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e', flex: '0 0 auto' }} />
        <strong style={{ fontSize: 12.5, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sala.name}</strong>
        {sinLeer && (
          <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#fff', color: '#e53e3e', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {sala.count > 99 ? '99+' : sala.count}
          </span>
        )}
        <span style={{ fontSize: 14, lineHeight: 1, opacity: .85 }}>{abierta ? '–' : '▴'}</span>
        <button type="button" aria-label="Cerrar sala" title="Quitar de la barra"
          onClick={e => { e.stopPropagation(); onCerrar() }}
          style={{ border: 0, background: 'transparent', color: '#fff', fontSize: 16, lineHeight: 1, cursor: 'pointer', padding: '0 2px', opacity: .85 }}>×</button>
      </div>

      {abierta && (
        <>
          <div ref={listaRef}
            onScroll={e => { const el = e.currentTarget; pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40 }}
            style={{ height: 340, overflowY: 'auto', padding: '10px 10px 4px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mensajes.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Cargando mensajes...</div>}
            {mensajes.map(m => (
              <div key={m.id} style={{ alignSelf: m.fromAgent ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: m.fromAgent ? '#fee2e2' : '#fff', border: '1px solid ' + (m.fromAgent ? '#fecaca' : '#e5e7eb'),
                  borderRadius: 10, padding: '6px 9px', fontSize: 12.5, color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {!m.fromAgent && m.sender && <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>{m.sender}</div>}
                  {m.fromAgent && m.sender && m.sender !== 'Tú' && <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 2 }}>{m.sender}</div>}
                  {m.mediaUrl && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(m.mediaUrl)
                    ? <a href={urlMedia(m.mediaUrl)} target="_blank" rel="noreferrer"><img src={urlMedia(m.mediaUrl)} alt="" style={{ maxWidth: '100%', borderRadius: 6, display: 'block', marginBottom: m.text ? 4 : 0 }} /></a>
                    : m.mediaUrl ? <a href={urlMedia(m.mediaUrl)} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Ver archivo</a> : null}
                  {m.text}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: m.fromAgent ? 'right' : 'left', marginTop: 1 }}>{hora(m.time)}</div>
              </div>
            ))}
          </div>
          {error && <div style={{ fontSize: 11.5, color: '#b91c1c', background: '#fef2f2', padding: '4px 10px' }}>{error}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '7px 8px 0', borderTop: '1px solid #e5e7eb' }}>
            {MENSAJES_RAPIDOS.map(m => (
              <button key={m} type="button" onClick={() => enviar(m)} disabled={enviando} title={`Enviar "${m}" a ${sala.name}`}
                style={{
                  border: '1px solid ' + (enviadoRapido === m ? '#86efac' : '#fecaca'), background: enviadoRapido === m ? '#dcfce7' : '#fff5f5',
                  color: enviadoRapido === m ? '#166534' : '#b91c1c', borderRadius: 14, padding: '4px 9px', fontSize: 11.5, fontWeight: 600,
                  cursor: enviando ? 'default' : 'pointer', fontFamily: 'inherit', opacity: enviando && enviadoRapido !== m ? .6 : 1
                }}>
                {enviadoRapido === m ? '✓ Enviado' : m}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 8 }}>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={1} placeholder={`Escribir en ${sala.name}...`}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              style={{ flex: 1, resize: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 9px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', maxHeight: 90 }} />
            <button type="button" onClick={enviar} disabled={enviando || !texto.trim()}
              style={{ border: 0, borderRadius: 8, background: '#e53e3e', color: '#fff', fontWeight: 600, fontSize: 12.5, padding: '0 12px', cursor: enviando || !texto.trim() ? 'default' : 'pointer', opacity: enviando || !texto.trim() ? .55 : 1, fontFamily: 'inherit' }}>
              {enviando ? '...' : 'Enviar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function SalasFlotantes() {
  const [salas, setSalas] = useState([])
  const [abiertas, setAbiertas] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(ABIERTAS_KEY) || '[]') } catch { return [] }
  })
  const [cerradas, setCerradas] = useState([])

  useEffect(() => {
    let vivo = true
    const consultar = async () => {
      try {
        if (!sessionStorage.getItem('nc_token')) return
        const r = await fetch(`${WA}/salas`, { headers: headers() })
        if (!r.ok) return
        const d = await r.json()
        if (vivo && d?.ok) setSalas(Array.isArray(d.salas) ? d.salas : [])
      } catch { /* el servicio de WhatsApp no responde: no se muestra nada */ }
    }
    consultar()
    const t = setInterval(consultar, 8000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(ABIERTAS_KEY, JSON.stringify(abiertas)) } catch { /* sin almacenamiento */ }
  }, [abiertas])

  const visibles = salas.filter(s => !cerradas.includes(s.chatKey))
  const ocultas = salas.filter(s => cerradas.includes(s.chatKey))
  if (!salas.length) return null

  const alternar = chatKey => setAbiertas(prev => prev.includes(chatKey) ? prev.filter(k => k !== chatKey) : [...prev, chatKey])
  const cerrar = chatKey => {
    setAbiertas(prev => prev.filter(k => k !== chatKey))
    setCerradas(prev => [...prev, chatKey])
  }

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 0, zIndex: 1500, display: 'flex', alignItems: 'flex-end', gap: 8,
      maxWidth: 'calc(100vw - 32px)', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'thin', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {ocultas.length > 0 && (
        <button type="button" onClick={() => setCerradas([])} title="Volver a mostrar las salas quitadas"
          style={{ pointerEvents: 'auto', flex: '0 0 auto', border: '1px solid #e5e7eb', borderBottom: 0, borderRadius: '10px 10px 0 0', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, padding: '8px 10px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 -2px 12px rgba(15,23,42,.12)' }}>
          + {ocultas.length} sala{ocultas.length > 1 ? 's' : ''}
        </button>
      )}
      {visibles.map(s => (
        <RecuadroSala key={s.chatKey} sala={s} abierta={abiertas.includes(s.chatKey)}
          onAlternar={() => alternar(s.chatKey)} onCerrar={() => cerrar(s.chatKey)} />
      ))}
    </div>
  )
}
