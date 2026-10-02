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
// Mismo texto que usa la tipificación del Back Office, para que ambos lados coincidan.
const ETIQUETAS_ESPECIALES = { buzon_de_voz: 'BUZON DE VOZ', desea_hogar: 'DESEA MOVIL' };

/** "no_contesta" -> "NO CONTESTA" (texto que guarda la tipificación del asesor). */
function etiquetaDeEstado(status) {
  if (!status || status === 'pendiente') return '';
  return ETIQUETAS_ESPECIALES[status] || String(status).replace(/_/g, ' ').toUpperCase();
}

/** "BUZÓN DE VOZ" -> "buzon_de_voz". */
function estadoDeEtiqueta(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return 'pendiente';
  const id = limpio.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '_');
  return id === 'desea_movil' ? 'desea_hogar' : id;
}

const SQL_ESTADO_VENTA = `CASE
  WHEN UPPER(v.estado) IN ('ACTIVA','INSTALADO','SERVICIO_ACTIVO') THEN 'activa'
  WHEN UPPER(v.estado) IN ('CAIDA','RECHAZO','RECHAZO_CAMPO','RECHAZO_MESA','RECHAZADO') THEN 'caida'
  WHEN UPPER(v.estado) = 'NO_CONTESTA' THEN 'no_contesta'
  WHEN UPPER(v.estado) = 'PROGRAMADO' THEN 'programado'
  ELSE 'pendiente' END`;

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
    status: row.con_venta ? 'venta_cerrada' : estadoDeEtiqueta(row.tipif_vend),
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
    scheduledDate: row.programada_fmt || null,
    department: row.departamento || '',
    province: row.provincia || '',
    channel: row.canal || '',
    district: row.distrito || '',
  };
}

const COLUMNAS_LEAD = `l.*, DATE_FORMAT(l.fecha, '%Y-%m-%d') AS fecha_fmt`;
const COLUMNAS_VENTA = `v.*, ${SQL_ESTADO_VENTA} AS estado_app, DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i:%s') AS creado_fmt, DATE_FORMAT(v.fecha_programada, '%Y-%m-%d') AS programada_fmt`;

/* ====================== ASESOR ====================== */

/* ----- Contactos del asesor: titular actual + asesores previos (como en KRONO) ----- */

function historialDe(lead) {
  try { const h = JSON.parse(lead.historial || '[]'); return Array.isArray(h) ? h : []; } catch { return []; }
}

/** Última rotación en la que este asesor dejó el contacto (guarda su tipificación y su nota de entonces). */
function entradaDeAsesorPrevio(lead, nombre) {
  const hist = historialDe(lead);
  for (let i = hist.length - 1; i >= 0; i--) {
    if (String(hist[i]?.asesorAnterior || '').trim() === nombre) return { hist, idx: i };
  }
  return { hist, idx: -1 };
}

/** Nombre del asesor tal como figura en el historial de los contactos (el token no lo trae). */
async function nombreDeAsesor(req) {
  if (req.user.nombre) return String(req.user.nombre).trim();
  const [u] = await db.query('SELECT nombre FROM usuarios WHERE id = ? LIMIT 1', [req.user.id]);
  return String(u[0]?.nombre || '').trim();
}

const SQL_LEAD_VISTA = `${COLUMNAS_LEAD},
  EXISTS(SELECT 1 FROM ventas v WHERE v.lead_id = l.id AND v.asesor_id = ?) AS con_venta`;

/** El contacto tal como lo ve este asesor: el titular ve lo suyo; un asesor previo ve lo que dejó al rotarse. */
function vistaDeLead(row, userId, nombre) {
  const lead = mapLead(row);
  const titular = Number(row.asesor_id) === Number(userId) && !Number(row.sin_asignar || 0);
  if (titular || row.con_venta) return lead;
  const { hist, idx } = entradaDeAsesorPrevio(row, nombre);
  if (idx < 0) return lead;
  return {
    ...lead,
    status: estadoDeEtiqueta(hist[idx].tipifVendAntes),
    advisorNote: hist[idx].obsAsesorAntes || '',
    previousOwner: true,
  };
}

