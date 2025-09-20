// server/routes/showtimes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

// ---------- time helpers ----------
const isMySQL = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s);
const isoToMySQL = s => {
  if (!s) return '';
  const d = s.includes('T') ? new Date(s) : new Date(s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// ---------- core query builders ----------
function buildWhere({ movieId, roomId, from, to }) {
  const where = [];
  const args = [];
  if (movieId) { where.push('st.movie_id = ?'); args.push(Number(movieId)); }
  if (roomId)  { where.push('st.room_id  = ?'); args.push(Number(roomId)); }
  if (from)    { where.push('st.start_at >= ?'); args.push(isMySQL(from) ? from : isoToMySQL(from)); }
  if (to) { // bao phủ hết giây cuối cùng
    where.push('st.start_at < DATE_ADD(?, INTERVAL 1 SECOND)');
    args.push(isMySQL(to) ? to : isoToMySQL(to));
  }
  return { whereSql: where.length ? 'WHERE ' + where.join(' AND ') : '', args };
}

const SELECT_BASE = `
  SELECT
    st.id, st.movie_id, st.room_id,
    m.title,
    r.name AS room_name,
    DATE_FORMAT(st.start_at, '%Y-%m-%d %H:%i:%s') AS start_at,
    DATE_FORMAT(st.end_at,   '%Y-%m-%d %H:%i:%s') AS end_at,
    st.base_price
  FROM showtimes st
  JOIN movies m ON m.id = st.movie_id
  JOIN rooms  r ON r.id = st.room_id
`;

// ===== LIST =====
router.get('/showtimes', async (req, res) => {
  try {
    const { whereSql, args } = buildWhere(req.query || {});
    const [rows] = await pool.query(`${SELECT_BASE} ${whereSql} ORDER BY st.start_at ASC`, args);
    res.json({ items: rows });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// Alias: /api/movies/:id/showtimes?from=&to=
router.get('/movies/:id/showtimes', async (req, res) => {
  try {
    const q = { ...(req.query || {}), movieId: req.params.id };
    const { whereSql, args } = buildWhere(q);
    const [rows] = await pool.query(`${SELECT_BASE} ${whereSql} ORDER BY st.start_at ASC`, args);
    res.json({ items: rows });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== RẠP đang chiếu phim trong khoảng thời gian =====
router.get('/movies/:id/exhibitors', async (req, res) => {
  const movieId = Number(req.params.id || 0);
  if (!movieId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'movieId không hợp lệ' });
  const from = req.query.from ? (isMySQL(req.query.from) ? req.query.from : isoToMySQL(req.query.from)) : null;
  const to   = req.query.to   ? (isMySQL(req.query.to)   ? req.query.to   : isoToMySQL(req.query.to))   : null;

  const where = ['st.movie_id = ?'];
  const args = [movieId];
  if (from) { where.push('st.start_at >= ?'); args.push(from); }
  if (to)   { where.push('st.start_at < DATE_ADD(?, INTERVAL 1 SECOND)'); args.push(to); }

  const sql = `
    SELECT e.id AS exhibitorId, e.name AS exhibitorName,
           b.id AS branchId, b.name AS branchName, b.city,
           COUNT(st.id) AS showtimes
    FROM showtimes st
    JOIN rooms r      ON r.id = st.room_id
    JOIN branches b   ON b.id = r.branch_id
    JOIN exhibitors e ON e.id = b.exhibitor_id
    WHERE ${where.join(' AND ')}
    GROUP BY e.id, e.name, b.id, b.name, b.city
    HAVING showtimes > 0
    ORDER BY e.name, b.name`;
  try {
    const [rows] = await pool.query(sql, args);
    res.json({ items: rows });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== DETAIL =====
router.get('/showtimes/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: 'BAD_REQUEST', message: 'id không hợp lệ' });
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE st.id=?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Không có suất chiếu' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== AVAILABILITY =====
router.get('/showtimes/:id/availability', async (req, res) => {
  const stId = Number(req.params.id || 0);
  if (!stId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'id không hợp lệ' });
  try {
    const [rows] = await pool.query(
      `
      SELECT s.id AS seat_id, s.row_label, s.col_number,
             CASE WHEN EXISTS (
               SELECT 1
               FROM tickets t
               JOIN order_items oi ON oi.ticket_id = t.id
               JOIN orders o ON o.id = oi.order_id
               WHERE t.showtime_id = ?
                 AND t.seat_id = s.id
                 AND (
                      o.status = 'confirmed'
                   OR (o.status = 'pending' AND (o.expires_at IS NULL OR UTC_TIMESTAMP() < o.expires_at))
                 )
             ) THEN 0 ELSE 1 END AS available
      FROM seats s
      JOIN rooms r   ON r.id = s.room_id
      JOIN showtimes st ON st.room_id = r.id
      WHERE st.id = ?
      ORDER BY s.row_label, s.col_number
      `,
      [stId, stId]
    );
    res.json({ items: rows });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== CREATE =====
router.post('/showtimes', async (req, res) => {
  const movieId = Number(req.body?.movieId);
  const roomId = Number(req.body?.roomId);
  const startAtRaw = String(req.body?.startAt || '').trim();
  const startAt = isMySQL(startAtRaw) ? startAtRaw : isoToMySQL(startAtRaw);
  const basePrice = Number(req.body?.basePrice || 90000);

  if (!movieId || !roomId || !startAt) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'movieId, roomId, startAt bắt buộc' });
  }

  try {
    const [[m]] = await pool.query(`SELECT duration_min FROM movies WHERE id=?`, [movieId]);
    if (!m) return res.status(404).json({ error: 'NOT_FOUND', message: 'Phim không tồn tại' });

    const [[{ endAt }]] = await pool.query(
      `SELECT DATE_ADD(?, INTERVAL ? MINUTE) AS endAt`, [startAt, Number(m.duration_min || 0)]
    );

    const [r] = await pool.query(
      `INSERT INTO showtimes (movie_id, room_id, start_at, end_at, base_price, created_at)
       VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [movieId, roomId, startAt, endAt, basePrice]
    );

    res.json({ id: r.insertId, movieId, roomId, startAt, endAt, basePrice });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== UPDATE =====
router.put('/showtimes/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  const movieId = Number(req.body?.movieId);
  const roomId = Number(req.body?.roomId);
  const startAtRaw = String(req.body?.startAt || '').trim();
  const startAt = isMySQL(startAtRaw) ? startAtRaw : isoToMySQL(startAtRaw);
  const basePrice = Number(req.body?.basePrice || 90000);

  if (!id || !movieId || !roomId || !startAt) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Thiếu dữ liệu hợp lệ' });
  }

  try {
    const [[m]] = await pool.query(`SELECT duration_min FROM movies WHERE id=?`, [movieId]);
    if (!m) return res.status(404).json({ error: 'NOT_FOUND', message: 'Phim không tồn tại' });

    const [[{ endAt }]] = await pool.query(
      `SELECT DATE_ADD(?, INTERVAL ? MINUTE) AS endAt`, [startAt, Number(m.duration_min || 0)]
    );

    await pool.query(
      `UPDATE showtimes
         SET movie_id=?, room_id=?, start_at=?, end_at=?, base_price=?
       WHERE id=?`,
      [movieId, roomId, startAt, endAt, basePrice, id]
    );

    res.json({ updated: true, startAt, endAt, basePrice });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

// ===== DELETE =====
router.delete('/showtimes/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.status(400).json({ error: 'BAD_REQUEST', message: 'id không hợp lệ' });
  try {
    const [r] = await pool.query(`DELETE FROM showtimes WHERE id=?`, [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy suất chiếu' });
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: 'INTERNAL', message: e.message }); }
});

module.exports = router;
