/* ================================================
   ROUTES/AUTH.JS — MySQL
   ================================================ */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');

// Hash señuelo para comparar contra usuarios que no existen: sin esto, un
// usuario inexistente responde de inmediato mientras que uno real siempre
// corre bcrypt (~100ms), permitiendo enumerar usuarios validos por timing.
const HASH_SEÑUELO = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Xo8ph8oT2CpV6UEwbBAM0LqNjSGXG';

// KRATOS: si KRATOS_DB_NAME está definido, los usuarios de KRATOS entran también
// aquí (misma clave) y se registran en esta base con el cargo equivalente.
const CARGO_DESDE_ROL_KRATOS = { asesor: 'asesor', supervisor: 'supervisor', backoffice: 'backoffice', admin: 'jefatura' };

async function sincronizarDesdeKratos(usuario, password) {
  const kdb = process.env.KRATOS_DB_NAME;
  if (!kdb || !/^\w+$/.test(kdb)) return false;
  try {
    const [k] = await db.query(
      `SELECT nombre, usuario, password, rol, activo FROM \`${kdb}\`.usuarios WHERE usuario = ?`, [usuario]);
    if (!k.length || !k[0].activo || !bcrypt.compareSync(password, k[0].password)) return false;
    const cargo = CARGO_DESDE_ROL_KRATOS[k[0].rol];
    if (!cargo) return false;
    const permisos = cargo === 'backoffice' ? '["seguimiento"]' : '[]';
    await db.query(`
      INSERT INTO usuarios (nombre, usuario, password, cargo, sala, genero, permisos)
      VALUES (?, ?, ?, ?, 'SALA 1', 'M', ?)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password), cargo = VALUES(cargo), activo = 1,
        permisos = IF(permisos IS NULL OR permisos IN ('', '[]'), VALUES(permisos), permisos)
    `, [k[0].nombre, k[0].usuario, k[0].password, cargo, permisos]);
    return true;
  } catch (e) {
    console.error('Sincronización con KRATOS falló:', e.message);
    return false;
  }
}

router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password)
      return res.status(400).json({ ok: false, mensaje: 'Usuario y contraseña son obligatorios' });

    const consultarUsuario = () => db.query(`
      SELECT id, nombre, usuario, password, cargo, sala, genero, activo, permisos
      FROM usuarios WHERE usuario = ?
    `, [usuario.trim().toLowerCase()]);

    let [rows] = await consultarUsuario();
    if (!rows.length || !bcrypt.compareSync(password, rows[0].password)) {
      if (await sincronizarDesdeKratos(usuario.trim().toLowerCase(), password)) [rows] = await consultarUsuario();
    }

    if (!rows.length) {
      bcrypt.compareSync(password, HASH_SEÑUELO);
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
    const u = rows[0];
    if (!u.activo) return res.status(403).json({ ok: false, mensaje: 'Cuenta desactivada. Contacta a jefatura.' });

    const passwordOk = bcrypt.compareSync(password, u.password);
    if (!passwordOk) return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });

    let permisos = [];
    try { permisos = JSON.parse(u.permisos || '[]'); } catch(e) {}

    const token = jwt.sign(
      { id: u.id, usuario: u.usuario, cargo: u.cargo, sala: u.sala, permisos },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true, token,
      usuario: { id: u.id, nombre: u.nombre, usuario: u.usuario, cargo: u.cargo, sala: u.sala||'', genero: u.genero||'M', permisos }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error en el servidor' });
  }
});

router.get('/verificar', require('../middleware/auth')([]), (req, res) => {
  res.json({ ok: true, usuario: req.user });
});

module.exports = router;