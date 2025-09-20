// server/routes/vouchers.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}
function isoToMysql(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
function mapRow(r) {
  return {
    id: r.id,
    code: r.code,
    kind: r.kind,
    value: Number(r.value),
    minTotal: Number(r.min_total),
    expiryAt: r.expiry_at ? new Date(r.expiry_at).toISOString() : null,
    quota: r.quota == null ? null : Number(r.quota),
    perUserLimit: Number(r.per_user_limit),
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ 0,O,1,I
function randomCode(len = 10) {
  let s = '';
  for (let i = 0; i < len; i++) s += ABC[Math.floor(Math.random()*ABC.length)];
  return s;
}
async function uniqueCode(conn, len = 10, maxTry = 8) {
  for (let i = 0; i < maxTry; i++) {
    const code = randomCode(len);
    const [[ex]] = await conn.query(`SELECT id FROM vouchers WHERE code=? LIMIT 1`, [code]);
    if (!ex) return code;
  }
  throw new Error('GEN_CODE_FAILED');
}

// GET /api/vouchers
router.get('/vouchers', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 100));
  const q = String(req.query.q || '').trim();
  const active = String(req.query.active || '').toLowerCase();

  const where = [];
  const args = [];
  if (q) { where.push('(code LIKE ?)'); args.push('%'+q+'%'); }
  if (active === 'true') where.push('is_active=1');
  if (active === 'false') where.push('is_active=0');
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM vouchers ${whereSql}`, args);
    const [rows] = await pool.query(
      `SELECT * FROM vouchers ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...args, pageSize, (page-1)*pageSize]
    );
    res.json({ items: rows.map(mapRow), total, page, pageSize });
  } catch (e) { return bad(res, 'INTERNAL', e.message, 500); }
});

// GET /api/vouchers/:id
router.get('/vouchers/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');
  try {
    const [[r]] = await pool.query(`SELECT * FROM vouchers WHERE id=?`, [id]);
    if (!r) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    res.json(mapRow(r));
  } catch (e) { return bad(res, 'INTERNAL', e.message, 500); }
});

// POST /api/vouchers  (code có thể bỏ trống -> random duy nhất)
router.post('/vouchers', async (req, res) => {
  const b = req.body || {};
  const kind = String(b.kind || '').toUpperCase();
  const value = Number(b.value || 0);
  const minTotal = Number(b.minTotal || 0);
  const expiryAt = isoToMysql(b.expiryAt || null);
  const quota = b.quota === null || b.quota === '' || b.quota === undefined ? null : Number(b.quota);
  const perUserLimit = Number(b.perUserLimit || 1);
  const isActive = !!b.isActive;

  if (!['AMOUNT','PERCENT'].includes(kind)) return bad(res, 'BAD_REQUEST', 'kind không hợp lệ');
  if (!(value > 0)) return bad(res, 'BAD_REQUEST', 'value phải > 0');
  if (kind === 'PERCENT' && value > 100) return bad(res, 'BAD_REQUEST', 'percent ≤ 100');
  if (minTotal < 0) return bad(res, 'BAD_REQUEST', 'minTotal không hợp lệ');
  if (!(perUserLimit >= 1)) return bad(res, 'BAD_REQUEST', 'perUserLimit ≥ 1');

  const conn = await pool.getConnection();
  try {
    const codeIn = String(b.code || '').trim().toUpperCase();
    const code = codeIn || await uniqueCode(conn, 10);

    const [r] = await conn.query(
      `INSERT INTO vouchers (code, kind, value, min_total, expiry_at, quota, per_user_limit, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [code, kind, value, minTotal, expiryAt, quota, perUserLimit, isActive ? 1 : 0]
    );
    res.status(201).json({ id: Number(r.insertId), code });
  } catch (e) {
    if (String(e.code) === 'ER_DUP_ENTRY') return bad(res, 'DUPLICATE', 'Code đã tồn tại', 409);
    if (e.message === 'GEN_CODE_FAILED') return bad(res, 'INTERNAL', 'Không tạo được code ngẫu nhiên', 500);
    return bad(res, 'INTERNAL', e.message, 500);
  } finally { conn.release(); }
});

// PUT /api/vouchers/:id
router.put('/vouchers/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  const b = req.body || {};
  const fields = [];
  const args = [];

  if (b.code !== undefined) {
    const c = String(b.code || '').trim().toUpperCase();
    if (!c) return bad(res, 'BAD_REQUEST', 'code không được rỗng');
    fields.push('code=?'); args.push(c);
  }
  if (b.kind !== undefined) {
    const k = String(b.kind).toUpperCase();
    if (!['AMOUNT','PERCENT'].includes(k)) return bad(res, 'BAD_REQUEST', 'kind không hợp lệ');
    fields.push('kind=?'); args.push(k);
  }
  if (b.value !== undefined) {
    const v = Number(b.value);
    if (!(v > 0)) return bad(res, 'BAD_REQUEST', 'value phải > 0');
    fields.push('value=?'); args.push(v);
  }
  if (b.minTotal !== undefined) {
    const mt = Number(b.minTotal);
    if (mt < 0) return bad(res, 'BAD_REQUEST', 'minTotal không hợp lệ');
    fields.push('min_total=?'); args.push(mt);
  }
  if (b.expiryAt !== undefined) { fields.push('expiry_at=?'); args.push(isoToMysql(b.expiryAt)); }
  if (b.quota !== undefined) {
    const q = b.quota === null || b.quota === '' ? null : Number(b.quota);
    fields.push('quota=?'); args.push(q);
  }
  if (b.perUserLimit !== undefined) {
    const pu = Number(b.perUserLimit);
    if (!(pu >= 1)) return bad(res, 'BAD_REQUEST', 'perUserLimit ≥ 1');
    fields.push('per_user_limit=?'); args.push(pu);
  }
  if (b.isActive !== undefined) { fields.push('is_active=?'); args.push(b.isActive ? 1 : 0); }
  if (!fields.length) return bad(res, 'BAD_REQUEST', 'Không có trường cập nhật');

  try {
    const [r] = await pool.query(
      `UPDATE vouchers SET ${fields.join(', ')}, updated_at=UTC_TIMESTAMP() WHERE id=?`,
      [...args, id]
    );
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.code) === 'ER_DUP_ENTRY') return bad(res, 'DUPLICATE', 'Code đã tồn tại', 409);
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// DELETE /api/vouchers/:id  (chặn xoá nếu đã được dùng)
router.delete('/vouchers/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  try {
    const [[v]] = await pool.query(`SELECT id FROM vouchers WHERE id=?`, [id]);
    if (!v) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);

    const [[u]] = await pool.query(`SELECT COUNT(*) AS usedCnt FROM voucher_usages WHERE voucher_id=?`, [id]);
    if (u && Number(u.usedCnt) > 0) return bad(res, 'IN_USE', 'Voucher đã được sử dụng, không thể xoá', 409);

    await pool.query(`DELETE FROM vouchers WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (e) { return bad(res, 'INTERNAL', e.message, 500); }
});

module.exports = router;
