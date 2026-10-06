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
  cuentaNombre: process.env.MOVILES_CUENTA_NOMBRE || 'MOVILES',
});
const configurado = () => { const c = cfg(); return Boolean(c.url && c.usuario && c.password); };
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

/* ------------------------------------------------
   TÚNEL: KRATOS solo ve la cuenta MÓVILES del CRM.
   - Si el usuario del CRM es "agente", el CRM ya lo deja fijo en su cuenta; aquí se exige que esa
     cuenta sea MÓVILES (si no, no se conecta).
   - Si es "admin", se busca el id de la cuenta MÓVILES y se manda SIEMPRE ese id (X-Cuenta-Id);
     KRATOS nunca pide ni muestra VENTAS, SEGUIMIENTO, RECLUTAMIENTO ni LEADS.
   - Además, todo lo que vuelve del CRM se filtra por esa cuenta, y antes de responder o cambiar
     el estado de un chat se comprueba que el chat sea de MÓVILES.
   ------------------------------------------------ */
let sesion = { token: '', hasta: 0, cuentaId: null, cuentaNombre: '' };
let ultimoError = '';

async function pedirCrm(ruta, { method = 'GET', body, token, cuentaId } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  if (cuentaId) headers['X-Cuenta-Id'] = String(cuentaId);
  const res = await fetch(`${cfg().url}${ruta}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function iniciarSesionCrm() {
  const c = cfg();
  const { res, data } = await pedirCrm('/api/auth/login', { method: 'POST', body: { usuario: c.usuario, password: c.password } });
  if (!res.ok || !data.token) throw new Error(data.error || `El CRM rechazó el inicio de sesión (${res.status})`);

  let cuentaId = null;
  let cuentaNombre = '';
  if (data.rol === 'admin') {
    if (c.cuentaId) {
      cuentaId = Number(c.cuentaId);
    } else {
      const { res: rc, data: dc } = await pedirCrm('/api/cuentas', { token: data.token });
      if (!rc.ok) throw new Error('No se pudo leer la lista de cuentas del CRM');
      const lista = dc.cuentas || dc.data || (Array.isArray(dc) ? dc : []);
      const cuenta = lista.find((x) => normalizar(x.nombre) === normalizar(c.cuentaNombre));
      if (!cuenta) throw new Error(`No existe la cuenta ${c.cuentaNombre} en el CRM`);
      cuentaId = Number(cuenta.id);
      cuentaNombre = cuenta.nombre;
    }
  } else {
    if (normalizar(data.cuenta_nombre) !== normalizar(c.cuentaNombre)) {
      throw new Error(`El usuario del CRM pertenece a la cuenta "${data.cuenta_nombre || '?'}", no a ${c.cuentaNombre}. Por seguridad no se conecta.`);
    }
    cuentaId = Number(data.cuenta_whatsapp_id);
    cuentaNombre = data.cuenta_nombre;
  }
  if (!Number.isInteger(cuentaId) || cuentaId <= 0) throw new Error('No se pudo determinar la cuenta MÓVILES');
  sesion = { token: data.token, hasta: Date.now() + 22 * 60 * 60 * 1000, cuentaId, cuentaNombre: cuentaNombre || c.cuentaNombre };
}

/** Llama al API del CRM, siempre fijado a la cuenta MÓVILES; renueva el token si venció. */
async function crm(ruta, { method = 'GET', body } = {}, reintento = true) {
  if (!configurado()) throw Object.assign(new Error('MÓVILES no está configurado'), { sinConfigurar: true });
  if (!sesion.token || Date.now() > sesion.hasta) await iniciarSesionCrm();
  const { res, data } = await pedirCrm(`/api${ruta}`, { method, body, token: sesion.token, cuentaId: sesion.cuentaId });
  if ((res.status === 401 || res.status === 403) && reintento) {
    sesion = { token: '', hasta: 0, cuentaId: null, cuentaNombre: '' };
    return crm(ruta, { method, body }, false);
  }
  if (!res.ok || data.ok === false) throw new Error(data.error || `El CRM respondió ${res.status}`);
  return data;
}

const esDeMoviles = (lead) => lead && Number(lead.cuenta_whatsapp_id) === Number(sesion.cuentaId);

/** Comprueba que el chat sea de MÓVILES antes de tocarlo. */
async function exigirChatDeMoviles(id) {
  const data = await crm(`/leads/${id}/mensajes`);
  if (!esDeMoviles(data.lead)) throw Object.assign(new Error('Ese chat no es de la cuenta MÓVILES'), { prohibido: true });
  return data;
}

function responderError(res, e) {
  if (e.sinConfigurar) return res.json({ ok: false, configurado: false, mensaje: 'MÓVILES todavía no está conectado.' });
  if (e.prohibido) return res.status(403).json({ ok: false, mensaje: e.message });
  ultimoError = e.message;
  console.error('[moviles]', e.message);
  return res.status(502).json({ ok: false, configurado: true, mensaje: `No se pudo hablar con el CRM de MÓVILES: ${e.message}` });
}

router.get('/estado', auth(ROLES), async (req, res) => {
  if (!configurado()) return res.json({ ok: true, configurado: false, conectado: false });
  try {
    await crm('/leads/resumen');
    ultimoError = '';
    res.json({ ok: true, configurado: true, conectado: true, cuenta: sesion.cuentaNombre });
  } catch (e) {
    res.json({ ok: true, configurado: true, conectado: false, mensaje: e.message });
  }
});

/* Origen del contacto, igual que el CRM: campaña que empieza con "base" o es "masivo" = envío masivo propio. */
const esDeBaseMasivo = (l) => {
  const c = normalizar(l.campana).toLowerCase();
  return c.startsWith('base') || c === 'masivo';
};
/* Un contacto de base masiva "ya respondió" cuando el último mensaje del chat es suyo (entrante). */
const yaRespondio = (l) => String(l.ultimo_mensaje_dir || '').toLowerCase() === 'entrante';

/** Bandeja de MÓVILES en cuatro columnas:
 *  - base:       base masiva a la que se le envió y todavía no responde,
 *  - nuevos:     chats sin atender (anuncios, interesados y base masiva que ya respondió),
 *  - atendidos:  chats ya respondidos por el equipo,
 *  - blacklist:  no desean información.
 *  Cada contacto aparece en UNA sola columna, según su estado real. */
router.get('/bandeja', auth(ROLES), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const antiguedad = ['7', '14', 'todos'].includes(req.query.antiguedad) ? req.query.antiguedad : '14';
    const filtro = `antiguedad=${antiguedad}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
    const [resumen, resumenMasivo, nuevosAnuncio, nuevosMasivo, interesados, atendidos, descartados] = await Promise.all([
      crm(`/leads/resumen?antiguedad=${antiguedad}`),
      crm(`/leads/resumen?antiguedad=${antiguedad}&origen=masivo`),
      crm(`/leads?columna=nuevos&origen=anuncio&limit=40&${filtro}`),
      crm(`/leads?columna=nuevos&origen=masivo&limit=80&${filtro}`),
      crm(`/leads?columna=interesados&limit=40&${filtro}`),
      crm(`/leads?columna=atendidos&limit=40&${filtro}`),
      crm(`/leads?columna=descartados&limit=40&${filtro}`),
    ]);

    const vistos = new Set();
    const columnas = { base: [], nuevos: [], atendidos: [], blacklist: [] };
    const todos = [nuevosAnuncio, nuevosMasivo, interesados, atendidos, descartados].flatMap((d) => d.leads || []);
    for (const l of todos) {
      if (!esDeMoviles(l) || vistos.has(l.id)) continue;
      vistos.add(l.id);
      if (l.estado === 'atendido') columnas.atendidos.push(l);
      else if (l.estado === 'descartado') columnas.blacklist.push(l);
      else if (['nuevo', 'contactado'].includes(l.estado) && esDeBaseMasivo(l) && !yaRespondio(l)) columnas.base.push(l);
      else columnas.nuevos.push(l);
    }
    const reciente = (l) => new Date(l.ultimo_mensaje_ts || l.fecha_ultima_actividad || 0).getTime() || 0;
    Object.values(columnas).forEach((lista) => lista.sort((a, b) => reciente(b) - reciente(a)));

    const r = resumen.resumen || {};
    const rm = resumenMasivo.resumen || {};
    const respondieronBase = columnas.nuevos.filter((l) => esDeBaseMasivo(l) && ['nuevo', 'contactado'].includes(l.estado)).length;
    const base = Math.max(0, Number(rm.nuevos || 0) - respondieronBase);
    const conteos = {
      base,
      nuevos: Math.max(0, Number(r.nuevos || 0) + Number(r.interesados || 0) - base),
      atendidos: Number(r.atendidos || 0),
      blacklist: Number(r.descartados || 0),
      no_leidos: Number(r.no_leidos_total || 0),
    };
    res.json({ ok: true, configurado: true, cuenta: sesion.cuentaNombre, conteos, columnas });
  } catch (e) { responderError(res, e); }
});

