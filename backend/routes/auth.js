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

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
