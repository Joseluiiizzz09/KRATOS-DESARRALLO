/* ================================================
   DATABASE.JS — MySQL con mysql2 (mismo patrón que PRIZMA)
   ================================================ */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kratos',
  waitForConnections: true,
  connectionLimit: 20,
  timezone: '-05:00', // Perú, igual que PRIZMA (afecta cómo el driver serializa parámetros de fecha)
  dateStrings: true,
});

/* CURRENT_TIMESTAMP lo evalúa el servidor según su propia zona horaria, no el driver:
   se fija explícitamente por conexión para que no dependa de dónde corra el servidor MySQL. */
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '-05:00'");
});

/* ── Crear tablas si no existen ── */
async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        usuario VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(30) NOT NULL DEFAULT 'asesor',
        activo TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(40) PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        phone2 VARCHAR(30) DEFAULT NULL,
        whatsapp_user VARCHAR(60) DEFAULT NULL,
        client_name VARCHAR(150) DEFAULT NULL,
        campaign VARCHAR(120) DEFAULT NULL,
        zone VARCHAR(150) DEFAULT NULL,
        coordinates VARCHAR(60) DEFAULT NULL,
        back_notes TEXT DEFAULT NULL,
        advisor_note TEXT DEFAULT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'pendiente',
        document_type VARCHAR(10) DEFAULT NULL,
        document_number VARCHAR(40) DEFAULT NULL,
        assigned_advisor_id INT DEFAULT NULL,
        assigned_at DATETIME DEFAULT NULL,
        management_history JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_advisor_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(40) PRIMARY KEY,
        folio VARCHAR(60) NOT NULL,
        advisor_id INT NOT NULL,
        client_name VARCHAR(150) NOT NULL,
        client_phone VARCHAR(30) NOT NULL,
        reference_phone VARCHAR(30) DEFAULT NULL,
        document_type VARCHAR(10) DEFAULT NULL,
        document_number VARCHAR(40) DEFAULT NULL,
        sale_type VARCHAR(60) DEFAULT NULL,
        product_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(40) NOT NULL DEFAULT 'en_verificacion',
        notes TEXT DEFAULT NULL,
        lead_id VARCHAR(40) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (advisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    /* Columnas añadidas después de la primera versión: CREATE TABLE IF NOT EXISTS no las agrega
       a una tabla que ya existe, así que se comprueban una a una (compatible con MySQL y MariaDB). */
    await ensureColumn(conn, 'leads', 'address', 'VARCHAR(250) DEFAULT NULL');
    await ensureColumn(conn, 'leads', 'tipificacion', 'VARCHAR(40) DEFAULT NULL');
    await ensureColumn(conn, 'leads', 'back2', 'VARCHAR(40) DEFAULT NULL');
    await ensureColumn(conn, 'leads', 'rotations', 'INT NOT NULL DEFAULT 0');
    await ensureColumn(conn, 'leads', 'bo_history', 'JSON DEFAULT NULL');
    await ensureColumn(conn, 'leads', 'department', 'VARCHAR(80) DEFAULT NULL');
    await ensureColumn(conn, 'leads', 'province', 'VARCHAR(80) DEFAULT NULL');
    /* Seguimiento postventa (Back Office) */
    await ensureColumn(conn, 'sales', 'tracking_status', "VARCHAR(40) NOT NULL DEFAULT 'en_ejecucion'");
    await ensureColumn(conn, 'sales', 'reason', 'VARCHAR(80) DEFAULT NULL');
    await ensureColumn(conn, 'sales', 'comment', 'TEXT DEFAULT NULL');
    await ensureColumn(conn, 'sales', 'sot', 'VARCHAR(60) DEFAULT NULL');
    await ensureColumn(conn, 'sales', 'scheduled_date', 'DATE DEFAULT NULL');
    await ensureColumn(conn, 'sales', 'slot', 'VARCHAR(10) DEFAULT NULL');
    await ensureColumn(conn, 'sales', 'tracking_history', 'JSON DEFAULT NULL');
  } finally {
    conn.release();
  }
}

async function ensureColumn(conn, table, column, definition) {
  const [rows] = await conn.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  if (!rows.length) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

module.exports = { pool, initDB };
