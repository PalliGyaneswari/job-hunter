require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'hayabusa.proxy.rlwy.net',
  port:               parseInt(process.env.DB_PORT || '13739'),
  database:           process.env.DB_NAME     || 'railway',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'MKdlinbqvDQFnNJyVVafGDCCkOFXHXiZ',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  charset:            'utf8mb4',
});

// Verify connectivity at startup
pool.getConnection()
  .then(conn => {
    console.log('[DB] MySQL connection pool established');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Failed to connect to MySQL:', err.message);
    console.error('[DB] Make sure MySQL is running and DB_* env vars are set correctly.');
    process.exit(1);
  });

module.exports = pool;
