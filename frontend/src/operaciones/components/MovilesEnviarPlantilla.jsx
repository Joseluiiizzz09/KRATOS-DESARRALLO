import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { API, ncHeaders } from '../services/api'

/* Envía una plantilla aprobada de la cuenta MÓVILES a los números pegados, con la campaña de KRATOS.
   Cuando el cliente responde, KRATOS lo pasa a Atendidos y lo carga a la Base con esa campaña. */
async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${API}/moviles${ruta}`, { headers: ncHeaders(), ...opciones })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

const contarNumeros = (texto) => String(texto || '').split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean).length

export default function MovilesEnviarPlantilla({ onCerrar, onEnviado }) {
  const [plantillas, setPlantillas] = useState([])
  const [campanas, setCampanas] = useState([])
  const [plantilla, setPlantilla] = useState('')
  const [campana, setCampana] = useState('')
  const [numeros, setNumeros] = useState('')
  const [buscar, setBuscar] = useState('')
  const [revision, setRevision] = useState(null)
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const timer = useRef(null)

  useEffect(() => {
    pedir('/plantillas').then(({ data }) => {
      if (data.ok) { setPlantillas(data.plantillas); setCampanas(data.campanas || []) }
      else setError(data.mensaje || 'No se pudieron cargar las plantillas')
      setCargando(false)
    })
    const esc = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', esc)
    return () => { clearInterval(timer.current); window.removeEventListener('keydown', esc) }
  }, [onCerrar])

  const elegida = plantillas.find((p) => p.nombre_meta === plantilla)
  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return q ? plantillas.filter((p) => `${p.nombre} ${p.texto}`.toLowerCase().includes(q)) : plantillas
  }, [plantillas, buscar])
  const cantidad = contarNumeros(numeros)
  const listo = plantilla && campana && cantidad > 0
  const cuerpo = (extra = {}) => JSON.stringify({ plantilla, campana, numeros, ...extra })
  const cambiar = (fn) => (v) => { fn(v); setRevision(null); setError('') }

  async function revisar() {
    if (!listo) { setError('Elige la plantilla, la campaña y pega los números.'); return }
    setOcupado(true); setError(''); setRevision(null)
    const { res, data } = await pedir('/enviar', { method: 'POST', body: cuerpo({ solo_revisar: true }) })
    setOcupado(false)
    if (!res.ok || !data.ok) { setError(data.mensaje || 'No se pudo revisar la lista'); return }
    setRevision(data)
  }

  async function enviar() {
    setOcupado(true); setError('')
    const { res, data } = await pedir('/enviar', { method: 'POST', body: cuerpo() })
    if (!res.ok || !data.ok) { setOcupado(false); setError(data.mensaje || 'No se pudo enviar'); return }
    setJob({ total: data.total, procesados: 0, errores: 0, estado: 'procesando' })
    timer.current = setInterval(async () => {
      const { data: j } = await pedir(`/envios/${data.job_id}`)
      if (!j.ok) return
      setJob(j)
      if (j.estado !== 'procesando') { clearInterval(timer.current); setOcupado(false); onEnviado() }
    }, 2000)
  }

  const bloqueado = Boolean(job)
  const pct = job?.total ? Math.round((job.procesados / job.total) * 100) : 0

  return createPortal(
    <div className="mvp-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget && !ocupado) onCerrar() }}>
      <div className="mvp" role="dialog" aria-modal="true" aria-labelledby="mvp-titulo">
        <header className="mvp-head">
          <div>
            <span className="mvp-kicker">WhatsApp MÓVILES</span>
            <h3 id="mvp-titulo">Enviar plantilla</h3>
            <p>Quien responda pasa a Atendidos y se carga a la Base con la campaña que elijas.</p>
          </div>
          <button type="button" className="mvp-x" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar">×</button>
        </header>

        <div className="mvp-body">
          {/* 1. Plantillas */}
          <section className="mvp-lista">
            <div className="mvp-paso"><b>1</b> Elige la plantilla</div>
            <input className="mvp-input" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar plantilla…" />
            <div className="mvp-plantillas">
              {cargando && <p className="mvp-vacio">Cargando plantillas aprobadas…</p>}
              {!cargando && filtradas.length === 0 && <p className="mvp-vacio">No hay plantillas.</p>}
              {filtradas.map((p) => (
                <button key={p.nombre_meta} type="button" disabled={bloqueado}
                  className={`mvp-item${plantilla === p.nombre_meta ? ' activa' : ''}`}
                  onClick={() => cambiar(setPlantilla)(p.nombre_meta)}>
                  {p.imagen ? <img src={p.imagen} alt="" /> : <span className="mvp-item-icono">T</span>}
                  <span className="mvp-item-txt">
                    <strong>{p.nombre}</strong>
                    <small>{p.tipo === 'IMAGE' ? 'Con imagen' : 'Texto'}{p.variables.length ? ` · usa ${p.variables.join(', ')}` : ''}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Vista previa, campaña y números */}
          <section className="mvp-detalle">
            <div className="mvp-paso"><b>2</b> Revisa el mensaje</div>
            <div className="mvp-preview">
              {elegida ? (
                <div className="mvp-burbuja">
                  {elegida.imagen && <img src={elegida.imagen} alt="" />}
                  <p>{elegida.texto}</p>
                </div>
              ) : <p className="mvp-vacio">Elige una plantilla para ver el mensaje.</p>}
            </div>
            {elegida?.variables?.length > 0 && (
              <p className="mvp-nota">Usa variables ({elegida.variables.join(', ')}): se completan con los datos del contacto.</p>
            )}

            <div className="mvp-paso"><b>3</b> Campaña y números</div>
            <div className="mvp-fila">
              <label className="mvp-campo">
                <span>Campaña en KRATOS *</span>
                <select className="mvp-input" value={campana} disabled={bloqueado} onChange={(e) => cambiar(setCampana)(e.target.value)}>
                  <option value="">Seleccionar</option>
                  {campanas.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <div className="mvp-contador"><b>{cantidad}</b><small>números</small></div>
            </div>
            <label className="mvp-campo">
              <span>Números * (uno por línea o separados por coma)</span>
              <textarea className="mvp-input mvp-textarea" rows={5} value={numeros} disabled={bloqueado}
                onChange={(e) => cambiar(setNumeros)(e.target.value)} placeholder={'987654321\n976543210'} />
            </label>

            {error && <div className="mvp-alerta mvp-alerta--error">{error}</div>}
            {revision && !job && (
              <div className={`mvp-alerta${revision.validos ? ' mvp-alerta--ok' : ' mvp-alerta--error'}`}>
                {revision.validos} de {revision.total} números se pueden enviar.
                {revision.validos < revision.total && ' Los demás ya tienen chat abierto o no son válidos.'}
              </div>
            )}
            {job && (
              <div className="mvp-progreso">
                <div><span style={{ width: `${pct}%` }} /></div>
                <small>
                  {job.estado === 'procesando' ? 'Enviando…' : job.estado === 'completado' ? 'Envío terminado' : `Estado: ${job.estado}`}
                  {' · '}{job.procesados} de {job.total}{job.errores ? ` · ${job.errores} con error` : ''}
                </small>
              </div>
            )}
          </section>
        </div>

        <footer className="mvp-pie">
          {!job && <button type="button" className="mvp-btn" onClick={onCerrar} disabled={ocupado}>Cancelar</button>}
          {!job && !revision && <button type="button" className="mvp-btn mvp-btn--oscuro" onClick={revisar} disabled={ocupado || !listo}>{ocupado ? 'Revisando…' : 'Revisar números'}</button>}
          {!job && revision && <button type="button" className="mvp-btn mvp-btn--rojo" onClick={enviar} disabled={ocupado || !revision.validos}>{ocupado ? 'Enviando…' : `Enviar a ${revision.validos}`}</button>}
          {job && job.estado !== 'procesando' && <button type="button" className="mvp-btn mvp-btn--oscuro" onClick={onCerrar}>Listo</button>}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
