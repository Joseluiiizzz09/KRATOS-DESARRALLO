const express = require('express');
const crypto = require('crypto');
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function mapSale(row) {
  return {
    id: row.id,
    folio: row.folio,
    advisorId: row.advisor_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    referencePhone: row.reference_phone,
    documentType: row.document_type,
    documentNumber: row.document_number,
    saleType: row.sale_type,
    productName: row.product_name,
    category: row.category,
    amount: Number(row.amount),
    status: row.status,
    notes: row.notes,
    leadId: row.lead_id,
    createdAt: row.created_at,
  };
}

/* Conexión con KRONO: la venta del asesor entra directo a Seguimiento (sin pasar por
   validación ni grabación) en la base KRONO_DB_NAME. */
const KRONO_DB = /^\w+$/.test(process.env.KRONO_DB_NAME || '') ? process.env.KRONO_DB_NAME : null;

async function enviarVentaAKrono(user, v) {
  if (!KRONO_DB) return;
  try {
    const [ku] = await pool.query(
      `SELECT id, nombre, sala FROM \`${KRONO_DB}\`.usuarios WHERE usuario = ? LIMIT 1`, [user.usuario]);
    if (!ku[0]) return;
    let lead = {};
    if (v.leadId) {
      const [l] = await pool.query('SELECT address, coordinates, department, province, zone FROM leads WHERE id = ?', [v.leadId]);
      lead = l[0] || {};
    }
    const leadKrono = String(v.leadId || '').startsWith('krono-') ? Number(String(v.leadId).slice(6)) : null;
    await pool.query(
      `INSERT INTO \`${KRONO_DB}\`.ventas
         (asesor_id, asesor_nombre, tipo_doc, dni, nombre, telefono1, telefono2, departamento, provincia, distrito,
          direccion, coordenadas, paquete, estado, observacion, estado_supgrab, seguimiento_ingresado_at,
          sala_atribucion, lead_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VENTA', ?, 'conforme', NOW(), ?, ?)`,
      [ku[0].id, ku[0].nombre, v.documentType, v.documentNumber, v.clientName, v.clientPhone, v.referencePhone || '',
       lead.department || '', lead.province || '', lead.zone || '', lead.address || '', lead.coordinates || '',
       v.productName, v.notes || '', ku[0].sala || null, leadKrono]
    );
  } catch (e) {
    console.error('No se pudo enviar la venta a KRONO:', e.message);
  }
}

/** Ventas registradas por el asesor autenticado. */
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM sales WHERE advisor_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ sales: rows.map(mapSale) });
});

/** Registra una venta y, si viene de un contacto, lo marca como venta cerrada. */
router.post('/', requireAuth, async (req, res) => {
  const {
    clientName, clientPhone, referencePhone, documentType, documentNumber,
    saleType, productName, category, amount, notes, leadId,
  } = req.body || {};

  const missing = ['clientName', 'clientPhone', 'documentType', 'documentNumber', 'productName', 'saleType']
    .filter((field) => !{ clientName, clientPhone, documentType, documentNumber, productName, saleType }[field]);
  if (missing.length) {
    return res.status(422).json({ error: 'Faltan campos obligatorios.', fields: missing });
  }

  if (leadId) {
    const [existing] = await pool.query('SELECT id FROM sales WHERE lead_id = ? LIMIT 1', [leadId]);
    if (existing.length) return res.status(409).json({ error: 'Este contacto ya tiene una venta registrada.' });
  }

  const id = crypto.randomUUID();
  const folio = 'KRT-' + new Date().getFullYear() + '-' + id.slice(0, 8).toUpperCase();

  await pool.query(
    `INSERT INTO sales
       (id, folio, advisor_id, client_name, client_phone, reference_phone, document_type,
        document_number, sale_type, product_name, category, amount, status, notes, lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_verificacion', ?, ?)`,
    [id, folio, req.user.id, clientName, clientPhone, referencePhone || null, documentType,
     documentNumber, saleType, productName, category || null, Number(amount) || 0, notes || null, leadId || null]
  );

  if (leadId) {
    await pool.query(
      `UPDATE leads SET status = 'venta_cerrada', document_type = ?, document_number = ?
       WHERE id = ? AND assigned_advisor_id = ?`,
      [documentType, documentNumber, leadId, req.user.id]
    );
  }

  await enviarVentaAKrono(req.user, { clientName, clientPhone, referencePhone, documentType, documentNumber, productName, notes, leadId });

  const [rows] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
  res.status(201).json({ sale: mapSale(rows[0]) });
});

module.exports = router;
module.exports.mapSale = mapSale;
