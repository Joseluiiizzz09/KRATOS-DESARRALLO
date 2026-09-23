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
    backNotes: row.back_notes,
    advisorNote: row.advisor_note,
    status: row.status,
    documentType: row.document_type,
    documentNumber: row.document_number,
    assignedAt: row.assigned_at,
    managementHistory: toHistory(row.management_history),
  };
}

/** Contactos asignados al asesor autenticado. */
router.get('/', requireAuth, async (req, res) => {
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
  res.json({ lead: mapLead(updatedRows[0]) });
});

module.exports = router;
