/* ================================================
   ROUTES/KRATOS.JS — API de los módulos Asesor y Supervisor
   Lee y escribe las mismas tablas que Back Office, Seguimiento y Jefatura
   (usuarios, leads, ventas): es un solo sistema y una sola base de datos.
   ================================================ */
const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

/** Express 4 no captura errores de funciones async: los enviamos al manejador de errores. */
const capturar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const ruta = (metodo) => (path, ...fns) => router[metodo](path, ...fns.slice(0, -1), capturar(fns[fns.length - 1]));
const r = { get: ruta('get'), post: ruta('post'), patch: ruta('patch') };
const PAGE_SIZE = 20;

/* ---------- Estados ---------- */
const ETIQUETAS_ESPECIALES = { buzon_de_voz: 'BUZÓN DE VOZ' };

/** "no_contesta" -> "NO CONTESTA" (texto que guarda la tipificación del asesor). */
function etiquetaDeEstado(status) {
  if (!status || status === 'pendiente') return '';
  return ETIQUETAS_ESPECIALES[status] || String(status).replace(/_/g, ' ').toUpperCase();
}

/** "BUZÓN DE VOZ" -> "buzon_de_voz". */
function estadoDeEtiqueta(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return 'pendiente';
  return limpio.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '_');
}

const SQL_ESTADO_VENTA = `CASE
  WHEN UPPER(v.estado) IN ('INSTALADO','SERVICIO_ACTIVO','INSTALADO_NO_VALIDADO') THEN 'aprobada'
  WHEN UPPER(v.estado) IN ('CAIDA','RECHAZO','RECHAZO_CAMPO','RECHAZO_MESA','RECHAZADO') THEN 'rechazada'
  ELSE 'en_verificacion' END`;

/* ---------- Mapeos hacia el formato que usa el frontend ---------- */
function mapLead(row) {
  return {
    id: String(row.id),
    phone: row.n1,
    phone2: row.n2 || null,
    whatsappUser: row.usuario_whatsapp || '',
    clientName: null,
    campaign: row.campana,
    zone: row.distrito,
    coordinates: row.coordenadas || '',
    address: row.direccion || '',
    tipificacion: row.tipif_back || null,
    backNotes: row.obs_back || '',
    advisorNote: row.obs_asesor || '',
    status: estadoDeEtiqueta(row.tipif_vend),
    documentType: null,
    documentNumber: null,
    assignedAt: row.fecha_fmt ? `${row.fecha_fmt} ${row.hora_asig || '00:00'}:00` : null,
    managementHistory: [],
  };
}

function mapSale(row) {
  return {
    id: String(row.id),
    folio: row.folio || `KRT-${row.id}`,
    advisorId: row.asesor_id,
    clientName: row.nombre,
    clientPhone: row.telefono1,
    referencePhone: row.telefono2 || null,
    documentType: row.tipo_doc,
    documentNumber: row.dni,
    saleType: row.tipo_venta,
    productName: row.paquete,
    category: row.categoria,
    amount: Number(row.monto || 0),
    status: row.estado_app,
    notes: row.observacion,
    leadId: row.lead_id ? String(row.lead_id) : null,
    createdAt: row.creado_fmt,
  };
}

const COLUMNAS_LEAD = `l.*, DATE_FORMAT(l.fecha, '%Y-%m-%d') AS fecha_fmt`;
const COLUMNAS_VENTA = `v.*, ${SQL_ESTADO_VENTA} AS estado_app, DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i:%s') AS creado_fmt`;

/* ====================== ASESOR ====================== */

/** Contactos asignados al asesor. */
r.get('/leads', auth(['asesor']), async (req, res) => {
  const [rows] = await db.query(
    `SELECT ${COLUMNAS_LEAD} FROM leads l
     WHERE l.asesor_id = ? AND COALESCE(l.sin_asignar, 0) = 0
     ORDER BY l.fecha DESC, l.hora_asig DESC, l.id DESC`,
    [req.user.id]
  );
  res.json({ leads: rows.map(mapLead) });
});

