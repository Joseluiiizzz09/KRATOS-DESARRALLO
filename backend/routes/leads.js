const express = require('express');
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/** Un contacto sale de "pendiente"/"nuevo" la primera vez que se gestiona. */
function isManaged(status) {
  return status && status !== 'pendiente' && status !== 'nuevo';
}

function toHistory(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value) || []; } catch (e) { return []; }
  }
  return [];
}

function mapLead(row) {
  return {
    id: row.id,
    phone: row.phone,
    phone2: row.phone2,
    whatsappUser: row.whatsapp_user,
    clientName: row.client_name,
    campaign: row.campaign,
    zone: row.zone,
    coordinates: row.coordinates,
    address: row.address,
    tipificacion: row.tipificacion,
    backNotes: row.back_notes,
    advisorNote: row.advisor_note,
    status: row.status,
    documentType: row.document_type,
    documentNumber: row.document_number,
    assignedAt: row.assigned_at,
    managementHistory: toHistory(row.management_history),
  };
}

/* Conexión con KRONO: lo que Back Data asigna en KRONO (base KRONO_DB_NAME) aparece en
   la base de llamadas del asesor, y lo que el asesor gestiona aquí se devuelve a KRONO. */
const KRONO_DB = /^\w+$/.test(process.env.KRONO_DB_NAME || '') ? process.env.KRONO_DB_NAME : null;

async function traerAsignadosDeKrono(user) {
  if (!KRONO_DB) return;
  try {
    const [pendientes] = await pool.query(
      `SELECT l.* FROM \`${KRONO_DB}\`.leads l
       JOIN \`${KRONO_DB}\`.usuarios ku ON ku.id = l.asesor_id
       WHERE ku.usuario = ? AND l.sin_asignar = 0 AND l.n1 IS NOT NULL AND l.n1 <> ''`,
      [user.usuario]
    );
    for (const k of pendientes) {
      const asignado = k.fecha ? `${new Date(k.fecha).toISOString().slice(0, 10)} ${k.hora_asig || '00:00'}:00` : null;
      await pool.query(
        `INSERT IGNORE INTO leads
           (id, phone, phone2, whatsapp_user, campaign, zone, coordinates, address, back_notes, advisor_note,
            status, assigned_advisor_id, assigned_at, management_history, rotations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, COALESCE(?, NOW()), '[]', ?)`,
        [`krono-${k.id}`, k.n1, k.n2, k.usuario_whatsapp, k.campana, k.distrito, k.coordenadas, k.direccion,
         k.obs_back, k.obs_asesor, user.id, asignado, k.rotaciones || 0]
      );
    }
  } catch (e) {
    console.error('No se pudo traer lo asignado desde KRONO:', e.message);
  }
}

async function devolverAKrono(lead, status, advisorNote) {
  if (!KRONO_DB || !String(lead.id).startsWith('krono-')) return;
  try {
    const etiqueta = String(status || '').replace(/_/g, ' ').toUpperCase();
    await pool.query(
      `UPDATE \`${KRONO_DB}\`.leads SET tipif_vend = ?, obs_asesor = ? WHERE id = ?`,
      [status === 'pendiente' ? '' : etiqueta, advisorNote || '', Number(String(lead.id).slice(6))]
    );
  } catch (e) {
    console.error('No se pudo devolver la gestión a KRONO:', e.message);
  }
}

/** Contactos asignados al asesor autenticado. */
router.get('/', requireAuth, async (req, res) => {
  await traerAsignadosDeKrono(req.user);
  const [rows] = await pool.query(
    'SELECT * FROM leads WHERE assigned_advisor_id = ? ORDER BY assigned_at DESC',
    [req.user.id]
  );
  res.json({ leads: rows.map(mapLead) });
});

/** Actualiza estado/observación de un contacto propio del asesor. */
router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    'SELECT * FROM leads WHERE id = ? AND assigned_advisor_id = ? LIMIT 1',
    [id, req.user.id]
  );
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Contacto no encontrado o no asignado a tu usuario.' });

  const { status, advisorNote, coordinates, documentType, documentNumber } = req.body || {};
  const nextStatus = status !== undefined ? status : lead.status;
  const history = toHistory(lead.management_history);
  if (!isManaged(lead.status) && isManaged(nextStatus)) {
    history.push(new Date().toISOString());
  }

  await pool.query(
    `UPDATE leads SET
       status = ?, advisor_note = ?, coordinates = ?, document_type = ?, document_number = ?,
       management_history = ?
     WHERE id = ? AND assigned_advisor_id = ?`,
    [
      nextStatus,
      advisorNote !== undefined ? advisorNote : lead.advisor_note,
      coordinates !== undefined ? coordinates : lead.coordinates,
      documentType !== undefined ? documentType : lead.document_type,
      documentNumber !== undefined ? documentNumber : lead.document_number,
      JSON.stringify(history),
      id,
      req.user.id,
    ]
  );

  const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
  await devolverAKrono(lead, nextStatus, advisorNote !== undefined ? advisorNote : lead.advisor_note);
  res.json({ lead: mapLead(updatedRows[0]) });
});

module.exports = router;
module.exports.mapLead = mapLead;
