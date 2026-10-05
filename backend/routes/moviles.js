/* ================================================
   MOVILES.JS — Conexión de KRATOS con la cuenta MÓVILES del CRM de WhatsApp (API de Meta)
   ------------------------------------------------
   El CRM (leads-whatsapp) sigue siendo el dueño del número y del webhook de Meta.
   KRATOS entra con un usuario del panel de ese CRM (de preferencia un "agente" fijo a la
   cuenta MÓVILES) y desde aquí:
     - muestra la bandeja de MÓVILES (Nuevos, Interesados, Descartados, Atendidos),
     - permite abrir chats, responder y marcar atendido,
     - y registra en la Base de KRATOS a quien queda INTERESADO (campaña MOV 1 / MOV 2).
   Variables (backend/.env):
     MOVILES_CRM_URL=https://leads.netcontactbpo.com
     MOVILES_CRM_USER=...        MOVILES_CRM_PASSWORD=...
     MOVILES_CUENTA_ID=...       (solo si el usuario es admin del CRM: id de la cuenta MÓVILES)
   ================================================ */
const express = require('express');
const db      = require('../database');
const auth    = require('../middleware/auth');

const router = express.Router();
const ROLES  = ['backoffice', 'jefatura'];
const COLUMNAS = ['nuevos', 'interesados', 'descartados', 'atendidos'];

const cfg = () => ({
  url: String(process.env.MOVILES_CRM_URL || '').replace(/\/+$/, ''),
  usuario: process.env.MOVILES_CRM_USER || '',
  password: process.env.MOVILES_CRM_PASSWORD || '',
  cuentaId: process.env.MOVILES_CUENTA_ID || '',
});
const configurado = () => { const c = cfg(); return Boolean(c.url && c.usuario && c.password); };

let sesion = { token: '', hasta: 0 };
let ultimoError = '';

async function iniciarSesionCrm() {
  const c = cfg();
  const res = await fetch(`${c.url}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: c.usuario, password: c.password }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.error || `El CRM rechazó el inicio de sesión (${res.status})`);
  sesion = { token: data.token, hasta: Date.now() + 22 * 60 * 60 * 1000 };
}

/** Llama al API del CRM con la sesión de KRATOS; renueva el token si venció. */
async function crm(ruta, { method = 'GET', body } = {}, reintento = true) {
  if (!configurado()) throw Object.assign(new Error('MÓVILES no está configurado'), { sinConfigurar: true });
  if (!sesion.token || Date.now() > sesion.hasta) await iniciarSesionCrm();
  const c = cfg();
  const headers = { Authorization: `Bearer ${sesion.token}` };
  if (body) headers['Content-Type'] = 'application/json';
  if (c.cuentaId) headers['X-Cuenta-Id'] = c.cuentaId;
  const res = await fetch(`${c.url}/api${ruta}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
  });
  if ((res.status === 401 || res.status === 403) && reintento) {
    sesion = { token: '', hasta: 0 };
    return crm(ruta, { method, body }, false);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `El CRM respondió ${res.status}`);
  return data;
}

function responderError(res, e) {
  if (e.sinConfigurar) return res.json({ ok: false, configurado: false, mensaje: 'MÓVILES todavía no está conectado.' });
  ultimoError = e.message;
  console.error('[moviles]', e.message);
  return res.status(502).json({ ok: false, configurado: true, mensaje: `No se pudo hablar con el CRM de MÓVILES: ${e.message}` });
}

router.get('/estado', auth(ROLES), async (req, res) => {
  if (!configurado()) return res.json({ ok: true, configurado: false, conectado: false });
  try {
    await crm('/leads/resumen');
    ultimoError = '';
    res.json({ ok: true, configurado: true, conectado: true });
  } catch (e) {
    res.json({ ok: true, configurado: true, conectado: false, mensaje: e.message });
  }
});

/** Bandeja completa: contadores + las cuatro columnas. */
router.get('/bandeja', auth(ROLES), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const antiguedad = ['7', '14', 'todos'].includes(req.query.antiguedad) ? req.query.antiguedad : '14';
    const base = `antiguedad=${antiguedad}&limit=40${q ? `&q=${encodeURIComponent(q)}` : ''}`;
    const [resumen, ...columnas] = await Promise.all([
      crm(`/leads/resumen?antiguedad=${antiguedad}`),
      ...COLUMNAS.map((col) => crm(`/leads?columna=${col}&${base}`)),
    ]);
    const salida = {};
    COLUMNAS.forEach((col, i) => { salida[col] = columnas[i].leads || []; });
    res.json({ ok: true, configurado: true, resumen: resumen.resumen || {}, columnas: salida });
  } catch (e) { responderError(res, e); }
});

router.get('/leads/:id/mensajes', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await crm(`/leads/${id}/mensajes`);
    res.json({ ok: true, lead: data.lead, mensajes: data.mensajes || [] });
  } catch (e) { responderError(res, e); }
});

