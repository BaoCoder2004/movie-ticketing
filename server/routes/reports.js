// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const isISO = s => typeof s === 'string' && !Number.isNaN(Date.parse(s));
const bad = (res, m) => res.status(400).json({ error: 'BAD_REQUEST', message: m });
const isoToMy = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const P = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${P(d.getUTCMonth()+1)}-${P(d.getUTCDate())} ${P(d.getUTCHours())}:${P(d.getUTCMinutes())}:${P(d.getUTCSeconds())}`;
};

// Ping để kiểm tra đã mount
router.get('/reports/ping', (_req, res) => res.json({ ok: true }));

// SUMMARY
router.get('/reports/summary', async (req, res) => {
  const { from, to } = req.query;
  if (!isISO(from) || !isISO(to)) return bad(res, 'from/to required ISO8601');
  const F = isoToMy(from), T = isoToMy(to);
  try {
    const [[{ gross=0 }]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) gross
         FROM payments WHERE status='SUCCESS'
           AND COALESCE(pay_date, created_at) BETWEEN ? AND ?`, [F, T]);
    const [[{ refunded=0 }]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) refunded
         FROM payments WHERE status='REFUNDED'
           AND COALESCE(ipn_at, created_at) BETWEEN ? AND ?`, [F, T]);
    const [[{ sold=0 }]] = await pool.query(
      `SELECT COUNT(*) sold FROM tickets
        WHERE status IN ('ISSUED','SCANNED') AND created_at BETWEEN ? AND ?`, [F, T]);
    const [[{ cnt=0 }]] = await pool.query(
      `SELECT COUNT(*) cnt FROM orders
        WHERE status='PAID' AND created_at BETWEEN ? AND ?`, [F, T]);
    res.json({
      from, to,
      gross_revenue: Number(gross),
      refund_total: Number(refunded),
      net_revenue: Number(gross) - Number(refunded),
      tickets_sold: Number(sold),
      orders_count: Number(cnt)
    });
  } catch (e) { res.status(500).json({ error:'INTERNAL', message:e.message }); }
});

// DAILY
router.get('/reports/daily', async (req, res) => {
  const { from, to } = req.query;
  if (!isISO(from) || !isISO(to)) return bad(res, 'from/to required ISO8601');
  const F = isoToMy(from), T = isoToMy(to);
  try {
    const [pSuc] = await pool.query(
      `SELECT DATE(COALESCE(pay_date, created_at)) d, SUM(amount) v
         FROM payments WHERE status='SUCCESS'
           AND COALESCE(pay_date, created_at) BETWEEN ? AND ?
        GROUP BY DATE(COALESCE(pay_date, created_at))`, [F, T]);
    const [pRef] = await pool.query(
      `SELECT DATE(COALESCE(ipn_at, created_at)) d, SUM(amount) v
         FROM payments WHERE status='REFUNDED'
           AND COALESCE(ipn_at, created_at) BETWEEN ? AND ?
        GROUP BY DATE(COALESCE(ipn_at, created_at))`, [F, T]);
    const [tDay] = await pool.query(
      `SELECT DATE(created_at) d, COUNT(*) v
         FROM tickets WHERE status IN ('ISSUED','SCANNED')
           AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)`, [F, T]);
    const [oDay] = await pool.query(
      `SELECT DATE(created_at) d, COUNT(*) v
         FROM orders WHERE status='PAID'
           AND created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)`, [F, T]);

    const map = new Map();
    const add = (rows, key) => rows.forEach(r => {
      const d = r.d instanceof Date ? r.d.toISOString().slice(0,10) : String(r.d);
      const o = map.get(d) || { date:d, gross:0, refund:0, net:0, tickets:0, orders:0 };
      o[key] = Number(r.v||0); map.set(d, o);
    });
    add(pSuc,'gross'); add(pRef,'refund'); add(tDay,'tickets'); add(oDay,'orders');
    res.json([...map.values()].map(o => ({ ...o, net:o.gross-o.refund }))
      .sort((a,b)=>a.date.localeCompare(b.date)));
  } catch (e) { res.status(500).json({ error:'INTERNAL', message:e.message }); }
});

// OCCUPANCY
router.get('/reports/occupancy', async (req, res) => {
  const { date } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))) return bad(res,'date required YYYY-MM-DD');
  const F = `${date} 00:00:00`, T = `${date} 23:59:59`;
  try {
    const [rows] = await pool.query(
      `SELECT sh.id showtime_id, m.title movie_title, sh.start_at,
              r.capacity, COALESCE(COUNT(t.id),0) sold,
              CASE WHEN r.capacity=0 THEN 0 ELSE COALESCE(COUNT(t.id),0)/r.capacity END occ
         FROM showtimes sh
         JOIN movies m ON m.id=sh.movie_id
         JOIN rooms r  ON r.id=sh.room_id
    LEFT JOIN tickets t ON t.showtime_id=sh.id AND t.status IN ('ISSUED','SCANNED')
        WHERE sh.start_at BETWEEN ? AND ?
        GROUP BY sh.id, m.title, sh.start_at, r.capacity
        ORDER BY sh.start_at`, [F, T]);
    res.json(rows.map(r => ({
      showtime_id:Number(r.showtime_id),
      movie_title:r.movie_title,
      starts_at:new Date(r.start_at).toISOString(),
      sold:Number(r.sold||0),
      capacity:Number(r.capacity||0),
      occupancy:Number(r.occ||0)
    })));
  } catch (e) { res.status(500).json({ error:'INTERNAL', message:e.message }); }
});

// TOP MOVIES
router.get('/reports/top-movies', async (req, res) => {
  const { from, to } = req.query;
  if (!isISO(from) || !isISO(to)) return bad(res, 'from/to required ISO8601');
  const F = isoToMy(from), T = isoToMy(to);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
  try {
    const [rows] = await pool.query(
      `SELECT m.id movie_id, m.title, COUNT(t.id) tickets_sold
         FROM tickets t
         JOIN showtimes s ON s.id=t.showtime_id
         JOIN movies m ON m.id=s.movie_id
        WHERE t.status IN ('ISSUED','SCANNED') AND t.created_at BETWEEN ? AND ?
        GROUP BY m.id, m.title
        ORDER BY tickets_sold DESC, m.title ASC
        LIMIT ?`, [F, T, limit]);
    res.json(rows.map(r => ({
      movie_id:Number(r.movie_id), title:r.title, tickets_sold:Number(r.tickets_sold||0)
    })));
  } catch (e) { res.status(500).json({ error:'INTERNAL', message:e.message }); }
});

module.exports = router;
