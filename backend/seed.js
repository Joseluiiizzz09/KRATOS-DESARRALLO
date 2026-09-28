/* Datos de arranque para desarrollo: un asesor y unos contactos de ejemplo asignados.
   En el flujo real, Back Office crea usuarios y asigna contactos; este script solo
   sirve para probar el Portal Asesor mientras esa pantalla no existe todavía. */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, initDB } = require('./database');

async function seed() {
  await initDB();

  const usuario = 'demo';
  const [existing] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
  let advisorId = existing[0]?.id;

  if (!advisorId) {
    const hash = await bcrypt.hash('demo1234', 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)',
      ['Asesor Demo', usuario, hash, 'asesor']
    );
    advisorId = result.insertId;
    console.log('Usuario creado: demo / demo1234');
  } else {
    console.log('Usuario "demo" ya existía, se reutiliza.');
  }

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM leads WHERE assigned_advisor_id = ?',
    [advisorId]
  );
  if (total > 0) {
    console.log(`El asesor demo ya tiene ${total} contactos asignados; no se agregan más.`);
  } else {
    // whatsapp_user es el nombre de usuario de WhatsApp (p. ej. @usuario), no el teléfono
    const contactos = [
      ['+51 987 111 222', '@rodrigo_mdz', 'Miraflores', 'Av. Larco 1150, Miraflores', 'LLAMANDO', 'Interesado en portabilidad familiar.'],
      ['+51 987 333 444', '@karla_bnz', 'Surco', 'Jr. Monterrey 250, Santiago de Surco', null, 'Pide información de fibra simétrica.'],
      ['+51 987 555 666', '@SHINNIG_ml', 'Callao', 'Av. Sáenz Peña 480, Callao', 'BUZON DE VOZ', 'Llamar después de las 16:00 hrs.'],
    ];
    for (const [phone, whatsappUser, zone, address, tipificacion, backNotes] of contactos) {
      await pool.query(
        `INSERT INTO leads (id, phone, whatsapp_user, zone, address, tipificacion, back_notes, status, assigned_advisor_id, assigned_at, management_history)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, NOW(), '[]')`,
        [crypto.randomUUID(), phone, whatsappUser, zone, address, tipificacion, backNotes, advisorId]
      );
    }
    console.log(`Se asignaron ${contactos.length} contactos de ejemplo al asesor demo.`);
  }

  const [[bo]] = await pool.query("SELECT COUNT(*) AS n FROM usuarios WHERE usuario = 'backoffice'");
  if (!bo.n) {
    // La contraseña no se escribe en el código: sale de BACKOFFICE_PASSWORD (.env) o, si falta, se genera al azar y se muestra una sola vez.
    const password = process.env.BACKOFFICE_PASSWORD || crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)', ['Back Office', 'backoffice', hash, 'backoffice']);
    console.log(`Usuario creado: backoffice / ${password}${process.env.BACKOFFICE_PASSWORD ? '' : ' (generada al azar; guárdala, no se repetirá)'}`);
  }

  const [[sup]] = await pool.query("SELECT COUNT(*) AS n FROM usuarios WHERE usuario = 'supervisor'");
  if (!sup.n) {
    const password = process.env.SUPERVISOR_PASSWORD || crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)', ['Supervisor Demo', 'supervisor', hash, 'supervisor']);
    console.log(`Usuario creado: supervisor / ${password}${process.env.SUPERVISOR_PASSWORD ? '' : ' (generada al azar; guárdala, no se repetirá)'}`);
  }

  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
