import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { toggleRotacion } from './bo.jsx';

/** Panel de «Rotación inteligente»: en KRONO no es una página aparte, sino un panel dentro de «Base». */
export default function RotacionPanel() {
  const { token } = useAuth();
  const [advisors, setAdvisors] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState([]);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.boAdvisors(token).then((r) => setAdvisors(r.advisors)).catch(() => {}); }, [token]);

  function toggleTo(id) {
    setTo((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function submit(event) {
    event.preventDefault();
    if (!to.length) { setNotice({ type: 'danger', text: 'Elige al menos un asesor de destino.' }); return; }
    setSaving(true);
    try {
      const result = await api.boRotate(token, from || null, to);
      setNotice({ type: 'success', text: `${result.moved} de ${result.evaluated} contactos pendientes se repartieron entre los asesores elegidos.` });
    } catch (err) {
      setNotice({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ka-card mb-3">
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <div className="ka-title" style={{ fontSize: 16 }}>Rotación inteligente</div>
          <p className="text-muted small mb-0">Reparte por turnos los contactos aún sin gestionar (estado «Pendiente») de un origen entre los asesores que elijas.</p>
        </div>
        <button type="button" className="btn-close" onClick={() => toggleRotacion(false)} aria-label="Cerrar" />
      </div>
      <form onSubmit={submit} className="p-3">
        {notice && (
          <div className={`alert alert-${notice.type} py-2 small d-flex justify-content-between`} role="status">
            <span>{notice.text}</span>
            <button type="button" className="btn-close btn-sm" onClick={() => setNotice(null)} aria-label="Cerrar" />
          </div>
        )}
        <div className="row g-3 align-items-start">
          <div className="col-md-4">
            <label className="small fw-semibold text-muted d-block mb-1">Origen</label>
            <select className="form-select form-select-sm" value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">Todos los asignados</option>
              <option value="none">Sin asignar</option>
              {advisors.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="col-md-5">
            <div className="small fw-semibold text-muted mb-1">Repartir entre</div>
            <div className="d-flex flex-wrap gap-3">
              {advisors.map((a) => (
                <label className="d-flex align-items-center gap-2 small" key={a.id}>
                  <input type="checkbox" checked={to.includes(a.id)} onChange={() => toggleTo(a.id)} />
                  {a.nombre}
                </label>
              ))}
            </div>
          </div>
          <div className="col-md-3 d-flex align-items-end h-100">
            <button className="btn btn-dark btn-sm w-100" disabled={saving}>{saving ? 'Rotando…' : 'Rotar contactos'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