router.get('/leads/:id/mensajes', auth(ROLES), async (req, res) => {
  try {
    const data = await exigirChatDeMoviles(Number(req.params.id));
    res.json({ ok: true, lead: data.lead, mensajes: data.mensajes || [] });
  } catch (e) { responderError(res, e); }
});

router.post('/leads/:id/responder', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const mensaje = String(req.body?.mensaje || '').trim();
    if (!mensaje) return res.status(400).json({ ok: false, mensaje: 'Escribe un mensaje' });
    await exigirChatDeMoviles(id);
    await crm(`/leads/${id}/responder`, { method: 'POST', body: { mensaje } });
    res.json({ ok: true });
  } catch (e) { responderError(res, e); }
});

router.patch('/leads/:id/marcar-atendido', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await exigirChatDeMoviles(id);
    await crm(`/leads/${id}/marcar-atendido`, { method: 'PATCH', body: {} });
    res.json({ ok: true });
  } catch (e) { responderError(res, e); }
});

router.patch('/leads/:id/estado', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const estado = String(req.body?.estado || '').trim();
    if (!['nuevo', 'contactado', 'interesado', 'descartado', 'atendido'].includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
    }
    await exigirChatDeMoviles(id);
    await crm(`/leads/${id}/estado`, { method: 'PATCH', body: { estado } });
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
  const c = String(lead.campana || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return /mov\s*-?\s*2/.test(c) || c.includes('ilimitado') ? 'MOV 2' : 'MOV 1';
}

async function pasarInteresadosALaBase() {
  if (!configurado()) return { creados: 0 };
  const data = await crm('/leads?columna=interesados&antiguedad=14&limit=100');
  let creados = 0;
  for (const lead of (data.leads || []).filter(esDeMoviles)) {
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
