import { useEffect, useRef, useState } from 'react'
import { API, ncHeaders } from '../services/api'

/* Envía una plantilla aprobada de la cuenta MÓVILES a los números pegados, con la campaña de KRATOS.
   Cuando el cliente responde, KRATOS lo pasa a Atendidos y lo carga a la Base con esa campaña. */
async function pedir(ruta, opciones = {}) {
  const res = await fetch(`${API}/moviles${ruta}`, { headers: ncHeaders(), ...opciones })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

export default function MovilesEnviarPlantilla({ onCerrar, onEnviado }) {
  const [plantillas, setPlantillas] = useState([])
  const [campanas, setCampanas] = useState([])
  const [plantilla, setPlantilla] = useState('')
  const [campana, setCampana] = useState('')
  const [numeros, setNumeros] = useState('')
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
    return () => clearInterval(timer.current)
  }, [])

  const cuerpo = (extra = {}) => JSON.stringify({ plantilla, campana, numeros, ...extra })
  const listo = plantilla && campana && numeros.trim()

  async function revisar() {
    if (!listo) { setError('Elige plantilla, campaña y pega los números.'); return }
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

  const elegida = plantillas.find((p) => p.nombre_meta === plantilla)

  return (
    <div className="mv-modal-fondo" onClick={(e) => { if (e.target === e.currentTarget && !ocupado) onCerrar() }}>
      <div className="mv-modal" role="dialog" aria-label="Enviar plantilla">
        <header className="mv-modal-head">
          <div>
            <h3>Enviar plantilla</h3>
            <p>Plantillas aprobadas de MÓVILES. Quien responda pasa a Atendidos y se carga a la Base con la campaña elegida.</p>
          </div>
          <button type="button" className="mv-x" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar">×</button>
        </header>

        <div className="mv-modal-body">
          {error && <div className="mv-error">{error}</div>}

          <label className="mv-label">Plantilla *</label>
          {cargando ? <p className="mv-vacio">Cargando plantillas…</p> : (
            <div className="mv-plantillas">
              {plantillas.map((p) => (
                <button key={p.nombre_meta} type="button" disabled={Boolean(job)}
                  className={`mv-plantilla${plantilla === p.nombre_meta ? ' activa' : ''}`}
                  onClick={() => { setPlantilla(p.nombre_meta); setRevision(null) }}>
                  {p.imagen && <img src={p.imagen} alt="" />}
                  <span>
                    <strong>{p.nombre}</strong>
                    <small>{p.tipo === 'IMAGE' ? 'Con imagen' : 'Texto'}{p.variables.length ? ` · usa ${p.variables.join(', ')}` : ''}</small>
                    <em>{p.texto}</em>
                  </span>
                </button>
              ))}
              {plantillas.length === 0 && <p className="mv-vacio">No hay plantillas aprobadas.</p>}
            </div>
          )}

          <div className="mv-modal-fila">
            <div>
              <label className="mv-label">Campaña en KRATOS *</label>
              <select className="mv-select" value={campana} disabled={Boolean(job)} onChange={(e) => { setCampana(e.target.value); setRevision(null) }}>
                <option value="">Seleccionar</option>
                {campanas.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <label className="mv-label">Números (uno por línea o separados por coma) *</label>
          <textarea className="mv-textarea" rows={6} value={numeros} disabled={Boolean(job)}
            onChange={(e) => { setNumeros(e.target.value); setRevision(null) }} placeholder={'987654321\n976543210'} />

          {elegida?.variables?.length > 0 && (
            <p className="mv-nota">Esta plantilla usa variables ({elegida.variables.join(', ')}); el CRM las completa con los datos del contacto.</p>
          )}
          {revision && <p className="mv-nota mv-nota--ok">{revision.validos} de {revision.total} números se pueden enviar.</p>}
          {job && (
            <div className="mv-progreso">
              <div><span style={{ width: `${job.total ? Math.round((job.procesados / job.total) * 100) : 0}%` }} /></div>
              <small>
                {job.estado === 'procesando' ? 'Enviando' : job.estado === 'completado' ? 'Envío terminado' : `Estado: ${job.estado}`}
                {' · '}{job.procesados} de {job.total}{job.errores ? ` · ${job.errores} con error` : ''}
              </small>
            </div>
          )}
        </div>

        <footer className="mv-modal-pie">
          {!job && <button type="button" className="mv-mini" onClick={revisar} disabled={ocupado || !listo}>Revisar números</button>}
          {!job && <button type="button" className="mv-enviar" onClick={enviar} disabled={ocupado || !revision || !revision.validos}>Enviar a {revision?.validos || 0}</button>}
          {job && job.estado !== 'procesando' && <button type="button" className="mv-enviar" onClick={onCerrar}>Listo</button>}
        </footer>
      </div>
    </div>
  )
}
