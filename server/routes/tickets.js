// server/routes/tickets.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}

// ========== LIST: GET /api/tickets ==========
router.get('/tickets', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 20));
  const status = String(req.query.status || '').toUpperCase();
  const q = String(req.query.q || '').trim();
  const dateFrom = String(req.query.dateFrom || '').trim(); // YYYY-MM-DD
  const dateTo = String(req.query.dateTo || '').trim();     // YYYY-MM-DD

  const where = [];
  const args = [];

  if (status && ['ISSUED','SCANNED'].includes(status)) {
    where.push('tk.status = ?'); args.push(status);
  }
  if (q) {
    where.push(`(
      tk.qr_code LIKE ? OR o.order_code LIKE ? OR COALESCE(u.email,'') LIKE ?
      OR COALESCE(u.phone,'') LIKE ? OR CONCAT(s.row_label, s.col_number) LIKE ?
      OR m.title LIKE ? OR r.name LIKE ? OR b.name LIKE ? OR b.city LIKE ?
    )`);
    for (let i=0;i<9;i++) args.push('%'+q+'%');
  }
  if (dateFrom && dateTo) {
    where.push('DATE(st.start_at) BETWEEN ? AND ?'); args.push(dateFrom, dateTo);
  } else if (dateFrom) {
    where.push('DATE(st.start_at) >= ?'); args.push(dateFrom);
  } else if (dateTo) {
    where.push('DATE(st.start_at) <= ?'); args.push(dateTo);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM tickets tk
       JOIN orders o ON o.id = tk.order_id
       LEFT JOIN users u ON u.id = o.user_id
       JOIN seats s ON s.id = tk.seat_id
       JOIN showtimes st ON st.id = tk.showtime_id
       JOIN rooms r ON r.id = st.room_id
       JOIN branches b ON b.id = r.branch_id
       JOIN movies m ON m.id = st.movie_id
       ${whereSql}`,
      args
    );

    const [rows] = await pool.query(
      `SELECT tk.id, tk.order_id AS orderId, o.order_code AS orderCode,
              tk.qr_code AS qrCode, tk.status, tk.scanned_at AS scannedAt,
              tk.showtime_id AS showtimeId,
              s.row_label AS rowLabel, s.col_number AS colNumber, s.seat_type AS seatType,
              st.start_at AS startAt,
              m.title AS movieTitle, r.name AS roomName,
              b.name AS branchName, b.city,
              COALESCE(u.email,'') AS email, COALESCE(u.phone,'') AS phone
       FROM tickets tk
       JOIN orders o ON o.id = tk.order_id
       LEFT JOIN users u ON u.id = o.user_id
       JOIN seats s ON s.id = tk.seat_id
       JOIN showtimes st ON st.id = tk.showtime_id
       JOIN rooms r ON r.id = st.room_id
       JOIN branches b ON b.id = r.branch_id
       JOIN movies m ON m.id = st.movie_id
       ${whereSql}
       ORDER BY tk.id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page-1)*pageSize]
    );

    res.json({
      items: rows.map(x => ({
        id: x.id,
        orderId: x.orderId,
        orderCode: x.orderCode,
        qrCode: x.qrCode,
        status: x.status,
        scannedAt: x.scannedAt ? new Date(x.scannedAt).toISOString() : null,
        showtimeId: x.showtimeId,
        seat: { row: x.rowLabel, col: x.colNumber, type: x.seatType },
        startAt: x.startAt,
        movieTitle: x.movieTitle,
        roomName: x.roomName,
        branchName: x.branchName,
        city: x.city,
        email: x.email,
        phone: x.phone
      })),
      total, page, pageSize
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// ========== ORDER: GET /api/tickets/order/:orderId ==========
router.get('/tickets/order/:orderId', async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return bad(res, 'BAD_REQUEST', 'orderId không hợp lệ');
  try {
    const [rows] = await pool.query(
      `SELECT tk.id, tk.order_id, tk.showtime_id, tk.seat_id, tk.qr_code, tk.status, tk.scanned_at,
              s.row_label, s.col_number, s.seat_type
         FROM tickets tk
         JOIN seats s ON s.id = tk.seat_id
        WHERE tk.order_id = ?
        ORDER BY tk.id`, [orderId]
    );

    let showtime = null;
    if (rows.length) {
      const stId = rows[0].showtime_id;
      const [[st]] = await pool.query(
        `SELECT st.id, st.start_at AS startAt, st.end_at AS endAt, st.base_price AS basePrice,
                m.title AS movieTitle, r.name AS roomName, b.name AS branchName, b.city
           FROM showtimes st
           JOIN movies m ON m.id = st.movie_id
           JOIN rooms r ON r.id = st.room_id
           JOIN branches b ON b.id = r.branch_id
          WHERE st.id = ?`, [stId]
      );
      showtime = st || null;
    }

    return res.json({
      orderId,
      showtime,
      items: rows.map(t => ({
        id: Number(t.id),
        showtimeId: Number(t.showtime_id),
        seatId: Number(t.seat_id),
        qrCode: t.qr_code,
        status: t.status,
        scannedAt: t.scanned_at ? new Date(t.scanned_at).toISOString() : null,
        seat: { row: t.row_label, col: t.col_number, type: t.seat_type }
      }))
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// ========== SCAN: POST /api/tickets/scan ==========
router.post('/tickets/scan', async (req, res) => {
  const showtimeId = Number(req.body?.showtimeId);
  const qrCode = String(req.body?.qrCode || '').trim().toUpperCase();
  if (!showtimeId || !qrCode) return bad(res, 'BAD_REQUEST', 'showtimeId và qrCode là bắt buộc');

  try {
    const [upd] = await pool.query(
      `UPDATE tickets
          SET status='SCANNED', scanned_at=UTC_TIMESTAMP()
        WHERE showtime_id=? AND qr_code=? AND status='ISSUED'`,
      [showtimeId, qrCode]
    );

    if (upd.affectedRows === 1) {
      const [[t]] = await pool.query(
        `SELECT tk.id, tk.order_id, tk.showtime_id, tk.seat_id, tk.status, tk.scanned_at, tk.qr_code,
                s.row_label, s.col_number, s.seat_type
           FROM tickets tk
           JOIN seats s ON s.id = tk.seat_id
          WHERE tk.showtime_id=? AND tk.qr_code=?
          LIMIT 1`, [showtimeId, qrCode]
      );
      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        id: Number(t.id),
        orderId: Number(t.order_id),
        showtimeId: Number(t.showtime_id),
        seatId: Number(t.seat_id),
        status: t.status,
        scannedAt: t.scanned_at ? new Date(t.scanned_at).toISOString() : null,
        qrCode: t.qr_code,
        seat: { row: t.row_label, col: t.col_number, type: t.seat_type }
      });
    }

    const [[ex]] = await pool.query(
      `SELECT tk.id, tk.order_id, tk.status, tk.scanned_at
         FROM tickets tk
        WHERE tk.showtime_id=? AND tk.qr_code=?
        LIMIT 1`, [showtimeId, qrCode]
    );
    if (!ex) return bad(res, 'NOT_FOUND', 'Không tìm thấy vé', 404);
    if (ex.status === 'SCANNED' || ex.scanned_at) return bad(res, 'ALREADY_SCANNED', 'Vé đã quét rồi', 409);
    return bad(res, 'INVALID_STATE', `Trạng thái vé không hợp lệ: ${ex.status}`, 409);
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// ========== STATUS: GET /api/tickets/status ==========
router.get('/tickets/status', async (req, res) => {
  const showtimeId = Number(req.query.showtimeId);
  const qr = String(req.query.qr || '').trim().toUpperCase();
  if (!showtimeId || !qr) return bad(res, 'BAD_REQUEST', 'showtimeId và qr là bắt buộc');

  try {
    const [[t]] = await pool.query(
      `SELECT tk.id, tk.order_id, tk.seat_id, tk.status, tk.scanned_at,
              s.row_label, s.col_number, s.seat_type
         FROM tickets tk
         JOIN seats s ON s.id = tk.seat_id
        WHERE tk.showtime_id=? AND tk.qr_code=?
        LIMIT 1`, [showtimeId, qr]
    );
    if (!t) return bad(res, 'NOT_FOUND', 'Không tìm thấy vé', 404);

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      found: true,
      status: t.status,
      ticket: {
        id: Number(t.id),
        orderId: Number(t.order_id),
        seatId: Number(t.seat_id),
        scannedAt: t.scanned_at ? new Date(t.scanned_at).toISOString() : null,
        seat: { row: t.row_label, col: t.col_number, type: t.seat_type }
      }
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

module.exports = router;
