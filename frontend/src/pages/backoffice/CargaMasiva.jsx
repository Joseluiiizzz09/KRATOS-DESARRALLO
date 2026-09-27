import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';

const TEMPLATE = 'telefono1;telefono2;whatsapp;cliente;zona;campana;observaciones\n+51 900 000 000;;@usuario;Nombre Apellido;Miraflores;Campaña;Observación\n';

export default function CargaMasiva() {
  const { token } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);

  function downloadTemplate() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['﻿' + TEMPLATE], { type: 'text/csv' }));
    link.download = 'plantilla-contactos.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.boImport(token, await file.text());
      setNotice({ type: 'success', text: `${result.imported} contactos importados; ${result.skipped} duplicados omitidos.` });
    } catch (err) {
      setNotice({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="ka-head">
        <div>
          <div className="text-muted small text-uppercase fw-semibold">Distribución y control</div>
          <h1 className="ka-title">Carga Masiva</h1>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2 small d-flex justify-content-between`} role="status">
          <span>{notice.text}</span>
          <button className="btn-close btn-sm" onClick={() => setNotice(null)} aria-label="Cerrar" />
        </div>
      )}

      <div className="ka-card p-4" style={{ maxWidth: 560 }}>
        <p className="text-muted small">
          Importa contactos desde una hoja de cálculo exportada a CSV. Se admiten hasta 500 filas por archivo;
          los teléfonos que ya existen en la base se omiten automáticamente.
        </p>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={downloadTemplate}>↓ Descargar plantilla CSV</button>
          <button className="btn btn-dark btn-sm" disabled={loading} onClick={() => fileInput.current.click()}>
            {loading ? 'Importando…' : 'Importar contactos'}
          </button>
          <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={importFile} />
        </div>
      </div>
    </div>
  );
}
