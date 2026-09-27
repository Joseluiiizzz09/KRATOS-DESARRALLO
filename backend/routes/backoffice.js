const express = require('express');
const crypto = require('crypto');
const { pool } = require('../database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('backoffice', 'admin'));

const PAGE_SIZE = 20;
const BACK = ['BUZON DE VOZ', 'NO CONTESTA', 'CORTA LLAMADA', 'DERIVADO', 'LLAMANDO', 'SIN COBERTURA'];
const TRACKING = {
  en_ejecucion: 'En ejecución', instalado: 'Instalado', caida: 'Caída', rechazo_campo: 'Rechazo en campo',
  tecnico_casa: 'Técnicos en casa', levantar_sot: 'Levantar SOT', tecnicos_camino: 'Técnicos en camino',
  instalado_no_validado: 'Instalado no validado', reasignacion: 'Reasignación',
  derivado_planta_externa: 'Derivado a planta externa', servicio_activo: 'Servicio activo',
  rechazo: 'Rechazo', rechazo_mesa: 'Rechazo en mesa',
};
const REASONS = ['FRAUDE', 'EXCESO DE ACOMETIDA', 'INFRAESTRUCTURA', 'RED SATURADA', 'EDIFICIO NO LIBERADO', 'SERVICIO ACTIVO', 'RECHAZO POR AUDIO', 'MALA OFERTA', 'NO DESEA', 'FALTA DE CONTACTO', 'SOT CON ERRORES DE SISTEMA', 'FACILIDADES TECNICAS DEL CLIENTE', 'MAL INGRESO DIRECCION'];
const RESULTS = ['Contactado — conforme', 'Contactado — con problema', 'No contesta', 'Buzón de voz', 'Número equivocado', 'Solicita rellamada', 'Se levantó', 'Masivo enviado', 'Derivado a grabar', 'Derivado a agilizar', 'En agenda'];
const SLOTS = ['AM', 'PM', 'PM 3'];
const NEGATIVE = ['caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa'];
const PROTECTED = ['venta_cerrada', 'instalado', 'instalado_no_validado', 'no_tocar', 'no_rotar', 'terna'];

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value) || []; } catch (e) { return []; }
  }
  return [];
}

const entry = (actor, text) => ({ at: new Date().toISOString(), actor, text });
const clip = (value, max) => (value === undefined || value === null ? '' : String(value).slice(0, max));

function mapLead(row) {
  return {
    id: row.id,
    phone: row.phone,
    phone2: row.phone2 || '',
    whatsappUser: row.whatsapp_user || '',
    clientName: row.client_name || '',
    campaign: row.campaign || '',
    zone: row.zone || '',
    department: row.department || '',
    province: row.province || '',
    address: row.address || '',
    coordinates: row.coordinates || '',
    back1: row.tipificacion || '',
    back2: row.back2 || '',
    backNotes: row.back_notes || '',
    advisorNote: row.advisor_note || '',
    status: row.status,
    advisorId: row.assigned_advisor_id,
    advisor: row.advisor_nombre || '',
    assignedAt: row.assigned_at,
    rotations: row.rotations || 0,
    createdAt: row.created_at,
    history: toArray(row.bo_history),
  };
}

function mapSale(row) {
  return {
    id: row.id,
    folio: row.folio,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    documentType: row.document_type || '',
    documentNumber: row.document_number || '',
    productName: row.product_name,
    advisor: row.advisor_nombre || '',
    zone: row.zone || '',
    coordinates: row.coordinates || '',
    trackingStatus: row.tracking_status || 'en_ejecucion',
    reason: row.reason || '',
    comment: row.comment || '',
    sot: row.sot || '',
    scheduledDate: row.scheduled_date || '',
    slot: row.slot || '',
    createdAt: row.created_at,
    history: toArray(row.tracking_history),
  };
}

