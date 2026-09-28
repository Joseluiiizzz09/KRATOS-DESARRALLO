const express = require('express');
const { pool } = require('../database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mapLead } = require('./leads');
const { mapSale } = require('./sales');

const router = express.Router();
router.use(requireAuth, requireRole('supervisor', 'admin'));

/** Un contacto sale de "pendiente"/"nuevo" la primera vez que se gestiona. */
function isManaged(status) {
  return status && status !== 'pendiente' && status !== 'nuevo';
}

/** Asesores a cargo de este supervisor (todos, en esta versión de un solo equipo). */
router.get('/advisors', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, nombre, usuario FROM usuarios WHERE rol = 'asesor' AND activo = 1 ORDER BY nombre"
  );
  res.json({ advisors: rows });
});

/** Métricas generales del equipo y por asesor. */
router.get('/metrics', async (req, res) => {
  const [advisors] = await pool.query(
    "SELECT id, nombre FROM usuarios WHERE rol = 'asesor' AND activo = 1 ORDER BY nombre"
  );
  const [leadRows] = await pool.query(
    `SELECT assigned_advisor_id AS id, COUNT(*) AS total,
            SUM(status NOT IN ('pendiente','nuevo')) AS gestionados
     FROM leads WHERE assigned_advisor_id IS NOT NULL GROUP BY assigned_advisor_id`
  );
  const [saleRows] = await pool.query(
    `SELECT advisor_id AS id, COUNT(*) AS ventas,
            SUM(status = 'aprobada') AS aprobadas,
            SUM(status = 'rechazada') AS rechazadas
     FROM sales GROUP BY advisor_id`
  );
  const leadBy = Object.fromEntries(leadRows.map((r) => [r.id, r]));
  const saleBy = Object.fromEntries(saleRows.map((r) => [r.id, r]));

  const porAsesor = advisors.map((a) => {
    const l = leadBy[a.id] || {};
    const s = saleBy[a.id] || {};
    const total = Number(l.total || 0);
    const gestionados = Number(l.gestionados || 0);
    return {
      id: a.id,
      nombre: a.nombre,
      contactos: total,
      gestionados,
      avance: total ? Math.round((gestionados / total) * 100) : 0,
      ventas: Number(s.ventas || 0),
      aprobadas: Number(s.aprobadas || 0),
      rechazadas: Number(s.rechazadas || 0),
    };
  });

  const totales = porAsesor.reduce(
    (acc, a) => ({
      contactos: acc.contactos + a.contactos,
      gestionados: acc.gestionados + a.gestionados,
      ventas: acc.ventas + a.ventas,
      aprobadas: acc.aprobadas + a.aprobadas,
      rechazadas: acc.rechazadas + a.rechazadas,
    }),
    { contactos: 0, gestionados: 0, ventas: 0, aprobadas: 0, rechazadas: 0 }
  );

  const [[hoy]] = await pool.query(
    `SELECT COUNT(*) AS ventas,
            SUM(status = 'aprobada') AS activas,
            SUM(status = 'rechazada') AS caidas,
            COUNT(DISTINCT advisor_id) AS asesoresActivos
     FROM sales WHERE DATE(created_at) = CURDATE()`
  );

  res.json({
    porAsesor,
    totales,
    asesores: advisors.length,
    hoy: {
      ventas: Number(hoy.ventas || 0),
      activas: Number(hoy.activas || 0),
      caidas: Number(hoy.caidas || 0),
      asesoresActivos: Number(hoy.asesoresActivos || 0),
    },
  });
});

/** Base de llamadas de todos los asesores (o de uno, con ?advisorId=), solo lectura. */
router.get('/leads', async (req, res) => {
  const { advisorId, status, q } = req.query;
  const where = ['assigned_advisor_id IS NOT NULL'];
  const params = [];
  if (advisorId) { where.push('assigned_advisor_id = ?'); params.push(Number(advisorId)); }
  if (status) { where.push('status = ?'); params.push(status); }
  if (q) {
    where.push('(phone LIKE ? OR phone2 LIKE ? OR client_name LIKE ? OR zone LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const [rows] = await pool.query(
    `SELECT l.*, u.nombre AS advisor_nombre FROM leads l
     LEFT JOIN usuarios u ON u.id = l.assigned_advisor_id
     WHERE ${where.join(' AND ')} ORDER BY l.assigned_at DESC LIMIT 500`,
    params
  );
  res.json({ leads: rows.map((row) => ({ ...mapLead(row), advisor: row.advisor_nombre })) });
});

/** Ventas de todos los asesores (o de uno, con ?advisorId=). */
router.get('/sales', async (req, res) => {
  const { advisorId, status } = req.query;
  const where = [];
  const params = [];
  if (advisorId) { where.push('s.advisor_id = ?'); params.push(Number(advisorId)); }
  if (status) { where.push('s.status = ?'); params.push(status); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT s.*, u.nombre AS advisor_nombre FROM sales s
     LEFT JOIN usuarios u ON u.id = s.advisor_id
     ${clause} ORDER BY s.created_at DESC LIMIT 500`,
    params
  );
  res.json({ sales: rows.map((row) => ({ ...mapSale(row), advisor: row.advisor_nombre })) });
});

module.exports = router;
