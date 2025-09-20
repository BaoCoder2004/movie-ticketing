// server/routes/seats.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra }); // fix .extra
}

// NOTE: GET /api/rooms/:id/seats đã có trong catalog.js, giữ nguyên.
// Thêm API lưu layout toàn bộ phòng.
router.put('/rooms/:roomId/seats/layout', async (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!Number.isInteger(roomId) || roomId <= 0) return bad(res, 'BAD_REQUEST', 'roomId không hợp lệ');

  const seats = Array.isArray(req.body?.seats) ? req.body.seats : [];
  // lọc dữ liệu hợp lệ: OFF không gửi lên BE
  const clean = [];
  for (const s of seats) {
    const rl = String(s.rowLabel || '').trim().toUpperCase();
    const cn = Number(s.colNumber);
    const tp = String(s.seatType || '').toUpperCase();
    if (!rl || !Number.isInteger(cn) || cn <= 0) continue;
    if (!['STANDARD','VIP','DOUBLE'].includes(tp)) continue;
    clean.push([roomId, rl, cn, tp]);
  }
  if (clean.length === 0) return bad(res, 'BAD_REQUEST', 'Danh sách ghế trống');

  // phòng tồn tại?
  const [[room]] = await pool.query('SELECT id FROM rooms WHERE id=?', [roomId]);
  if (!room) return bad(res, 'NOT_FOUND', 'Không tìm thấy phòng', 404);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM seats WHERE room_id=?', [roomId]);

    // bulk insert
    const values = clean.map(() => '(?,?,?,?,0,UTC_TIMESTAMP(),UTC_TIMESTAMP())').join(',');
    const params = [];
    for (const [rid, rl, cn, tp] of clean) params.push(rid, rl, cn, tp);

    await conn.query(
      `INSERT INTO seats(room_id,row_label,col_number,seat_type,is_accessible,created_at,updated_at)
       VALUES ${values}`, params
    );

    await conn.commit();
    res.json({ roomId, inserted: clean.length, replaced: true });
  } catch (e) {
    await conn.rollback();
    return bad(res, 'INTERNAL', e.message, 500);
  } finally {
    conn.release();
  }
});

module.exports = router;
