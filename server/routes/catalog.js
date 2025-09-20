// server/routes/catalog.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db'); // mysql2/promise

// helpers
const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

const pad = n => (n < 10 ? '0' + n : '' + n);
function toMySQLDateTime(input) {
  if (!input) return null;
  const d = new Date(input);           // nhận '2025-09-18T17:00:00.000Z'
  if (isNaN(d)) return null;
  // xuất UTC -> 'YYYY-MM-DD HH:MM:SS'
  return (
    d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' +
    pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
  );
}
function range(q) {
  return { from: toMySQLDateTime(q.from), to: toMySQLDateTime(q.to) };
}

// --- Seats theo phòng ---
router.get('/rooms/:id/seats', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'roomId không hợp lệ');
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.row_label, s.col_number, s.seat_type, s.is_accessible
         FROM seats s
        WHERE s.room_id = ?
        ORDER BY s.row_label, s.col_number`,
      [id]
    );
    res.json(rows);
  } catch (e) { bad(res, 'SERVER_ERROR', e.message, 500); }
});

// --- Rooms theo rạp (exhibitor) ---
router.get('/exhibitors/:id/rooms', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'exhibitorId không hợp lệ');
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.name, r.format_type, r.capacity, r.is_active,
              b.id AS branch_id, b.name AS branch_name, b.city
         FROM rooms r
         JOIN branches b ON b.id = r.branch_id
        WHERE b.exhibitor_id = ?
        ORDER BY b.city, b.name, r.name`,
      [id]
    );
    res.json(rows);
  } catch (e) { bad(res, 'SERVER_ERROR', e.message, 500); }
});

// --- Suất chiếu theo phim + khoảng thời gian ---
router.get('/movies/:id/showtimes', async (req, res) => {
  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) return bad(res, 'BAD_REQUEST', 'movieId không hợp lệ');
  const { from, to } = range(req.query);
  try {
    const [rows] = await pool.query(
      `SELECT st.id, st.room_id, st.movie_id, st.start_at, st.end_at, st.base_price,
              r.name AS room_name, r.format_type,
              b.id AS branch_id, b.name AS branch_name, b.city,
              ex.id AS exhibitor_id, ex.name AS exhibitor_name
         FROM showtimes st
         JOIN rooms r    ON r.id = st.room_id
         JOIN branches b ON b.id = r.branch_id
         JOIN exhibitors ex ON ex.id = b.exhibitor_id
        WHERE st.movie_id = ?
          AND (? IS NULL OR st.start_at >= ?)
          AND (? IS NULL OR st.start_at <= ?)
        ORDER BY st.start_at ASC`,
      [movieId, from, from, to, to]
    );
    res.json({
      items: rows.map(x => ({
        id: Number(x.id),
        roomId: Number(x.room_id),
        movieId,
        startAt: x.start_at,
        endAt: x.end_at,
        basePrice: Number(x.base_price),
        roomName: x.room_name,
        formatType: x.format_type,
        branchId: Number(x.branch_id),
        branchName: x.branch_name,
        city: x.city,
        exhibitorId: Number(x.exhibitor_id),
        exhibitorName: x.exhibitor_name
      }))
    });
  } catch (e) { bad(res, 'SERVER_ERROR', e.message, 500); }
});

// --- Rạp/Chi nhánh đang chiếu phim + khoảng thời gian ---
router.get('/movies/:id/exhibitors', async (req, res) => {
  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) return bad(res, 'BAD_REQUEST', 'movieId không hợp lệ');
  const { from, to } = range(req.query);
  try {
    const [rows] = await pool.query(
      `SELECT ex.id   AS exhibitor_id, ex.name AS exhibitor_name,
              b.id    AS branch_id,   b.name  AS branch_name, b.city,
              COUNT(st.id) AS showtimes
         FROM showtimes st
         JOIN rooms r    ON r.id = st.room_id
         JOIN branches b ON b.id = r.branch_id
         JOIN exhibitors ex ON ex.id = b.exhibitor_id
        WHERE st.movie_id = ?
          AND (? IS NULL OR st.start_at >= ?)
          AND (? IS NULL OR st.start_at <= ?)
        GROUP BY ex.id, ex.name, b.id, b.name, b.city
        ORDER BY ex.name, b.city, b.name`,
      [movieId, from, from, to, to]
    );
    res.json({
      items: rows.map(x => ({
        exhibitorId: Number(x.exhibitor_id),
        exhibitorName: x.exhibitor_name,
        branchId: Number(x.branch_id),
        branchName: x.branch_name,
        city: x.city,
        showtimes: Number(x.showtimes)
      }))
    });
  } catch (e) { bad(res, 'SERVER_ERROR', e.message, 500); }
});

module.exports = router;