/** Contactos del asesor: los que tiene ahora y los que tuvo y fueron rotados (mientras no exista una venta de otro). */
r.get('/leads', auth(['asesor']), async (req, res) => {
  const nombre = await nombreDeAsesor(req);
  const patronPrevio = nombre ? `%"asesorAnterior":${JSON.stringify(nombre).replace(/[\\%_]/g, '\\$&')}%` : null;
  const [rows] = await db.query(
    `SELECT ${SQL_LEAD_VISTA}
     FROM leads l
     WHERE (l.asesor_id = ? AND COALESCE(l.sin_asignar, 0) = 0)
        OR l.id IN (SELECT v.lead_id FROM ventas v WHERE v.asesor_id = ? AND v.lead_id IS NOT NULL)
        OR (? IS NOT NULL AND l.historial LIKE ? AND COALESCE(l.asesor_id, 0) <> ?
            AND NOT EXISTS (SELECT 1 FROM ventas v
                             WHERE v.lead_id = l.id OR (v.lead_id IS NULL AND l.n1 <> '' AND v.telefono1 = l.n1)))
     ORDER BY l.fecha DESC, l.hora_asig DESC, l.id DESC`,
    [req.user.id, req.user.id, req.user.id, patronPrevio, patronPrevio, req.user.id]
  );
  res.json({ leads: rows.map((row) => vistaDeLead(row, req.user.id, nombre)) });
});

/** Estado y observación de un contacto propio (titular) o que el asesor tuvo antes (asesor previo). */
r.patch('/leads/:id', auth(['asesor']), async (req, res) => {
  const nombre = await nombreDeAsesor(req);
  const idLead = Number(req.params.id);
  const [rows] = await db.query('SELECT * FROM leads WHERE id = ? LIMIT 1', [idLead]);
  const lead = rows[0];
  const NO_ENCONTRADO = { error: 'Contacto no encontrado o no asignado a tu usuario.' };
  if (!lead) return res.status(404).json(NO_ENCONTRADO);

  const titular = Number(lead.asesor_id) === Number(req.user.id);
  let previo = null;
  if (!titular) {
    const [ventas] = await db.query(
      `SELECT 1 FROM ventas v WHERE v.lead_id = ? OR (v.lead_id IS NULL AND ? <> '' AND v.telefono1 = ?) LIMIT 1`,
      [lead.id, lead.n1 || '', lead.n1 || '']);
    const { hist, idx } = entradaDeAsesorPrevio(lead, nombre);
    if (idx < 0 || ventas.length) return res.status(404).json(NO_ENCONTRADO);
    previo = { hist, idx };
  }

  const { status, advisorNote, coordinates } = req.body || {};
  const tipifActual = titular ? (lead.tipif_vend || '') : String(previo.hist[previo.idx].tipifVendAntes || '');
  const notaActual = titular ? lead.obs_asesor : (previo.hist[previo.idx].obsAsesorAntes || '');
  const coordActual = lead.coordenadas;
  const tipif = status !== undefined ? etiquetaDeEstado(status) : tipifActual;
  const cambioTipif = status !== undefined && tipif !== tipifActual;
  const hora = new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });

  // Preventa y No califica exigen el documento; Sin cobertura exige las coordenadas.
  if (cambioTipif) {
    const nota = advisorNote !== undefined ? advisorNote : notaActual;
    const coord = coordinates !== undefined ? coordinates : coordActual;
    if (['PREVENTA', 'NO CALIFICA'].includes(tipif) && !/(^|[^A-Za-z])(DNI\s*:\s*\d{8}|RUC\s*:\s*\d{11}|CE\s*:\s*\d{9})(?!\d)/i.test(String(nota || ''))) {
      return res.status(422).json({ error: 'Para esta tipificación debes registrar el documento del cliente (DNI de 8, RUC de 11 o CE de 9 dígitos).' });
    }
    if (tipif === 'SIN COBERTURA' && !String(coord || '').trim()) {
      return res.status(422).json({ error: 'Para Sin cobertura debes registrar las coordenadas.' });
    }
  }

  const hist = titular ? historialDe(lead) : previo.hist;
  if (cambioTipif) {
    hist.push({
      tipo: 'TIPIF_VEND', asesor: nombre, tipif, ts: Date.now(), hora,
      fecha: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }),
    });
  }

  if (titular) {
    await db.query(
      `UPDATE leads SET tipif_vend = ?, tipif_hora = ?, obs_asesor = ?, coordenadas = ?, historial = ? WHERE id = ? AND asesor_id = ?`,
      [
        tipif,
        cambioTipif ? (tipif ? hora : '') : lead.tipif_hora,
        advisorNote !== undefined ? advisorNote : lead.obs_asesor,
        coordinates !== undefined ? coordinates : lead.coordenadas,
        JSON.stringify(hist), lead.id, req.user.id,
      ]
    );
  } else {
    // Asesor previo: se actualiza solo lo suyo dentro del historial; el contacto del titular actual no se toca.
    if (status !== undefined) hist[previo.idx].tipifVendAntes = tipif;
    if (advisorNote !== undefined) hist[previo.idx].obsAsesorAntes = advisorNote;
    await db.query('UPDATE leads SET historial = ? WHERE id = ?', [JSON.stringify(hist), lead.id]);
  }

  const [out] = await db.query(`SELECT ${SQL_LEAD_VISTA} FROM leads l WHERE l.id = ?`, [req.user.id, lead.id]);
  res.json({ lead: vistaDeLead(out[0], req.user.id, nombre) });
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
    saleType, productName, category, amount, notes, leadId, department, province, district, channel,
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
        estado_supgrab, seguimiento_ingresado_at, sala_atribucion, lead_id, canal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VENTA', ?, 'conforme', NOW(), ?, ?, ?)`,
    [
      req.user.id, req.user.nombre || req.user.usuario, documentType, documentNumber, clientName, clientPhone,
      referencePhone || '', department || '', province || '', district || lead?.distrito || '', lead?.direccion || '', lead?.coordenadas || '',
      productName, category || null, saleType, Number(amount) || 0, notes || '', req.user.sala || null, idLead, channel || '',
    ]
  );
  await db.query('UPDATE ventas SET folio = ? WHERE id = ?', [`KRT-${new Date().getFullYear()}-${String(ins.insertId).padStart(6, '0')}`, ins.insertId]);

  if (lead) {
    const hora = new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
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
            SUM(${SQL_ESTADO_VENTA} = 'activa') AS aprobadas,
            SUM(${SQL_ESTADO_VENTA} = 'caida') AS rechazadas
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
            SUM(${SQL_ESTADO_VENTA} = 'activa') AS activas,
            SUM(${SQL_ESTADO_VENTA} = 'caida') AS caidas,
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
    return res.json({ sales: rows.map((row) => ({ ...mapSale(row), advisor: row.advisor_nombre, venta: row })) });
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${desde} ${clause}`, params);
  const [rows] = await db.query(
    `SELECT ${COLUMNAS_VENTA}, u.nombre AS advisor_nombre ${desde} ${clause}
     ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );
  res.json({
    sales: rows.map((row) => ({ ...mapSale(row), advisor: row.advisor_nombre, venta: row })),
    total: Number(total), page, pageSize: PAGE_SIZE,
  });
});