/** Estado y observación de un contacto propio. */
r.patch('/leads/:id', auth(['asesor']), async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM leads WHERE id = ? AND asesor_id = ? LIMIT 1', [Number(req.params.id), req.user.id]);
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Contacto no encontrado o no asignado a tu usuario.' });

  const { status, advisorNote, coordinates } = req.body || {};
  const tipif = status !== undefined ? etiquetaDeEstado(status) : lead.tipif_vend || '';
  const cambioTipif = status !== undefined && tipif !== (lead.tipif_vend || '');
  const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

  await db.query(
    `UPDATE leads SET tipif_vend = ?, tipif_hora = ?, obs_asesor = ?, coordenadas = ? WHERE id = ? AND asesor_id = ?`,
    [
      tipif,
      cambioTipif ? (tipif ? hora : '') : lead.tipif_hora,
      advisorNote !== undefined ? advisorNote : lead.obs_asesor,
      coordinates !== undefined ? coordinates : lead.coordenadas,
      lead.id, req.user.id,
    ]
  );

  const [out] = await db.query(`SELECT ${COLUMNAS_LEAD} FROM leads l WHERE l.id = ?`, [lead.id]);
  res.json({ lead: mapLead(out[0]) });
});

/** Ventas del asesor. */
r.get('/sales', auth(['asesor']), async (req, res) => {
  const [rows] = await db.query(
    `SELECT ${COLUMNAS_VENTA} FROM ventas v WHERE v.asesor_id = ? ORDER BY v.created_at DESC`, [req.user.id]);
  res.json({ sales: rows.map(mapSale) });
});

/** Registra una venta: entra directo a Seguimiento. */
r.post('/sales', auth(['asesor']), async (req, res) => {
  const {
    clientName, clientPhone, referencePhone, documentType, documentNumber,
    saleType, productName, category, amount, notes, leadId,
  } = req.body || {};

  const faltan = ['clientName', 'clientPhone', 'documentType', 'documentNumber', 'productName', 'saleType']
    .filter((campo) => !{ clientName, clientPhone, documentType, documentNumber, productName, saleType }[campo]);
  if (faltan.length) return res.status(422).json({ error: 'Faltan campos obligatorios.', fields: faltan });

  const idLead = leadId ? Number(leadId) : null;
  let lead = null;
  if (idLead) {
    const [previas] = await db.query('SELECT id FROM ventas WHERE lead_id = ? LIMIT 1', [idLead]);
    if (previas.length) return res.status(409).json({ error: 'Este contacto ya tiene una venta registrada.' });
    const [l] = await db.query('SELECT * FROM leads WHERE id = ? AND asesor_id = ? LIMIT 1', [idLead, req.user.id]);
    lead = l[0] || null;
  }

  const [ins] = await db.query(
    `INSERT INTO ventas
       (asesor_id, asesor_nombre, tipo_doc, dni, nombre, telefono1, telefono2, departamento, provincia, distrito,
        direccion, coordenadas, paquete, categoria, tipo_venta, monto, estado, observacion,
        estado_supgrab, seguimiento_ingresado_at, sala_atribucion, lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, 'VENTA', ?, 'conforme', NOW(), ?, ?)`,
    [
      req.user.id, req.user.nombre || req.user.usuario, documentType, documentNumber, clientName, clientPhone,
      referencePhone || '', lead?.distrito || '', lead?.direccion || '', lead?.coordenadas || '',
      productName, category || null, saleType, Number(amount) || 0, notes || '', req.user.sala || null, idLead,
    ]
  );
  await db.query('UPDATE ventas SET folio = ? WHERE id = ?', [`KRT-${new Date().getFullYear()}-${String(ins.insertId).padStart(6, '0')}`, ins.insertId]);

  if (lead) {
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    await db.query(`UPDATE leads SET tipif_vend = 'VENTA CERRADA', tipif_hora = ? WHERE id = ?`, [hora, lead.id]);
  }

  const [out] = await db.query(`SELECT ${COLUMNAS_VENTA} FROM ventas v WHERE v.id = ?`, [ins.insertId]);
  res.status(201).json({ sale: mapSale(out[0]) });
});

