require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDB } = require('./database');
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const salesRoutes = require('./routes/sales');
const backofficeRoutes = require('./routes/backoffice');

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '3mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

// La API no tiene pantalla: quien abra esta URL en el navegador ve a dónde ir.
app.get('/', (req, res) => {
  res.json({
    servicio: 'KRATOS API',
    estado: 'en línea',
    aplicacion: process.env.FRONTEND_URL || allowedOrigins[0],
    mensaje: 'Esto es solo la API. La aplicación se abre en la dirección de "aplicacion".',
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/backoffice', backofficeRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4001;

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`KRATOS API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
