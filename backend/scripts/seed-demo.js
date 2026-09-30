/* Datos de ejemplo para desarrollo: usuarios de cada módulo y 3 contactos para el asesor demo.
   Uso (con el backend ya iniciado una vez para que existan las tablas):  npm run seed */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database');

const USUARIOS = [
  { usuario: 'demo',       nombre: 'Asesor Demo',      cargo: 'asesor',     sala: 'SALA 1', permisos: [],               clave: process.env.DEMO_PASSWORD       || 'demo1234'  },
  { usuario: 'supervisor', nombre: 'Supervisor Demo',  cargo: 'supervisor', sala: 'SALA 1', permisos: [],               clave: process.env.SUPERVISOR_PASSWORD || 'super1234' },
  { usuario: 'backoffice', nombre: 'Back Office',      cargo: 'backoffice', sala: 'SALA 1', permisos: ['seguimiento'], clave: process.env.BACKOFFICE_PASSWORD || 'back1234'  },
];

const CONTACTOS = [
  { n1: '+51 987 555 666', n2: null, wa: '@SHINNIG_ml', obs: 'Llamar después de las 16:00 hrs.', zona: 'San Juan de Lurigancho' },
  { n1: '+51 987 111 222', n2: null, wa: '@rodrigo_mdz', obs: 'Interesado en portabilidad familiar.', zona: 'Comas' },
  { n1: '+51 987 333 444', n2: null, wa: '@karla_bnz', obs: 'Pide información de fibra simétrica.', zona: 'Los Olivos' },
];

async function esperarTablas() {
  for (let i = 0; i < 30; i++) {
    try { await db.query('SELECT 1 FROM usuarios LIMIT 1'); await db.query('SELECT 1 FROM leads LIMIT 1'); return; }
    catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  throw new Error('Las tablas aún no existen: inicia el backend una vez (npm run dev) y repite.');
}

(async () => {
  await esperarTablas();
  for (const u of USUARIOS) {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE usuario = ?', [u.usuario]);
    if (existe.length) { console.log(`Ya existe: ${u.usuario}`); continue; }
    await db.query(
      `INSERT INTO usuarios (nombre, usuario, password, cargo, sala, genero, permisos) VALUES (?, ?, ?, ?, ?, 'M', ?)`,
      [u.nombre, u.usuario, bcrypt.hashSync(u.clave, 10), u.cargo, u.sala, JSON.stringify(u.permisos)]
    );
    console.log(`Usuario creado: ${u.usuario} / ${u.clave}  (${u.cargo})`);
  }

  const [[demo]] = await db.query("SELECT id, nombre FROM usuarios WHERE usuario = 'demo'");
  const [[{ cuantos }]] = await db.query('SELECT COUNT(*) AS cuantos FROM leads WHERE asesor_id = ?', [demo.id]);
  if (!cuantos) {
    for (const c of CONTACTOS) {
      await db.query(
        `INSERT INTO leads (campana, distrito, n1, n2, usuario_whatsapp, obs_back, asesor_id, asesor_nombre, fecha, hora_asig, sin_asignar)
         VALUES ('LEAD CRM', ?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_FORMAT(NOW(), '%H:%i'), 0)`,
        [c.zona, c.n1, c.n2, c.wa, c.obs, demo.id, demo.nombre]
      );
    }
    console.log(`Se asignaron ${CONTACTOS.length} contactos de ejemplo al asesor demo.`);
  }
  process.exit(0);
})().catch((err) => { console.error(err.message); process.exit(1); });
