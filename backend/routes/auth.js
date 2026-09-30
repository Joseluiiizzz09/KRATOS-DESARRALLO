const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) {
    return res.status(422).json({ error: 'Ingresa usuario y contraseña.' });
  }

  const [rows] = await pool.query(
    'SELECT id, nombre, usuario, password, rol FROM usuarios WHERE usuario = ? AND activo = 1 LIMIT 1',
    [usuario]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const token = jwt.sign(
    { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } });
});

/** Sesión única con KRONO: canjea el token de KRONO (firmado con KRONO_JWT_SECRET) por uno de KRATOS.
 *  Jefatura puede entrar como otro usuario enviando "como". Si el usuario no existe en KRATOS, se crea. */
const ROL_DESDE_CARGO = { asesor: 'asesor', supervisor: 'supervisor', backoffice: 'backoffice', jefatura: 'admin' };

router.post('/krono', async (req, res) => {
  const { token: kronoToken, como } = req.body || {};
  const secreto = process.env.KRONO_JWT_SECRET;
  if (!secreto || !kronoToken) return res.status(422).json({ error: 'Sesión de KRONO no disponible.' });

  let datos;
  try {
    datos = jwt.verify(kronoToken, secreto);
  } catch {
    return res.status(401).json({ error: 'Sesión de KRONO inválida o vencida.' });
  }

  let usuario = datos.usuario;
  let nombre = datos.usuario;
  let cargo = datos.cargo;
  if (como && datos.cargo === 'jefatura') {
    const [dest] = await require('../database').pool.query(
      `SELECT nombre, usuario, cargo FROM \`${process.env.KRONO_DB_NAME || 'krono_local'}\`.usuarios WHERE usuario = ? LIMIT 1`, [como]);
    if (dest[0]) ({ usuario, nombre, cargo } = dest[0]);
  }

  const rol = ROL_DESDE_CARGO[cargo];
  if (!rol) return res.status(403).json({ error: 'Tu cargo no tiene acceso a este portal.' });

  let [rows] = await pool.query('SELECT id, nombre, usuario, rol FROM usuarios WHERE usuario = ? AND activo = 1 LIMIT 1', [usuario]);
  if (!rows[0]) {
    const aleatoria = await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10);
    await pool.query('INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)', [nombre, usuario, aleatoria, rol]);
    [rows] = await pool.query('SELECT id, nombre, usuario, rol FROM usuarios WHERE usuario = ? LIMIT 1', [usuario]);
  }
  const user = rows[0];
  const token = jwt.sign(
    { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