/* ====================== SUPERVISOR ====================== */

/** El supervisor ve su sala; jefatura (sin "ver como") ve todas. */
function salaDelSupervisor(req) {
  return req.user.cargo === 'supervisor' && req.user.sala ? req.user.sala : null;
}

const SUP = auth(['supervisor', 'jefatura']);

/** Asesores activos (de la sala del supervisor) con su cantidad de contactos. */
r.get('/supervisor/advisors', SUP, async (req, res) => {
  const sala = salaDelSupervisor(req);
  const [rows] = await db.query(
    `SELECT u.id, u.nombre, u.usuario, u.sala, COUNT(l.id) AS contactos
     FROM usuarios u
     LEFT JOIN leads l ON l.asesor_id = u.id AND COALESCE(l.sin_asignar, 0) = 0
     WHERE u.cargo = 'asesor' AND u.activo = 1 ${sala ? 'AND u.sala = ?' : ''}
     GROUP BY u.id, u.nombre, u.usuario, u.sala
     ORDER BY u.nombre`,
    sala ? [sala] : []
  );
  res.json({ advisors: rows.map((r) => ({ ...r, contactos: Number(r.contactos) })) });
});

r.get('/supervisor/metrics', SUP, async (req, res) => {
  const sala = salaDelSupervisor(req);
  const filtroSala = sala ? 'AND u.sala = ?' : '';
  const params = sala ? [sala] : [];

  const [asesores] = await db.query(
    `SELECT u.id, u.nombre FROM usuarios u WHERE u.cargo = 'asesor' AND u.activo = 1 ${filtroSala} ORDER BY u.nombre`, params);
  const [leadRows] = await db.query(
    `SELECT l.asesor_id AS id, COUNT(*) AS total,
            SUM(COALESCE(l.tipif_vend, '') <> '') AS gestionados
     FROM leads l JOIN usuarios u ON u.id = l.asesor_id
     WHERE COALESCE(l.sin_asignar, 0) = 0 ${filtroSala} GROUP BY l.asesor_id`, params);
  const [saleRows] = await db.query(
    `SELECT v.asesor_id AS id, COUNT(*) AS ventas,
            SUM(${SQL_ESTADO_VENTA} = 'aprobada') AS aprobadas,
            SUM(${SQL_ESTADO_VENTA} = 'rechazada') AS rechazadas
     FROM ventas v JOIN usuarios u ON u.id = v.asesor_id
     WHERE 1 = 1 ${filtroSala} GROUP BY v.asesor_id`, params);
  const leadBy = Object.fromEntries(leadRows.map((r) => [r.id, r]));
  const saleBy = Object.fromEntries(saleRows.map((r) => [r.id, r]));

  const porAsesor = asesores.map((a) => {
    const l = leadBy[a.id] || {};
    const s = saleBy[a.id] || {};
    const total = Number(l.total || 0);
    const gestionados = Number(l.gestionados || 0);
    return {
      id: a.id, nombre: a.nombre, contactos: total, gestionados,
      avance: total ? Math.round((gestionados / total) * 100) : 0,
      ventas: Number(s.ventas || 0), aprobadas: Number(s.aprobadas || 0), rechazadas: Number(s.rechazadas || 0),
    };
  });

  const totales = porAsesor.reduce(
    (acc, a) => ({
      contactos: acc.contactos + a.contactos, gestionados: acc.gestionados + a.gestionados,
      ventas: acc.ventas + a.ventas, aprobadas: acc.aprobadas + a.aprobadas, rechazadas: acc.rechazadas + a.rechazadas,
    }),
    { contactos: 0, gestionados: 0, ventas: 0, aprobadas: 0, rechazadas: 0 }
  );

  const [[hoy]] = await db.query(
    `SELECT COUNT(*) AS ventas,
            SUM(${SQL_ESTADO_VENTA} = 'aprobada') AS activas,
            SUM(${SQL_ESTADO_VENTA} = 'rechazada') AS caidas,
            COUNT(DISTINCT v.asesor_id) AS asesoresActivos
     FROM ventas v JOIN usuarios u ON u.id = v.asesor_id
     WHERE DATE(v.created_at) = CURDATE() ${filtroSala}`, params);

  res.json({
    porAsesor, totales, asesores: asesores.length,
    hoy: {
      ventas: Number(hoy.ventas || 0), activas: Number(hoy.activas || 0),
      caidas: Number(hoy.caidas || 0), asesoresActivos: Number(hoy.asesoresActivos || 0),
    },
  });
});

