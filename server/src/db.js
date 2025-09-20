// server/src/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  timezone: 'Z',          // ép UTC
  dateStrings: true,      // trả về DATETIME dạng "YYYY-MM-DD HH:MM:SS"
  waitForConnections: true,
  connectionLimit: 10,
});

(async () => {
  try { await pool.query("SET time_zone = '+00:00'"); } catch {}
})();

module.exports = { pool };
