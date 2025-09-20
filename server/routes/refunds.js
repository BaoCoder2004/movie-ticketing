const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}

const REFUND_WINDOW_HOURS = Number(process.env.REFUND_WINDOW_HOURS || 2);

router.post('/refunds', async (req, res) => {
  const orderId = Number(req.body?.orderId);
  const reason = String(req.body?.reason || 'user_request');
  if (!orderId) return bad(res, 'BAD_REQUEST', 'orderId là bắt buộc');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[o]] = await conn.query(
      `SELECT id, status, total FROM orders WHERE id = ? FOR UPDATE`,
      [orderId]
    );
    if (!o) { await conn.rollback(); return bad(res, 'NOT_FOUND', 'Order không tồn tại', 404); }
    if (o.status !== 'PAID') { await conn.rollback(); return bad(res, 'ORDER_STATE', `Trạng thái không hợp lệ: ${o.status}`, 409); }

    const [tks] = await conn.query(
      `SELECT id, seat_id AS seatId, showtime_id AS showtimeId, status
         FROM tickets WHERE order_id = ? FOR UPDATE`,
      [orderId]
    );
    if (tks.length === 0) { await conn.rollback(); return bad(res, 'NO_TICKETS', 'Order không có vé'); }

    const scanned = tks.filter(t => t.status === 'SCANNED').map(t => Number(t.seatId));
    if (scanned.length) { await conn.rollback(); return bad(res, 'TICKET_SCANNED', 'Có vé đã quét', 409, { seatIds: scanned }); }

    const showIds = [...new Set(tks.map(t => Number(t.showtimeId)))];
    const [stTimes] = await conn.query(
      `SELECT id, start_at, TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), start_at) AS min_left
         FROM showtimes WHERE id IN (?)`,
      [showIds]
    );
    const minLeft = Math.min(...stTimes.map(r => Number(r.min_left)));
    if (minLeft <= REFUND_WINDOW_HOURS * 60) {
      await conn.rollback();
      return bad(res, 'WINDOW_CLOSED', 'Hết hạn hoàn tiền (< REFUND_WINDOW_HOURS)', 409, { minutesLeft: minLeft });
    }

    const idsToRefund = tks.filter(t => t.status === 'ISSUED').map(t => Number(t.id));
    if (idsToRefund.length) {
      await conn.query(
        `UPDATE tickets SET status = 'REFUNDED' WHERE id IN (?)`,
        [idsToRefund]
      );
    }

    await conn.query(
      `UPDATE orders SET status = 'REFUNDED' WHERE id = ?`,
      [orderId]
    );

    await conn.query(
      `UPDATE payments
         SET status = 'REFUNDED', ipn_at = UTC_TIMESTAMP()
       WHERE order_id = ? AND status = 'SUCCESS'`,
      [orderId]
    );

    await conn.commit();
    return res.json({
      orderId,
      status: 'REFUNDED',
      refundedTickets: tks.filter(t => t.status === 'ISSUED').map(t => ({ id: Number(t.id), seatId: Number(t.seatId) })),
      refundAmount: Number(o.total || 0),
      currency: 'VND',
      reason
    });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    return bad(res, 'INTERNAL', e.message, 500);
  } finally {
    conn.release();
  }
});

module.exports = router;
