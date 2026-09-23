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
    const contactos = [
      ['+51 987 111 222', 'Miraflores', 'Interesado en portabilidad familiar.'],
      ['+51 987 333 444', 'Surco', 'Pide información de fibra simétrica.'],
      ['+51 987 555 666', 'Callao', 'Llamar después de las 16:00 hrs.'],
    ];
    for (const [phone, zone, backNotes] of contactos) {
      await pool.query(
        `INSERT INTO leads (id, phone, whatsapp_user, zone, back_notes, status, assigned_advisor_id, assigned_at, management_history)
         VALUES (?, ?, ?, ?, ?, 'pendiente', ?, NOW(), '[]')`,
        [crypto.randomUUID(), phone, phone, zone, backNotes, advisorId]
      );
    }
    console.log(`Se asignaron ${contactos.length} contactos de ejemplo al asesor demo.`);
  }

  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