/** Un valor que empieza por = + @ - se neutraliza para que Excel no lo ejecute como fórmula. */
function csvCell(value) {
  const text = String(value === undefined || value === null ? '' : value);
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function sendCsv(res, name, fields, rows) {
  const lines = [fields.join(';')].concat(rows.map((row) => fields.map((f) => csvCell(row[f])).join(';')));
  res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
  res.setHeader('Content-Disposition', 'attachment; filename="' + name + '"');
  res.send('﻿' + lines.join('\r\n'));
}

function parseCsv(text) {
  const clean = text.replace(/^﻿/, '');
  const first = clean.split(/\r?\n/, 1)[0] || '';
  const delimiter = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

/* ───────── Asesores ───────── */
router.get('/advisors', async (req, res) => {
  const [rows] = await pool.query("SELECT id, nombre, usuario FROM usuarios WHERE rol = 'asesor' AND activo = 1 ORDER BY nombre");
  res.json({ advisors: rows });
});

/* ───────── Contactos (Back Office) ───────── */
const LEAD_SELECT = 'SELECT l.*, u.nombre AS advisor_nombre FROM leads l LEFT JOIN usuarios u ON u.id = l.assigned_advisor_id';

function leadFilters(query) {
  const where = [];
  const params = [];
  if (query.q) {
    const like = '%' + query.q + '%';
    where.push('(l.phone LIKE ? OR l.phone2 LIKE ? OR l.whatsapp_user LIKE ? OR l.client_name LIKE ? OR l.zone LIKE ? OR l.campaign LIKE ?)');
    params.push(like, like, like, like, like, like);
  }
  if (query.advisorId === 'none') where.push('l.assigned_advisor_id IS NULL');
  else if (query.advisorId) { where.push('l.assigned_advisor_id = ?'); params.push(Number(query.advisorId)); }
  if (query.status) { where.push('l.status = ?'); params.push(query.status); }
  if (query.from) { where.push('DATE(l.created_at) >= ?'); params.push(query.from); }
  if (query.to) { where.push('DATE(l.created_at) <= ?'); params.push(query.to); }
  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

router.get('/leads', async (req, res) => {
  const { clause, params } = leadFilters(req.query);
  const page = Math.max(1, Number(req.query.page) || 1);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM leads l ' + clause, params);
  const [rows] = await pool.query(
    LEAD_SELECT + ' ' + clause + ' ORDER BY l.created_at DESC, l.id LIMIT ? OFFSET ?',
    params.concat([PAGE_SIZE, (page - 1) * PAGE_SIZE])
  );
  const [[stats]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(assigned_advisor_id IS NULL) AS unassigned,
            SUM(assigned_advisor_id IS NOT NULL) AS assigned,
            SUM(status IN ('venta_cerrada','instalado')) AS closed
     FROM leads`
  );
  const [statuses] = await pool.query('SELECT DISTINCT status FROM leads ORDER BY status');
  res.json({
    leads: rows.map(mapLead),
    total,
    page,
    pageSize: PAGE_SIZE,
    stats: {
      total: stats.total,
      unassigned: Number(stats.unassigned || 0),
      assigned: Number(stats.assigned || 0),
      closed: Number(stats.closed || 0),
    },
    statuses: statuses.map((s) => s.status),
    backOptions: BACK,
  });
});

function readLeadInput(body) {
  const errors = [];
  const phone = clip(body.phone, 30).trim();
  if (!phone || !/^[+\d\s()-]{3,30}$/.test(phone)) errors.push('Ingresa un teléfono válido.');
  const back1 = clip(body.back1, 40);
  const back2 = clip(body.back2, 40);
  if ((back1 && !BACK.includes(back1)) || (back2 && !BACK.includes(back2))) errors.push('Tipificación de Back Office no válida.');
  return {
    errors,
    values: {
      phone,
      phone2: clip(body.phone2, 30),
      whatsapp_user: clip(body.whatsappUser, 60),
      client_name: clip(body.clientName, 150),
      campaign: clip(body.campaign, 120),
      zone: clip(body.zone, 150),
      department: clip(body.department, 80),
      province: clip(body.province, 80),
      address: clip(body.address, 250),
      coordinates: clip(body.coordinates, 60),
      back_notes: clip(body.backNotes, 2000),
      tipificacion: back1 || null,
      back2: back2 || null,
    },
  };
}

router.post('/leads', async (req, res) => {
  const { errors, values } = readLeadInput(req.body || {});
  if (errors.length) return res.status(422).json({ error: errors.join(' ') });
  const id = crypto.randomUUID();
  const cols = Object.keys(values);
  await pool.query(
    'INSERT INTO leads (id, ' + cols.join(', ') + ", status, management_history, bo_history) VALUES (?, " +
      cols.map(() => '?').join(', ') + ", 'pendiente', '[]', ?)",
    [id].concat(cols.map((c) => values[c]), [JSON.stringify([entry(req.user.nombre, 'Contacto creado en Back Office')])])
  );
  const [rows] = await pool.query(LEAD_SELECT + ' WHERE l.id = ?', [id]);
  res.status(201).json({ lead: mapLead(rows[0]) });
});

router.put('/leads/:id', async (req, res) => {
  const [existing] = await pool.query('SELECT bo_history FROM leads WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Contacto no encontrado.' });
  const { errors, values } = readLeadInput(req.body || {});
  if (errors.length) return res.status(422).json({ error: errors.join(' ') });
  const history = toArray(existing[0].bo_history);
  history.push(entry(req.user.nombre, 'Datos de Back Office actualizados'));
  const cols = Object.keys(values);
  await pool.query(
    'UPDATE leads SET ' + cols.map((c) => c + ' = ?').join(', ') + ', bo_history = ? WHERE id = ?',
    cols.map((c) => values[c]).concat([JSON.stringify(history), req.params.id])
  );
  const [rows] = await pool.query(LEAD_SELECT + ' WHERE l.id = ?', [req.params.id]);
  res.json({ lead: mapLead(rows[0]) });
});

/** Asigna o rota contactos. advisorId vacío = liberar. Los cierres protegidos no se rotan. */
router.post('/leads/assign', async (req, res) => {
  const { ids, advisorId } = req.body || {};
  if (!Array.isArray(ids) || !ids.length || ids.length > 500) {
    return res.status(422).json({ error: 'Selecciona entre 1 y 500 contactos.' });
  }
  let advisor = null;
  if (advisorId) {
    const [rows] = await pool.query("SELECT id, nombre FROM usuarios WHERE id = ? AND rol = 'asesor' AND activo = 1", [advisorId]);
    if (!rows.length) return res.status(422).json({ error: 'El asesor indicado no existe.' });
    advisor = rows[0];
  }
  const [leads] = await pool.query(
    'SELECT l.*, u.nombre AS advisor_nombre FROM leads l LEFT JOIN usuarios u ON u.id = l.assigned_advisor_id WHERE l.id IN (?)',
    [ids]
  );
  if (leads.length !== ids.length) return res.status(404).json({ error: 'Algún contacto ya no existe.' });
  const targetId = advisor ? advisor.id : null;
  const blocked = leads.filter((l) => (l.assigned_advisor_id || null) !== targetId && PROTECTED.includes(l.status));
  if (blocked.length) return res.status(422).json({ error: 'Este contacto tiene un cierre protegido y no se puede rotar.' });

  for (const lead of leads) {
    if ((lead.assigned_advisor_id || null) === targetId) continue;
    const history = toArray(lead.bo_history);
    history.push(entry(req.user.nombre, 'Asignación: ' + (lead.advisor_nombre || 'Sin asignar') + ' → ' + (advisor ? advisor.nombre : 'Sin asignar')));
    const rotated = lead.assigned_advisor_id && advisor ? 1 : 0;
    await pool.query(
      'UPDATE leads SET assigned_advisor_id = ?, assigned_at = ' + (advisor ? 'NOW()' : 'NULL') +
        ", status = 'pendiente', rotations = rotations + ?, bo_history = ?, management_history = '[]' WHERE id = ?",
      [targetId, rotated, JSON.stringify(history), lead.id]
    );
  }
  res.json({ ok: true });
});

router.post('/leads/import', async (req, res) => {
  const rows = parseCsv(String((req.body || {}).csv || ''));
  if (!rows.length) return res.status(422).json({ error: 'El archivo está vacío.' });
  const header = rows[0].map((h) => h.trim().toLowerCase());
  if (!header.includes('telefono1')) return res.status(422).json({ error: 'Falta la columna telefono1. Descarga la plantilla.' });
  const data = rows.slice(1);
  if (data.length > 500) return res.status(422).json({ error: 'Importa como máximo 500 contactos por archivo.' });

  const [existing] = await pool.query('SELECT phone FROM leads');
  const known = new Set(existing.map((r) => r.phone.replace(/\D/g, '')));
  let imported = 0;
  let skipped = 0;
  for (let i = 0; i < data.length; i += 1) {
    const get = (name) => (data[i][header.indexOf(name)] || '').trim();
    const phone = get('telefono1');
    if (!phone || !/^[+\d\s()-]{3,30}$/.test(phone)) {
      return res.status(422).json({ error: 'Teléfono inválido en la fila ' + (i + 2) + '.' });
    }
    const digits = phone.replace(/\D/g, '');
    if (known.has(digits)) { skipped += 1; continue; }
    known.add(digits);
    await pool.query(
      `INSERT INTO leads (id, phone, phone2, whatsapp_user, client_name, zone, campaign, back_notes, status, management_history, bo_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', '[]', ?)`,
      [
        crypto.randomUUID(), phone, clip(get('telefono2'), 30), clip(get('whatsapp'), 60), clip(get('cliente'), 150),
        clip(get('zona'), 150), clip(get('campana'), 120), clip(get('observaciones'), 2000),
        JSON.stringify([entry(req.user.nombre, 'Contacto creado en Back Office')]),
      ]
    );
    imported += 1;
  }
  res.json({ imported, skipped });
});

router.get('/leads/export', async (req, res) => {
  const { clause, params } = leadFilters(req.query);
  const [rows] = await pool.query(LEAD_SELECT + ' ' + clause + ' ORDER BY l.created_at DESC', params);
  sendCsv(res, 'kratos-backoffice.csv', ['phone', 'phone2', 'whatsappUser', 'clientName', 'zone', 'campaign', 'advisor', 'status', 'backNotes'], rows.map(mapLead));
});

router.get('/campaigns', async (req, res) => {
  const [rows] = await pool.query("SELECT DISTINCT campaign FROM leads WHERE campaign IS NOT NULL AND campaign <> '' ORDER BY campaign");
  res.json({ campaigns: rows.map((r) => r.campaign) });
});

/** Rotación inteligente: reparte por turnos los contactos sin gestionar de un origen entre los asesores elegidos. */
router.post('/leads/rotate', async (req, res) => {
  const { fromAdvisorId, toAdvisorIds } = req.body || {};
  if (!Array.isArray(toAdvisorIds) || !toAdvisorIds.length) return res.status(422).json({ error: 'Elige al menos un asesor de destino.' });
  const [targets] = await pool.query("SELECT id, nombre FROM usuarios WHERE id IN (?) AND rol = 'asesor' AND activo = 1", [toAdvisorIds]);
  if (targets.length !== toAdvisorIds.length) return res.status(422).json({ error: 'Algún asesor de destino no existe.' });

  const where = ["l.status = 'pendiente'"];
  const params = [];
  if (fromAdvisorId === 'none') where.push('l.assigned_advisor_id IS NULL');
  else if (fromAdvisorId) { where.push('l.assigned_advisor_id = ?'); params.push(Number(fromAdvisorId)); }
  else where.push('l.assigned_advisor_id IS NOT NULL');
  const [leads] = await pool.query(
    'SELECT l.*, u.nombre AS advisor_nombre FROM leads l LEFT JOIN usuarios u ON u.id = l.assigned_advisor_id WHERE ' + where.join(' AND ') + ' ORDER BY l.created_at LIMIT 500',
    params
  );
  let moved = 0;
  for (const lead of leads) {
    const target = targets[moved % targets.length];
    if (lead.assigned_advisor_id === target.id) continue;
    const history = toArray(lead.bo_history);
    history.push(entry(req.user.nombre, 'Rotación inteligente: ' + (lead.advisor_nombre || 'Sin asignar') + ' → ' + target.nombre));
    await pool.query(
      "UPDATE leads SET assigned_advisor_id = ?, assigned_at = NOW(), rotations = rotations + ?, bo_history = ?, management_history = '[]' WHERE id = ?",
      [target.id, lead.assigned_advisor_id ? 1 : 0, JSON.stringify(history), lead.id]
    );
    moved += 1;
  }
  res.json({ moved, evaluated: leads.length });
});

/* ───────── Reportes ───────── */
router.get('/reports/advisors', async (req, res) => {
  const [advisors] = await pool.query("SELECT id, nombre FROM usuarios WHERE rol = 'asesor' AND activo = 1 ORDER BY nombre");
  const [leadRows] = await pool.query(
    "SELECT assigned_advisor_id AS id, COUNT(*) AS asignados, SUM(status <> 'pendiente') AS gestionados FROM leads WHERE assigned_advisor_id IS NOT NULL GROUP BY assigned_advisor_id"
  );
  const [saleRows] = await pool.query(
    "SELECT advisor_id AS id, COUNT(*) AS ventas, SUM(tracking_status = 'instalado') AS instaladas, SUM(tracking_status IN ('caida','rechazo','rechazo_campo','rechazo_mesa')) AS caidas FROM sales GROUP BY advisor_id"
  );
  const leadBy = Object.fromEntries(leadRows.map((r) => [r.id, r]));
  const saleBy = Object.fromEntries(saleRows.map((r) => [r.id, r]));
  res.json({
    advisors: advisors.map((a) => {
      const l = leadBy[a.id] || {};
      const s = saleBy[a.id] || {};
      const asignados = Number(l.asignados || 0);
      const gestionados = Number(l.gestionados || 0);
      return {
        id: a.id,
        nombre: a.nombre,
        asignados,
        gestionados,
        avance: asignados ? Math.round((gestionados / asignados) * 100) : 0,
        ventas: Number(s.ventas || 0),
        instaladas: Number(s.instaladas || 0),
        caidas: Number(s.caidas || 0),
      };
    }),
  });
});

router.get('/reports/performance', async (req, res) => {
  const days = Math.min(60, Math.max(7, Number(req.query.days) || 14));
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const series = [];
  const index = {};
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    index[key] = series.length;
    series.push({ day: key, asignados: 0, gestionados: 0, ventas: 0 });
  }
  const [leads] = await pool.query('SELECT assigned_at, management_history FROM leads WHERE assigned_at IS NOT NULL OR management_history IS NOT NULL');
  leads.forEach((lead) => {
    const assigned = lead.assigned_at ? String(lead.assigned_at).slice(0, 10) : null;
    if (assigned && index[assigned] !== undefined) series[index[assigned]].asignados += 1;
    toArray(lead.management_history).forEach((iso) => {
      const key = dayKey(new Date(iso));
      if (index[key] !== undefined) series[index[key]].gestionados += 1;
    });
  });
  const [sales] = await pool.query('SELECT created_at FROM sales');
  sales.forEach((sale) => {
    const key = String(sale.created_at).slice(0, 10);
    if (index[key] !== undefined) series[index[key]].ventas += 1;
  });
  const totals = series.reduce((acc, d) => ({
    asignados: acc.asignados + d.asignados, gestionados: acc.gestionados + d.gestionados, ventas: acc.ventas + d.ventas,
  }), { asignados: 0, gestionados: 0, ventas: 0 });
  res.json({ series, totals, conversion: totals.gestionados ? Math.round((totals.ventas / totals.gestionados) * 100) : 0 });
});

/* ───────── Seguimiento de ventas ───────── */
const SALE_FROM = 'FROM sales s LEFT JOIN usuarios u ON u.id = s.advisor_id LEFT JOIN leads l ON l.id = s.lead_id';
const SALE_SELECT = 'SELECT s.*, u.nombre AS advisor_nombre, l.zone AS zone, l.coordinates AS coordinates ' + SALE_FROM;

function saleFilters(query) {
  const where = [];
  const params = [];
  if (query.q) {
    const like = '%' + query.q + '%';
    where.push('(s.client_name LIKE ? OR s.client_phone LIKE ? OR s.document_number LIKE ? OR s.sot LIKE ? OR u.nombre LIKE ? OR l.zone LIKE ?)');
    params.push(like, like, like, like, like, like);
  }
  if (query.advisorId) { where.push('s.advisor_id = ?'); params.push(Number(query.advisorId)); }
  if (query.status) { where.push('s.tracking_status = ?'); params.push(query.status); }
  if (query.from) { where.push('DATE(s.created_at) >= ?'); params.push(query.from); }
  if (query.to) { where.push('DATE(s.created_at) <= ?'); params.push(query.to); }
  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

router.get('/sales', async (req, res) => {
  const { clause, params } = saleFilters(req.query);
  const page = Math.max(1, Number(req.query.page) || 1);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total ' + SALE_FROM + ' ' + clause, params);
  const [rows] = await pool.query(
    SALE_SELECT + ' ' + clause + ' ORDER BY s.created_at DESC, s.id LIMIT ? OFFSET ?',
    params.concat([PAGE_SIZE, (page - 1) * PAGE_SIZE])
  );
  const [[stats]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(tracking_status = 'en_ejecucion') AS en_ejecucion,
            SUM(tracking_status = 'instalado') AS instaladas,
            SUM(tracking_status = 'caida') AS caidas
     FROM sales`
  );
  res.json({
    sales: rows.map(mapSale),
    total,
    page,
    pageSize: PAGE_SIZE,
    stats: {
      total: stats.total,
      enEjecucion: Number(stats.en_ejecucion || 0),
      instaladas: Number(stats.instaladas || 0),
      caidas: Number(stats.caidas || 0),
    },
    options: { tracking: TRACKING, reasons: REASONS, results: RESULTS, slots: SLOTS },
  });
});

router.patch('/sales/:id/tracking', async (req, res) => {
  const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
  const sale = existing[0];
  if (!sale) return res.status(404).json({ error: 'Venta no encontrada.' });
  const { trackingStatus, reason, comment, sot, scheduledDate, slot } = req.body || {};
  if (!TRACKING[trackingStatus]) return res.status(422).json({ error: 'Estado de seguimiento no válido.' });
  if (NEGATIVE.includes(trackingStatus) && !reason) return res.status(422).json({ error: 'Indica el motivo de la caída o rechazo.' });
  if (reason && !REASONS.includes(reason)) return res.status(422).json({ error: 'Motivo no válido.' });
  if (slot && !SLOTS.includes(slot)) return res.status(422).json({ error: 'Tramo no válido.' });
  if (scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return res.status(422).json({ error: 'Fecha no válida.' });

  let status = 'en_verificacion';
  if (trackingStatus === 'instalado') status = 'aprobada';
  else if (NEGATIVE.includes(trackingStatus)) status = 'rechazada';

  const history = toArray(sale.tracking_history);
  history.push(entry(req.user.nombre, 'Estado: ' + TRACKING[trackingStatus] + (reason ? ' · ' + reason : '')));
  await pool.query(
    'UPDATE sales SET tracking_status = ?, status = ?, reason = ?, comment = ?, sot = ?, scheduled_date = ?, slot = ?, tracking_history = ? WHERE id = ?',
    [trackingStatus, status, reason || null, clip(comment, 2000) || null, clip(sot, 60) || null, scheduledDate || null, slot || null, JSON.stringify(history), sale.id]
  );
  if (sale.lead_id) await pool.query('UPDATE leads SET status = ? WHERE id = ?', [trackingStatus, sale.lead_id]);
  const [rows] = await pool.query(SALE_SELECT + ' WHERE s.id = ?', [sale.id]);
  res.json({ sale: mapSale(rows[0]) });
});

router.post('/sales/:id/observation', async (req, res) => {
  const { result, note } = req.body || {};
  if (!RESULTS.includes(result) || !note || !String(note).trim()) {
    return res.status(422).json({ error: 'Indica el resultado y la observación.' });
  }
  const [existing] = await pool.query('SELECT tracking_history FROM sales WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Venta no encontrada.' });
  const history = toArray(existing[0].tracking_history);
  history.push(entry(req.user.nombre, result + ' · ' + clip(note, 2000)));
  await pool.query('UPDATE sales SET tracking_history = ? WHERE id = ?', [JSON.stringify(history), req.params.id]);
  const [rows] = await pool.query(SALE_SELECT + ' WHERE s.id = ?', [req.params.id]);
  res.json({ sale: mapSale(rows[0]) });
});

router.get('/sales/export', async (req, res) => {
  const { clause, params } = saleFilters(req.query);
  const [rows] = await pool.query(SALE_SELECT + ' ' + clause + ' ORDER BY s.created_at DESC', params);
  sendCsv(res, 'kratos-seguimiento.csv', ['clientName', 'clientPhone', 'documentNumber', 'advisor', 'productName', 'trackingStatus', 'sot', 'scheduledDate', 'slot', 'comment'], rows.map(mapSale));
});

module.exports = router;