router.post('/leads/:id/responder', auth(ROLES), async (req, res) => {
  try {
    const mensaje = String(req.body?.mensaje || '').trim();
    if (!mensaje) return res.status(400).json({ ok: false, mensaje: 'Escribe un mensaje' });
    await crm(`/leads/${Number(req.params.id)}/responder`, { method: 'POST', body: { mensaje } });
    res.json({ ok: true });
  } catch (e) { responderError(res, e); }
});

router.patch('/leads/:id/marcar-atendido', auth(ROLES), async (req, res) => {
  try {
    await crm(`/leads/${Number(req.params.id)}/marcar-atendido`, { method: 'PATCH', body: {} });
    res.json({ ok: true });
  } catch (e) { responderError(res, e); }
});

router.patch('/leads/:id/estado', auth(ROLES), async (req, res) => {
  try {
    const estado = String(req.body?.estado || '').trim();
    if (!['nuevo', 'contactado', 'interesado', 'descartado', 'atendido'].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
    }
    await crm(`/leads/${Number(req.params.id)}/estado`, { method: 'PATCH', body: { estado } });
    res.json({ ok: true });
  } catch (e) { responderError(res, e); }
});

/* ------------------------------------------------
   Interesados de MÓVILES -> Base de KRATOS (sin tipificar, sin asignar)
   ------------------------------------------------ */
function fechaPeruHoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
}
function horaPeruAhora() {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
function campanaDe(lead) {
  return /mov\s*-?\s*2/i.test(String(lead.campana || '')) ? 'MOV 2' : 'MOV 1';
}

async function pasarInteresadosALaBase() {
  if (!configurado()) return { creados: 0 };
  const data = await crm('/leads?columna=interesados&antiguedad=14&limit=100');
  let creados = 0;
  for (const lead of data.leads || []) {
    const [ya] = await db.query('SELECT 1 FROM moviles_leads_sync WHERE lead_crm_id = ? LIMIT 1', [lead.id]);
    if (ya.length) continue;

    let n1 = String(lead.telefono || '').replace(/\D/g, '');
    if (n1.length === 11 && n1.startsWith('51')) n1 = n1.slice(2);
    n1 = n1.substring(0, 20);
    const usuario = String(lead.username || '').trim().replace(/^@+/, '').substring(0, 100);
    if (!n1 && !usuario) { await db.query('INSERT INTO moviles_leads_sync (lead_crm_id) VALUES (?)', [lead.id]); continue; }

    const campana = campanaDe(lead);
    const fecha = fechaPeruHoy();
    const [existentes] = n1
      ? await db.query('SELECT id FROM leads WHERE n1_normalizado = ? AND fecha = ? AND campana = ? LIMIT 1', [n1, fecha, campana])
      : await db.query('SELECT id FROM leads WHERE usuario_whatsapp = ? AND fecha = ? AND campana = ? LIMIT 1', [usuario, fecha, campana]);
    let idKratos = existentes[0]?.id || null;
    if (!idKratos) {
      const [backs] = await db.query(`SELECT id, nombre, usuario FROM usuarios WHERE cargo = 'backoffice' AND activo = 1 ORDER BY RAND() LIMIT 1`);
      const resp = backs[0] || null;
      const historial = JSON.stringify([{
        tipo: 'CARGA', cargadoPor: resp?.nombre || 'Back Data', cargadoPorUsuario: resp?.usuario || '',
        hora: horaPeruAhora(), fecha, motivo: 'Interesado en MÓVILES (WhatsApp)', origenCarga: 'WhatsApp MÓVILES',
        origenUsuario: 'sistema-moviles', responsableAtencion: resp?.nombre || '', asignacionAutomatica: true,
      }]);
      const [ins] = await db.query(
        `INSERT INTO leads (campana, n1, usuario_whatsapp, fecha, sin_asignar, historial, rotaciones,
                            creado_por_id, creado_por_nombre, creado_por_usuario)
         VALUES (?, ?, ?, ?, 1, ?, 0, ?, ?, ?)`,
        [campana, n1, usuario, fecha, historial, resp?.id || null, resp?.nombre || 'Back Data', resp?.usuario || '']);
      idKratos = ins.insertId;
      creados += 1;
    }
    await db.query('INSERT INTO moviles_leads_sync (lead_crm_id, lead_kratos_id) VALUES (?, ?)', [lead.id, idKratos]);
  }
  return { creados };
}

let timerSync = null;
function iniciarSincronizacion() {
  if (timerSync) return;
  const ciclo = async () => {
    try { await pasarInteresadosALaBase(); ultimoError = ''; }
    catch (e) { if (!e.sinConfigurar) { ultimoError = e.message; console.error('[moviles] sincronización:', e.message); } }
  };
  timerSync = setInterval(ciclo, 60 * 1000);
  setTimeout(ciclo, 15 * 1000);
}

router.post('/sincronizar', auth(['jefatura']), async (req, res) => {
  try { res.json({ ok: true, ...(await pasarInteresadosALaBase()) }); }
  catch (e) { responderError(res, e); }
});

module.exports = router;
module.exports.iniciarSincronizacion = iniciarSincronizacion;
module.exports.ultimoError = () => ultimoError;