/** Edita los datos que el asesor registró en la venta. Un supervisor solo edita ventas de su sala. */
r.patch('/supervisor/sales/:id', SUP, async (req, res) => {
  const id = Number(req.params.id);
  const { clientName, clientPhone, referencePhone, documentType, documentNumber, saleType, productName, category, amount, notes, department, province, district, channel } = req.body || {};

  const faltan = ['clientName', 'clientPhone', 'documentType', 'documentNumber', 'productName', 'saleType']
    .filter((campo) => !{ clientName, clientPhone, documentType, documentNumber, productName, saleType }[campo]);
  if (faltan.length) return res.status(422).json({ error: 'Faltan campos obligatorios.', fields: faltan });

  const [rows] = await db.query(
    `SELECT v.id, u.sala AS sala_asesor FROM ventas v LEFT JOIN usuarios u ON u.id = v.asesor_id WHERE v.id = ? LIMIT 1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Venta no encontrada.' });
  const sala = salaDelSupervisor(req);
  if (sala && rows[0].sala_asesor !== sala) return res.status(403).json({ error: 'Solo puedes editar ventas de tu sala.' });

  await db.query(
    `UPDATE ventas SET nombre = ?, telefono1 = ?, telefono2 = ?, tipo_doc = ?, dni = ?, tipo_venta = ?,
            paquete = ?, categoria = ?, monto = ?, observacion = ?, departamento = ?, provincia = ?, distrito = ?, canal = ? WHERE id = ?`,
    [clientName, clientPhone, referencePhone || '', documentType, documentNumber, saleType,
     productName, category || null, Number(amount) || 0, notes || '', department || '', province || '', district || '', channel || '', id]
  );
  const [out] = await db.query(`SELECT ${COLUMNAS_VENTA} FROM ventas v WHERE v.id = ?`, [id]);
  res.json({ sale: mapSale(out[0]) });
});

module.exports = router;
