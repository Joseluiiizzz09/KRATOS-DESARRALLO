const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verificarClaveInternaPrizma = require('../middleware/verificarClaveInternaPrizma');

function fechaPeruHoy() {
  const ahora = new Date();
  const peru  = new Date(ahora.getTime() + ahora.getTimezoneOffset()*60000 + (-5*60*60000));
  return peru.getFullYear()+'-'+String(peru.getMonth()+1).padStart(2,'0')+'-'+String(peru.getDate()).padStart(2,'0');
}
function horaPeruAhora() {
  const ahora = new Date();
  const peru  = new Date(ahora.getTime() + ahora.getTimezoneOffset()*60000 + (-5*60*60000));
  return String(peru.getHours()).padStart(2,'0')+':'+String(peru.getMinutes()).padStart(2,'0');
}
function normalizarN1(valor) {
  return String(valor || '').replace(/\D+/g, '');
}

async function obtenerResponsableBack() {
  const [backs] = await db.query(`
    SELECT id, nombre, usuario
    FROM usuarios
    WHERE cargo = 'backoffice' AND activo = 1
    ORDER BY RAND()
    LIMIT 1
  `);
  return backs[0] || null;
}

// POST /api/interno/lead-prizma
// Crea un lead nuevo (sin tipificar, sin asignar) a partir de un numero
// sincronizado automaticamente desde Prizma. Protegido por X-Internal-Key.
// Body: { n1, campana }
router.post('/lead-prizma', verificarClaveInternaPrizma, async (req, res) => {
  try {
    const n1 = normalizarN1(req.body?.n1);
    if (!n1) return res.status(400).json({ ok: false, mensaje: 'Falta el numero (n1)' });

    const campana  = String(req.body?.campana || 'MOV 1').trim() || 'MOV 1';
    const fechaHoy = fechaPeruHoy();

    const [existentes] = await db.query(`
      SELECT id FROM leads
      WHERE n1_normalizado = ?
        AND fecha = ? AND campana = ?
      LIMIT 1
    `, [n1, fechaHoy, campana]);
    if (existentes.length) {
      return res.json({ ok: true, ya_existia: true, id: existentes[0].id });
    }

    const responsable = await obtenerResponsableBack();
    const historial = JSON.stringify([{
      tipo: 'CARGA', cargadoPor: responsable?.nombre || 'Back Data',
      cargadoPorUsuario: responsable?.usuario || '', hora: horaPeruAhora(),
      fecha: fechaHoy, motivo: 'Sincronizacion automatica desde Prizma (SIN COBERTURA)',
      origenCarga: 'Sistema Prizma', origenUsuario: 'sistema-prizma',
      responsableAtencion: responsable?.nombre || '', asignacionAutomatica: true,
    }]);

    const [result] = await db.query(`
      INSERT INTO leads (campana, n1, fecha, sin_asignar, historial, rotaciones,
                         creado_por_id, creado_por_nombre, creado_por_usuario)
      VALUES (?, ?, ?, 1, ?, 0, ?, ?, ?)
    `, [campana, n1, fechaHoy, historial,
      responsable?.id || null, responsable?.nombre || 'Back Data', responsable?.usuario || '']);

    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error('[interno/lead-prizma] Error:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el lead' });
  }
});

// POST /api/interno/lead-whatsapp
// Registra en la Base (sin tipificar, sin asignar) a un cliente que escribio por WhatsApp,
// por numero y/o por @usuario, con la campana de la linea por la que escribio.
// Protegido por X-Internal-Key. Body: { n1?, usuario_whatsapp?, campana }
router.post('/lead-whatsapp', verificarClaveInternaPrizma, async (req, res) => {
  try {
    let n1 = normalizarN1(req.body?.n1);
    // La Base guarda el celular peruano de 9 digitos: se quita el 51 del codigo de pais
    if (n1.length === 11 && n1.startsWith('51')) n1 = n1.slice(2);
    n1 = n1.substring(0, 20);
    const usuario = String(req.body?.usuario_whatsapp || '').trim().replace(/^@+/, '').substring(0, 100);
    if (!n1 && !usuario) {
      return res.status(400).json({ ok: false, mensaje: 'Falta el numero (n1) o el usuario de WhatsApp' });
    }
    const campana = String(req.body?.campana || '').trim().substring(0, 100);
    if (!campana) return res.status(400).json({ ok: false, mensaje: 'Falta la campana' });

    const fechaHoy = fechaPeruHoy();

    // Mismo criterio de duplicado que la Base: mismo dia y misma campana
    const [existentes] = n1
      ? await db.query(`
          SELECT id FROM leads
          WHERE n1_normalizado = ? AND fecha = ? AND campana = ?
          LIMIT 1
        `, [n1, fechaHoy, campana])
      : await db.query(`
          SELECT id FROM leads
          WHERE usuario_whatsapp = ? AND fecha = ? AND campana = ?
          LIMIT 1
        `, [usuario, fechaHoy, campana]);
    if (existentes.length) {
      return res.json({ ok: true, ya_existia: true, id: existentes[0].id });
    }

    const responsable = await obtenerResponsableBack();
    const historial = JSON.stringify([{
      tipo: 'CARGA', cargadoPor: responsable?.nombre || 'Back Data',
      cargadoPorUsuario: responsable?.usuario || '', hora: horaPeruAhora(),
      fecha: fechaHoy, motivo: 'Ingreso automatico desde WhatsApp',
      origenCarga: 'WhatsApp', origenUsuario: 'sistema-whatsapp',
      responsableAtencion: responsable?.nombre || '', asignacionAutomatica: true,
    }]);

    const [result] = await db.query(`
      INSERT INTO leads (campana, n1, usuario_whatsapp, fecha, sin_asignar, historial, rotaciones,
                         creado_por_id, creado_por_nombre, creado_por_usuario)
      VALUES (?, ?, ?, ?, 1, ?, 0, ?, ?, ?)
    `, [campana, n1, usuario, fechaHoy, historial,
      responsable?.id || null, responsable?.nombre || 'Back Data', responsable?.usuario || '']);

    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error('[interno/lead-whatsapp] Error:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el lead' });
  }
});

module.exports = router;
