const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const HOLD_MIN = Number(process.env.HOLD_MINUTES || 10);

function bad(res, code, message, extra = {}, status = 400) {
  return res.status(status).json({ error: code, message, ...extra });
}

function formatDatetimeUTC(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

router.post('/holds', async (req, res) => {
  const { showtimeId, seatIds, userId = null } = req.body || {};
  const showId = Number(showtimeId);
  const seatIdsClean = Array.from(new Set((seatIds || []).map(Number)))
    .filter(n => Number.isInteger(n) && n > 0);

  if (!showId || seatIdsClean.length === 0) {
    return bad(res, 'BAD_REQUEST', 'showtimeId và seatIds là bắt buộc');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const inMarks = seatIdsClean.map(() => '?').join(',');

    await conn.execute(
      `DELETE FROM seat_holds 
       WHERE expire_at <= UTC_TIMESTAMP() AND showtime_id = ? AND seat_id IN (${inMarks})`,
      [showId, ...seatIdsClean]
    );

    const [heldRows] = await conn.execute(
      `SELECT seat_id, 'HELD' AS reason 
         FROM seat_holds 
        WHERE showtime_id = ? AND seat_id IN (${inMarks})`,
      [showId, ...seatIdsClean]
    );

    const [ticketRows] = await conn.execute(
      `SELECT seat_id, 'TICKETED' AS reason 
         FROM tickets 
        WHERE showtime_id = ? AND seat_id IN (${inMarks})
          AND status IN ('ISSUED','SCANNED')`,
      [showId, ...seatIdsClean]
    );

    const conflicts = [...heldRows, ...ticketRows].map(r => ({
      seatId: Number(r.seat_id),
      reason: r.reason
    }));
    if (conflicts.length > 0) {
      await conn.rollback();
      return bad(res, 'SEATS_UNAVAILABLE', 'Một hoặc nhiều ghế không khả dụng', { conflicts }, 409);
    }

    // ✅ Tính expire_at đúng chuẩn UTC DATETIME
    const expireAtStr = formatDatetimeUTC(new Date(Date.now() + HOLD_MIN * 60000));
    const values = seatIdsClean.map(seatId => [showId, seatId, userId, expireAtStr]);
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');

    await conn.execute(
      `INSERT INTO seat_holds (showtime_id, seat_id, user_id, expire_at) VALUES ${placeholders}`,
      values.flat()
    );

    const [created] = await conn.execute(
      `SELECT id, seat_id AS seatId, expire_at AS expireAt 
         FROM seat_holds 
        WHERE showtime_id = ? AND seat_id IN (${inMarks})`,
      [showId, ...seatIdsClean]
    );

    await conn.commit();

    const items = created.map(r => ({
      id: Number(r.id),
      seatId: Number(r.seatId),
      expireAt: new Date(r.expireAt).toISOString()
    }));
    return res.json({ showtimeId: showId, created: items, holdMinutes: HOLD_MIN });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    return bad(res, 'INTERNAL', e.message, {}, 500);
  } finally {
    conn.release();
  }
});

router.get('/holds', async (req, res) => {
  const showtimeId = Number(req.query.showtimeId);
  if (!showtimeId) return bad(res, 'BAD_REQUEST', 'showtimeId là bắt buộc');
  try {
    await pool.execute(
      `DELETE FROM seat_holds WHERE expire_at <= UTC_TIMESTAMP() AND showtime_id = ?`,
      [showtimeId]
    );
    const [rows] = await pool.execute(
      `SELECT id, seat_id AS seatId, expire_at AS expireAt 
         FROM seat_holds 
        WHERE showtime_id = ? AND expire_at > UTC_TIMESTAMP()
        ORDER BY expire_at, seat_id`,
      [showtimeId]
    );
    const now = Date.now();
    const holds = rows.map(r => {
      const exp = new Date(r.expireAt);
      const remainingSec = Math.max(0, Math.floor((exp.getTime() - now) / 1000));
      return { id: Number(r.id), seatId: Number(r.seatId), expireAt: exp.toISOString(), remainingSec };
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ showtimeId, holds });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, {}, 500);
  }
});

router.delete('/holds/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');
  try {
    const [r] = await pool.execute(`DELETE FROM seat_holds WHERE id = ?`, [id]);
    res.json({ deleted: Number(r.affectedRows || 0) });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, {}, 500);
  }
});

module.exports = router;
