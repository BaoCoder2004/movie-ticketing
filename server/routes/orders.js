// server/routes/orders.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const REFUND_WINDOW_HOURS = Number(process.env.REFUND_WINDOW_HOURS || 2);

const ALLOWED = new Set(['pending','confirmed','expired','canceled']);
const toLowerStatus = s => {
  const v = String(s || '').trim().toLowerCase();
  return ALLOWED.has(v) ? v : '';
};

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}

function toOrderRow(o){
  return {
    id: Number(o.id),
    orderCode: o.order_code || null,
    userId: o.user_id != null ? Number(o.user_id) : null,
    userEmail: o.user_email || null,
    userName: o.user_name || null,
    status: o.status,
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    total: Number(o.total || 0),
    createdAt: o.created_at ? new Date(o.created_at).toISOString() : null,
    refundable: !!o.refundable,
  };
}

/* ===================== LIST ===================== */
router.get('/orders', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const status = toLowerStatus(req.query.status);
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 50)));
    const where = [];
    const args = [];

    if (q) {
      where.push('(o.order_code LIKE ? OR u.email LIKE ? OR u.name LIKE ?)');
      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) {
      where.push('o.status = ?');
      args.push(status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
        ${whereSql}`,
      args
    );

    const [rows] = await pool.query(
      `SELECT o.id,o.order_code,o.user_id,o.status,o.subtotal,o.discount,o.total,o.created_at,
              u.email AS user_email, u.name AS user_name,
              CASE
                WHEN o.status='confirmed' AND (
                  SELECT TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), MIN(st.start_at))
                    FROM order_items oi
                    JOIN tickets t    ON t.id = oi.ref_id AND oi.kind='TICKET'
                    JOIN showtimes st ON st.id = t.showtime_id
                   WHERE oi.order_id = o.id
                ) >= ? THEN 1 ELSE 0
              END AS refundable
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
        ${whereSql}
        ORDER BY o.id DESC
        LIMIT ? OFFSET ?`,
      [...args, REFUND_WINDOW_HOURS, pageSize, (page - 1) * pageSize]
    );

    res.json({ page, pageSize, total: Number(total || 0), items: rows.map(toOrderRow) });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ===================== DETAIL ===================== */
router.get('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  try {
    const [[o]] = await pool.query(
      `SELECT o.id,o.order_code,o.user_id,o.status,o.subtotal,o.discount,o.total,o.created_at,
              u.email AS user_email, u.name AS user_name
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
        WHERE o.id=?`,
      [id]
    );
    if (!o) return bad(res, 'NOT_FOUND', 'Order không tồn tại', 404);

    const [ticketsRows] = await pool.query(
      `SELECT t.id AS ticket_id, t.showtime_id, t.seat_id, t.qr_code, t.scanned_at, t.status AS ticket_status,
              s.row_label, s.col_number,
              st.start_at, st.end_at,
              m.title AS movie_title, r.name AS room_name
         FROM order_items oi
         JOIN tickets t    ON t.id = oi.ref_id AND oi.kind='TICKET'
         JOIN showtimes st ON st.id = t.showtime_id
         JOIN rooms r      ON r.id = st.room_id
         JOIN movies m     ON m.id = st.movie_id
         JOIN seats s      ON s.id = t.seat_id
        WHERE oi.order_id=?
        ORDER BY oi.id`,
      [id]
    );

    const [payments] = await pool.query(
      `SELECT id, provider, status, amount, created_at
         FROM payments
        WHERE order_id=?
        ORDER BY id DESC`,
      [id]
    );

    const [[timing]] = await pool.query(
      `SELECT MIN(st.start_at) AS min_start
         FROM order_items oi
         JOIN tickets t    ON t.id = oi.ref_id AND oi.kind='TICKET'
         JOIN showtimes st ON st.id = t.showtime_id
        WHERE oi.order_id=?`,
      [id]
    );
    const minStartAt = timing?.min_start ? new Date(timing.min_start).toISOString() : null;

    let refundable = false;
    if (o.status === 'confirmed' && minStartAt) {
      const hrs = (new Date(minStartAt).getTime() - Date.now()) / 36e5;
      refundable = hrs >= REFUND_WINDOW_HOURS;
    }

    res.json({
      ...toOrderRow(o),
      items: {
        tickets: ticketsRows.map(t => ({
          id: Number(t.ticket_id),
          showtimeId: Number(t.showtime_id),
          seatId: Number(t.seat_id),
          seatLabel: `${t.row_label}${t.col_number}`,
          movieTitle: t.movie_title,
          roomName: t.room_name,
          startAt: t.start_at ? new Date(t.start_at).toISOString() : null,
          endAt: t.end_at ? new Date(t.end_at).toISOString() : null,
          qrCode: t.qr_code || null,
          status: t.ticket_status || null,
          scannedAt: t.scanned_at ? new Date(t.scanned_at).toISOString() : null
        }))
      },
      payments: payments.map(p => ({
        id: Number(p.id),
        provider: p.provider,
        // DB values: INITIATED | SUCCESS | FAILED | REFUNDED
        status: String(p.status || '').toLowerCase(),
        amount: Number(p.amount || 0),
        createdAt: p.created_at ? new Date(p.created_at).toISOString() : null
      })),
      minStartAt, refundable
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ===================== CANCEL ===================== */
router.patch('/orders/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[o]] = await conn.query(
      `SELECT id,status,expires_at FROM orders WHERE id=? FOR UPDATE`,
      [id]
    );
    if (!o) { await conn.rollback(); return bad(res,'NOT_FOUND','Không tìm thấy order',404); }
    if (o.status !== 'pending') { await conn.rollback(); return bad(res,'INVALID_STATE','Chỉ hủy đơn pending',409); }

    await conn.query(
      `UPDATE orders SET status='canceled', updated_at=UTC_TIMESTAMP() WHERE id=?`,
      [id]
    );

    await conn.commit();
    res.json({ id, canceled: true });
  } catch (e) {
    await conn.rollback();
    return bad(res, 'INTERNAL', e.message, 500);
  } finally { conn.release(); }
});

/* ===================== REFUND ===================== */
router.post('/orders/:id/refund', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[o]] = await conn.query(
      `SELECT id,status,total FROM orders WHERE id=? FOR UPDATE`,
      [id]
    );
    if (!o) { await conn.rollback(); return bad(res,'NOT_FOUND','Không tìm thấy order',404); }
    if (o.status !== 'confirmed') { await conn.rollback(); return bad(res,'INVALID_STATE','Chỉ hoàn tiền đơn confirmed',409); }

    const [[timing]] = await conn.query(
      `SELECT MIN(st.start_at) AS min_start
         FROM order_items oi
         JOIN tickets t    ON t.id = oi.ref_id AND oi.kind='TICKET'
         JOIN showtimes st ON st.id = t.showtime_id
        WHERE oi.order_id=?`,
      [id]
    );
    if (timing && timing.min_start) {
      const [[okRow]] = await conn.query(
        `SELECT CASE WHEN TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), ?) >= ? THEN 1 ELSE 0 END AS ok`,
        [timing.min_start, REFUND_WINDOW_HOURS]
      );
      if (!okRow.ok) { await conn.rollback(); return bad(res,'REFUND_WINDOW_EXCEEDED',`Chỉ hoàn tiền trước ${REFUND_WINDOW_HOURS} giờ`,409); }
    }

    await conn.query(
      `UPDATE payments SET status='REFUNDED', pay_date=UTC_TIMESTAMP()
        WHERE order_id=? AND status='SUCCESS'`,
      [id]
    );

    await conn.query(
      `UPDATE orders SET status='canceled', updated_at=UTC_TIMESTAMP() WHERE id=?`,
      [id]
    );

    await conn.commit();
    res.json({ id, refunded: true, amount: Number(o.total || 0) });
  } catch (e) {
    await conn.rollback();
    return bad(res, 'INTERNAL', e.message, 500);
  } finally { conn.release(); }
});

/* ===================== APPLY VOUCHER ===================== */
/**
 * POST /api/orders/:id/apply-voucher
 * body: { code: string }
 * Yêu cầu: đơn đang pending. Voucher còn hiệu lực. Tính discount và cập nhật orders(total).
 * Bảng giả định:
 *   vouchers(id, code, type ENUM('PERCENT','AMOUNT'), value, max_discount, is_active, start_at, expiry_at, quota, per_user_limit)
 *   voucher_usages(id, voucher_id, order_id, user_id, amount, created_at)
 */
router.post('/orders/:id/apply-voucher', async (req, res) => {
  const id = Number(req.params.id);
  const code = String(req.body?.code || '').trim();
  if (!Number.isInteger(id) || id <= 0 || !code) return bad(res, 'BAD_REQUEST', 'Thiếu id hoặc code');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[o]] = await conn.query(
      `SELECT id,user_id,status,subtotal,discount,total FROM orders WHERE id=? FOR UPDATE`,
      [id]
    );
    if (!o) { await conn.rollback(); return bad(res,'NOT_FOUND','Order không tồn tại',404); }
    if (o.status !== 'pending') { await conn.rollback(); return bad(res,'INVALID_STATE','Chỉ áp voucher cho đơn pending',409); }

    const [[v]] = await conn.query(
      `SELECT id, code, type, value, COALESCE(max_discount,0) AS max_discount,
              is_active, start_at, expiry_at, COALESCE(quota,0) AS quota, COALESCE(per_user_limit,0) AS per_user_limit
         FROM vouchers
        WHERE code = ? FOR UPDATE`,
      [code]
    );
    if (!v) { await conn.rollback(); return bad(res,'INVALID_VOUCHER','Mã không tồn tại',404); }
    if (!v.is_active) { await conn.rollback(); return bad(res,'INVALID_VOUCHER','Mã đã khóa',409); }
    if (v.start_at && new Date(v.start_at) > new Date()) { await conn.rollback(); return bad(res,'INVALID_VOUCHER','Chưa đến thời gian áp dụng',409); }
    if (v.expiry_at && new Date(v.expiry_at) < new Date()) { await conn.rollback(); return bad(res,'INVALID_VOUCHER','Mã đã hết hạn',409); }

    // quota tổng và quota theo user
    const [[{ usedTotal }]] = await conn.query(
      `SELECT COUNT(*) AS usedTotal FROM voucher_usages WHERE voucher_id=?`,
      [v.id]
    );
    if (v.quota && usedTotal >= v.quota) { await conn.rollback(); return bad(res,'QUOTA_EXCEEDED','Hết lượt sử dụng',409); }

    const [[{ usedByUser }]] = await conn.query(
      `SELECT COUNT(*) AS usedByUser FROM voucher_usages WHERE voucher_id=? AND user_id=?`,
      [v.id, o.user_id]
    );
    if (v.per_user_limit && usedByUser >= v.per_user_limit) {
      await conn.rollback(); return bad(res,'USER_LIMIT_EXCEEDED','Bạn đã dùng hết lượt cho mã này',409);
    }

    // tính giảm
    const subtotal = Number(o.subtotal || 0);
    let discount = 0;
    if (v.type === 'PERCENT') {
      discount = Math.floor(subtotal * Number(v.value || 0) / 100);
      if (v.max_discount) discount = Math.min(discount, Number(v.max_discount));
    } else { // AMOUNT
      discount = Math.min(subtotal, Number(v.value || 0));
    }
    const total = Math.max(0, subtotal - discount);

    await conn.query(
      `UPDATE orders SET discount=?, total=?, updated_at=UTC_TIMESTAMP() WHERE id=?`,
      [discount, total, id]
    );

    await conn.query(
      `INSERT INTO voucher_usages(voucher_id, order_id, user_id, amount, created_at)
       VALUES(?,?,?,?,UTC_TIMESTAMP())`,
      [v.id, id, o.user_id, discount]
    );

    await conn.commit();
    res.json({ id, code: v.code, discount, total });
  } catch (e) {
    await conn.rollback();
    return bad(res, 'INTERNAL', e.message, 500);
  } finally { conn.release(); }
});

/* ===================== CONFIRM (ISSUE TICKETS) ===================== */
/**
 * POST /api/orders/:id/confirm
 * Điều kiện:
 *  - đơn pending và chưa hết hạn
 *  - có ít nhất một payment SUCCESS
 *  - đã có các ticket gắn vào order qua order_items(kind='TICKET', ref_id=tickets.id)
 * Hành động:
 *  - phát QR cho ticket chưa có, set tickets.status='ISSUED'
 *  - đổi orders.status='confirmed', confirmed_at=UTC_TIMESTAMP()
 */
router.post('/orders/:id/confirm', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[o]] = await conn.query(
      `SELECT id,status,expires_at FROM orders WHERE id=? FOR UPDATE`, [id]
    );
    if (!o) { await conn.rollback(); return bad(res,'NOT_FOUND','Không tìm thấy order',404); }
    if (o.status !== 'pending') { await conn.rollback(); return bad(res,'INVALID_STATE','Chỉ confirm đơn pending',409); }
    if (o.expires_at && new Date(o.expires_at) <= new Date()) {
      await conn.rollback(); return bad(res,'ORDER_EXPIRED','Đơn đã hết hạn',409);
    }

    const [[pOk]] = await conn.query(
      `SELECT COUNT(*) AS ok FROM payments WHERE order_id=? AND status='SUCCESS'`, [id]
    );
    if (!pOk.ok) { await conn.rollback(); return bad(res,'NO_SUCCESS_PAYMENT','Chưa có thanh toán thành công',409); }

    // lấy các ticket thuộc order
    const [tks] = await conn.query(
      `SELECT t.id, t.qr_code, t.status
         FROM order_items oi
         JOIN tickets t ON t.id = oi.ref_id AND oi.kind='TICKET'
        WHERE oi.order_id=? FOR UPDATE`,
      [id]
    );
    if (!tks.length) { await conn.rollback(); return bad(res,'NO_TICKETS','Đơn chưa có vé',409); }

    // phát QR và set ISSUED cho vé chưa phát
    for (const t of tks) {
      if (!t.qr_code || t.status !== 'ISSUED') {
        const qr = t.qr_code || `QR:${id}:${t.id}:${Date.now()}`;
        await conn.query(
          `UPDATE tickets SET qr_code=?, status='ISSUED', updated_at=UTC_TIMESTAMP() WHERE id=?`,
          [qr, t.id]
        );
      }
    }

    await conn.query(
      `UPDATE orders SET status='confirmed', confirmed_at=UTC_TIMESTAMP(), updated_at=UTC_TIMESTAMP() WHERE id=?`,
      [id]
    );

    await conn.commit();
    res.json({ id, confirmed: true, tickets: tks.length });
  } catch (e) {
    await conn.rollback();
    return bad(res, 'INTERNAL', e.message, 500);
  } finally { conn.release(); }
});

module.exports = router;
