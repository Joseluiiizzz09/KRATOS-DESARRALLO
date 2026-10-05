/* ================================================
   WHATSAPP.JS — Bandeja de conversaciones de KRATOS
   Guarda las conversaciones y mensajes. La conexión con las cuentas de WhatsApp
   (API de Meta u otra) se vincula después: basta con llamar a registrarMensajeEntrante()
   desde el webhook y con enviar los mensajes en estado PENDIENTE_ENVIO.
   ================================================ */
const express = require('express');
const db      = require('../database');
const auth    = require('../middleware/auth');

const router = express.Router();
const ROLES  = ['backoffice', 'jefatura'];
const ESTADOS = ['NUEVO', 'ATENDIDO', 'BLACKLIST'];

const limpiarTelefono = (valor) => String(valor || '').replace(/\D/g, '');

/** Para el webhook de WhatsApp: crea o actualiza la conversación y guarda el mensaje que entra. */
async function registrarMensajeEntrante({ telefono, usuario = '', nombre = '', texto = '', sala = '', campana = '' }) {
  const tel = limpiarTelefono(telefono);
  const clave = tel || String(usuario || '').trim().toLowerCase();
  if (!clave) throw new Error('Falta el teléfono o el usuario de WhatsApp');
  const [rows] = await db.query('SELECT id, estado FROM wa_conversaciones WHERE clave = ? LIMIT 1', [clave]);
  let id = rows[0]?.id;
  if (!id) {
    const [ins] = await db.query(
      `INSERT INTO wa_conversaciones (clave, telefono, usuario, nombre, sala, campana, estado, ultimo_mensaje, ultimo_at, sin_leer)
       VALUES (?, ?, ?, ?, ?, ?, 'NUEVO', ?, NOW(), 1)`,
      [clave, tel, usuario, nombre, sala, campana, texto]);
    id = ins.insertId;
  } else {
    await db.query(
      `UPDATE wa_conversaciones SET ultimo_mensaje = ?, ultimo_at = NOW(), sin_leer = sin_leer + 1,
              nombre = COALESCE(NULLIF(?, ''), nombre),
              estado = IF(estado = 'ATENDIDO', 'NUEVO', estado) WHERE id = ?`,
      [texto, nombre, id]);
  }
  await db.query(`INSERT INTO wa_mensajes (conversacion_id, direccion, texto) VALUES (?, 'ENTRANTE', ?)`, [id, texto]);
  return id;
}

/** Conversaciones agrupadas en las tres columnas de la bandeja. */
router.get('/conversaciones', auth(ROLES), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const params = [];
    let where = '1 = 1';
    if (q) {
      where += ' AND (nombre LIKE ? OR telefono LIKE ? OR usuario LIKE ? OR ultimo_mensaje LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    const [rows] = await db.query(
      `SELECT id, telefono, usuario, nombre, sala, campana, asesor, estado, ultimo_mensaje, sin_leer,
              DATE_FORMAT(ultimo_at, '%Y-%m-%d %H:%i:%s') AS ultimo_at
         FROM wa_conversaciones WHERE ${where} ORDER BY ultimo_at DESC LIMIT 500`, params);
    const [[conteo]] = await db.query(`SELECT COUNT(*) AS total FROM wa_conversaciones WHERE estado = 'ATENDIDO'`);
    res.json({
      ok: true,
      atendidos: rows.filter((r) => r.estado === 'ATENDIDO'),
      nuevos: rows.filter((r) => r.estado === 'NUEVO'),
      blacklist: rows.filter((r) => r.estado === 'BLACKLIST'),
      totalAtendidos: Number(conteo.total || 0),
      sinResponder: rows.filter((r) => r.estado === 'NUEVO').length,
    });
  } catch (e) {
    console.error('[whatsapp] conversaciones', e);
    res.status(500).json({ ok: false, mensaje: 'No se pudieron cargar las conversaciones' });
  }
});

/** Mensajes de una conversación (y la marca como leída). */
router.get('/conversaciones/:id/mensajes', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [mensajes] = await db.query(
      `SELECT id, direccion, texto, estado_envio, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
         FROM wa_mensajes WHERE conversacion_id = ? ORDER BY id ASC LIMIT 500`, [id]);
    await db.query('UPDATE wa_conversaciones SET sin_leer = 0 WHERE id = ?', [id]);
    res.json({ ok: true, mensajes });
  } catch (e) {
    console.error('[whatsapp] mensajes', e);
    res.status(500).json({ ok: false, mensaje: 'No se pudieron cargar los mensajes' });
  }
});

/** Guarda una respuesta del Back Office; queda PENDIENTE_ENVIO hasta vincular WhatsApp. */
router.post('/conversaciones/:id/mensajes', auth(ROLES), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const texto = String(req.body?.texto || '').trim();
    if (!texto) return res.status(400).json({ ok: false, mensaje: 'Escribe un mensaje' });
    if (texto.length > 4000) return res.status(400).json({ ok: false, mensaje: 'El mensaje es demasiado largo' });
    const [conv] = await db.query('SELECT id FROM wa_conversaciones WHERE id = ? LIMIT 1', [id]);
    if (!conv[0]) return res.status(404).json({ ok: false, mensaje: 'Conversación no encontrada' });
    await db.query(
      `INSERT INTO wa_mensajes (conversacion_id, direccion, texto, estado_envio) VALUES (?, 'SALIENTE', ?, 'PENDIENTE_ENVIO')`,
      [id, texto]);
    await db.query(`UPDATE wa_conversaciones SET ultimo_mensaje = ?, ultimo_at = NOW(), estado = 'ATENDIDO' WHERE id = ?`, [texto, id]);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[whatsapp] enviar', e);
    res.status(500).json({ ok: false, mensaje: 'No se pudo guardar el mensaje' });
  }
});

/** Cambia la columna de la conversación: NUEVO, ATENDIDO o BLACKLIST. */
router.patch('/conversaciones/:id', auth(ROLES), async (req, res) => {
  try {
    const estado = String(req.body?.estado || '').toUpperCase();
    if (!ESTADOS.includes(estado)) return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
    await db.query('UPDATE wa_conversaciones SET estado = ? WHERE id = ?', [estado, Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[whatsapp] estado', e);
    res.status(500).json({ ok: false, mensaje: 'No se pudo actualizar la conversación' });
  }
});

module.exports = router;
module.exports.registrarMensajeEntrante = registrarMensajeEntrante;