/** Base de llamadas de los asesores (solo lectura, paginada). */
r.get('/supervisor/leads', SUP, async (req, res) => {
  const { advisorId, status, q } = req.query;
  const sala = salaDelSupervisor(req);
  const where = ['l.asesor_id IS NOT NULL', 'COALESCE(l.sin_asignar, 0) = 0'];
  const params = [];
  if (sala) { where.push('u.sala = ?'); params.push(sala); }
  if (advisorId) { where.push('l.asesor_id = ?'); params.push(Number(advisorId)); }
  if (status) {
    where.push(status === 'pendiente'
      ? "COALESCE(l.tipif_vend, '') = ''"
      : "REPLACE(LOWER(l.tipif_vend), ' ', '_') = ?");
    if (status !== 'pendiente') params.push(status);
  }
  if (q) {
    where.push('(l.n1 LIKE ? OR l.n2 LIKE ? OR l.distrito LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const clause = where.join(' AND ');
  const page = Math.max(1, Number(req.query.page) || 1);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM leads l JOIN usuarios u ON u.id = l.asesor_id WHERE ${clause}`, params);
  const [rows] = await db.query(
    `SELECT ${COLUMNAS_LEAD}, u.nombre AS advisor_nombre
     FROM leads l JOIN usuarios u ON u.id = l.asesor_id
     WHERE ${clause} ORDER BY l.fecha DESC, l.hora_asig DESC, l.id DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );
  res.json({
    leads: rows.map((row) => ({ ...mapLead(row), advisor: row.advisor_nombre })),
    total: Number(total), page, pageSize: PAGE_SIZE,
  });
});

/** Ventas de los asesores. Sin ?page trae hasta 500 (gráficas); con ?page, de a 20. */
r.get('/supervisor/sales', SUP, async (req, res) => {
  const { advisorId, status, page: pageParam } = req.query;
  const sala = salaDelSupervisor(req);
  const where = [];
  const params = [];
  if (sala) { where.push('u.sala = ?'); params.push(sala); }
  if (advisorId) { where.push('v.asesor_id = ?'); params.push(Number(advisorId)); }
  if (status) { where.push(`${SQL_ESTADO_VENTA} = ?`); params.push(status); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const desde = `FROM ventas v LEFT JOIN usuarios u ON u.id = v.asesor_id`;

  if (!pageParam) {
    const [rows] = await db.query(
      `SELECT ${COLUMNAS_VENTA}, u.nombre AS advisor_nombre ${desde} ${clause} ORDER BY v.created_at DESC LIMIT 500`, params);
    return res.json({ sales: rows.map((row) => ({ ...mapSale(row), advisor: row.advisor_nombre })) });
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${desde} ${clause}`, params);
  const [rows] = await db.query(
    `SELECT ${COLUMNAS_VENTA}, u.nombre AS advisor_nombre ${desde} ${clause}
     ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );
  res.json({
    sales: rows.map((row) => ({ ...mapSale(row), advisor: row.advisor_nombre })),
    total: Number(total), page, pageSize: PAGE_SIZE,
  });
});

module.exports = router;
