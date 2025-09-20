// server/routes/payments.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../src/db');

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}

/* ========== LIST PAYMENTS ==========
   GET /api/payments?status=&provider=&q=&page=1&pageSize=20
   Cột tồn tại: id, order_id, provider, ref_code, merchant_txn_ref, amount, currency,
                status, payload, created_at, bank_code, pay_date, client_ip,
                ipn_verified, ipn_at, fail_reason
*/
router.get('/payments', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const status = String(req.query.status || '').trim();
    const provider = String(req.query.provider || '').trim();
    const q = String(req.query.q || '').trim();

    const where = [];
    const args = [];
    if (status) { where.push(`p.status = ?`); args.push(status); }
    if (provider) { where.push(`p.provider = ?`); args.push(provider); }
    if (q) {
      // tìm theo order_id, ref_code, merchant_txn_ref, bank_code, client_ip, email, phone
      where.push(`(CAST(p.order_id AS CHAR) LIKE ?
                  OR IFNULL(p.ref_code,'') LIKE ?
                  OR IFNULL(p.merchant_txn_ref,'') LIKE ?
                  OR IFNULL(p.bank_code,'') LIKE ?
                  OR IFNULL(p.client_ip,'') LIKE ?
                  OR IFNULL(u.email,'') LIKE ?
                  OR IFNULL(u.phone,'') LIKE ?)`);
      for (let i = 0; i < 7; i++) args.push(`%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.order_id            AS orderId,
         p.provider,
         p.status,
         p.amount,
         p.currency,
         p.bank_code           AS bankCode,
         p.pay_date            AS payDate,
         p.created_at          AS createdAt,
         p.merchant_txn_ref    AS txnRef,
         p.ref_code            AS refCode,
         p.client_ip           AS clientIp,
         IFNULL(u.email,'')    AS email,
         IFNULL(u.phone,'')    AS phone
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       LEFT JOIN users  u ON u.id = o.user_id
       ${whereSql}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, offset]
    );

    const [[cnt]] = await pool.query(
      `SELECT COUNT(1) AS total
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       LEFT JOIN users  u ON u.id = o.user_id
       ${whereSql}`, args
    );

    res.json({ items: rows, total: Number(cnt.total || 0), page, pageSize });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ========== PAYMENT DETAIL ==========
   GET /api/payments/:id
   Trả kèm order cơ bản và tickets nếu có.
*/
router.get('/payments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[p]] = await pool.query(
      `SELECT
         p.id, p.order_id AS orderId, p.provider, p.status, p.amount, p.currency,
         p.bank_code AS bankCode, p.pay_date AS payDate, p.created_at AS createdAt,
         p.merchant_txn_ref AS merchantTxnRef, p.ref_code AS refCode,
         p.client_ip AS clientIp, p.fail_reason AS failReason
       FROM payments p
       WHERE p.id=?`, [id]
    );
    if (!p) return bad(res, 'NOT_FOUND', 'Payment không tồn tại', 404);

    const [[o]] = await pool.query(
      `SELECT
         o.id, o.order_code AS orderCode, o.status, o.total, o.created_at AS createdAt,
         u.email, u.phone
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id=?`, [p.orderId]
    );

    const [tickets] = await pool.query(
      `SELECT t.id, t.qr_code AS qrCode, t.status,
              s.row_label AS rowLabel, s.col_number AS colNumber, s.seat_type AS seatType
       FROM tickets t
       LEFT JOIN seats s ON s.id = t.seat_id
       WHERE t.order_id=?`, [p.orderId]
    );

    res.json({
      payment: p,
      order: {
        id: o?.id || null,
        orderCode: o?.orderCode || null,
        status: o?.status || null,
        total: o?.total || 0,
        createdAt: o?.createdAt || null,
        email: o?.email || '',
        phone: o?.phone || '',
        tickets
      }
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ========== VNPay helpers (khớp .env: VNPAY_*) ========== */
const cfg = {
  vnpUrl:     process.env.VNPAY_URL        || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  tmnCode:    process.env.VNPAY_TMN_CODE   || '',
  hashSecret: process.env.VNPAY_HASH_SECRET|| '',
  returnUrl:  process.env.VNPAY_RETURN_URL || 'http://localhost:5173/vnpay-return',
  locale:     process.env.VNPAY_LOCALE     || 'vn',
  currCode:   'VND'
};
function sortObject(o){ return Object.keys(o).sort().reduce((r,k)=>{ r[k]=o[k]; return r; },{}); }
function hmac512(secret, data){ return crypto.createHmac('sha512', secret).update(Buffer.from(data,'utf-8')).digest('hex'); }
function buildVNPayUrl({ amount, ip, orderId }) {
  const txnRef = 'V' + Date.now().toString(36).toUpperCase();
  const d = new Date();
  const ymdHMS = (x)=> x.getUTCFullYear().toString()
    + String(x.getUTCMonth()+1).padStart(2,'0')
    + String(x.getUTCDate()).padStart(2,'0')
    + String(x.getUTCHours()).padStart(2,'0')
    + String(x.getUTCMinutes()).padStart(2,'0')
    + String(x.getUTCSeconds()).padStart(2,'0');
  const params = {
    vnp_Version:'2.1.0', vnp_Command:'pay', vnp_TmnCode:cfg.tmnCode,
    vnp_Amount: Math.round(Number(amount)*100).toString(), vnp_CurrCode: cfg.currCode,
    vnp_TxnRef: txnRef, vnp_OrderInfo: `ORDER_${orderId}`, vnp_OrderType:'other',
    vnp_Locale: cfg.locale, vnp_ReturnUrl: cfg.returnUrl, vnp_IpAddr: ip || '0.0.0.0',
    vnp_CreateDate: ymdHMS(d),
  };
  const ord = sortObject(params);
  const raw = Object.entries(ord).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
  const vnp_SecureHash = hmac512(cfg.hashSecret, raw);
  return { payUrl: `${cfg.vnpUrl}?${raw}&vnp_SecureHash=${vnp_SecureHash}`, txnRef };
}
function verifyVNPaySignature(q){
  const x = { ...q };
  const secure = x.vnp_SecureHash || x.vnp_SecureHashType || '';
  delete x.vnp_SecureHash; delete x.vnp_SecureHashType;
  const raw = Object.entries(sortObject(x)).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
  return String(secure).toLowerCase() === hmac512(cfg.hashSecret, raw).toLowerCase();
}

/* ========== VNPay: tạo link ==========
   POST /api/payments/vnpay/create { orderId }
*/
router.post('/payments/vnpay/create', async (req, res) => {
  const orderId = Number(req.body?.orderId || 0);
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  try {
    const [[o]] = await pool.query(`SELECT id,status,total FROM orders WHERE id=?`, [orderId]);
    if (!o) return bad(res, 'NOT_FOUND', 'Order không tồn tại', 404);
    if (o.status === 'PAID') return bad(res, 'ORDER_PAID', 'Order đã thanh toán', 409);

    const { payUrl, txnRef } = buildVNPayUrl({ amount: Number(o.total || 0), ip, orderId });
    await pool.query(
      `INSERT INTO payments (order_id, provider, merchant_txn_ref, amount, currency, status, client_ip, created_at)
       VALUES (?, 'VNPAY', ?, ?, 'VND', 'INITIATED', ?, UTC_TIMESTAMP())`,
      [orderId, txnRef, o.total, ip]
    );
    res.json({ payUrl, txnRef });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ========== VNPay return ==========
   GET /api/payments/vnpay/return?... (VNPay redirect)
*/
router.get('/payments/vnpay/return', async (req, res) => {
  const q = req.query || {};
  try {
    if (!verifyVNPaySignature(q)) return bad(res, 'INVALID_SIG', 'Invalid signature', 400);
    const txnRef = String(q.vnp_TxnRef || '');
    const responseCode = String(q.vnp_ResponseCode || '');
    const orderId = Number((q.vnp_OrderInfo || '').replace(/^ORDER_/,'') || 0);
    const bankCode = String(q.vnp_BankCode || '');
    const payDateStr = String(q.vnp_PayDate || ''); // yyyymmddHHMMSS

    const payDate = payDateStr
      ? new Date(Date.UTC(
          Number(payDateStr.slice(0,4)),
          Number(payDateStr.slice(4,6))-1,
          Number(payDateStr.slice(6,8)),
          Number(payDateStr.slice(8,10)),
          Number(payDateStr.slice(10,12)),
          Number(payDateStr.slice(12,14))
        ))
      : null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[p]] = await conn.query(`SELECT * FROM payments WHERE merchant_txn_ref=? FOR UPDATE`, [txnRef]);
      if (!p) { await conn.rollback(); return bad(res, 'PAY_NOT_FOUND', 'Payment không tồn tại', 404); }

      if (responseCode === '00') {
        await conn.query(
          `UPDATE payments SET status='SUCCESS', bank_code=?, pay_date=? WHERE id=?`,
          [bankCode || null, payDate || null, p.id]
        );
        await conn.query(`UPDATE orders SET status='PAID' WHERE id=?`, [p.order_id || orderId]);
      } else {
        await conn.query(
          `UPDATE payments SET status='FAILED', fail_reason=? WHERE id=?`,
          [responseCode, p.id]
        );
        await conn.query(`UPDATE orders SET status='CANCELLED' WHERE id=?`, [p.order_id || orderId]);
      }
      await conn.commit();
      return res.json({ orderId: p.order_id || orderId, status: responseCode === '00' ? 'PAID' : 'FAILED' });
    } catch (e) {
      try { await conn.rollback(); } catch {}
      return bad(res, 'INTERNAL', e.message, 500);
    } finally {
      conn.release();
    }
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

/* ========== VNPay IPN ==========
   GET /api/payments/vnpay/ipn?... (server-to-server)
*/
router.get('/payments/vnpay/ipn', async (req, res) => {
  const q = req.query || {};
  function done(code, msg){ return res.json({ RspCode: code, Message: msg }); }
  try {
    const valid = verifyVNPaySignature(q);
    const txnRef = String(q.vnp_TxnRef || '');
    const responseCode = String(q.vnp_ResponseCode || '');
    const orderId = Number((q.vnp_OrderInfo || '').replace(/^ORDER_/,'') || 0);
    const bankCode = String(q.vnp_BankCode || '');
    const payDate = null; // VNPay đã có ở "return"; có thể parse như trên nếu cần

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[p]] = await conn.query(`SELECT * FROM payments WHERE merchant_txn_ref=? FOR UPDATE`, [txnRef]);
      if (!p) { await conn.rollback(); return done('01','Order not found'); }

      await conn.query(
        `INSERT INTO payment_ipn_logs (payment_id, query_raw, signature_valid, response_code)
         VALUES (?, ?, ?, ?)`,
        [p.id, JSON.stringify(q), valid ? 1 : 0, responseCode]
      );
      if (!valid) { await conn.commit(); return done('97','Invalid signature'); }

      if (responseCode === '00') {
        await conn.query(
          `UPDATE payments SET status='SUCCESS', bank_code=?, pay_date=IFNULL(pay_date, UTC_TIMESTAMP()), ipn_verified=1, ipn_at=UTC_TIMESTAMP() WHERE id=?`,
          [bankCode || null, p.id]
        );
        await conn.query(`UPDATE orders SET status='PAID' WHERE id=?`, [p.order_id || orderId]);
        await conn.commit();
        return done('00','Confirm Success');
      } else {
        await conn.query(
          `UPDATE payments SET status='FAILED', fail_reason=?, ipn_verified=1, ipn_at=UTC_TIMESTAMP() WHERE id=?`,
          [responseCode, p.id]
        );
        await conn.query(`UPDATE orders SET status='CANCELLED' WHERE id=?`, [p.order_id || orderId]);
        await conn.commit();
        return done('24','Failed');
      }
    } catch (e) {
      try { await conn.rollback(); } catch {}
      return done('99', 'Unknown error');
    } finally {
      conn.release();
    }
  } catch (e) {
    return done('99','Unknown error');
  }
});

module.exports = router;
