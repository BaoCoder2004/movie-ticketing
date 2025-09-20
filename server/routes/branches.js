// server/routes/branches.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

// LIST
router.get('/branches', async (req, res) => {
  const exhibitorId = req.query.exhibitorId ? Number(req.query.exhibitorId) : null;
  const q = String(req.query.search || '').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 50)));
  const where = [], params = [];
  if (exhibitorId) { where.push('b.exhibitor_id=?'); params.push(exhibitorId); }
  if (q) { where.push('(b.name LIKE ? OR b.city LIKE ? OR b.address LIKE ?)'); params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM branches b ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT b.id,b.exhibitor_id,b.name,b.city,b.address,b.latitude,b.longitude,b.is_active
       FROM branches b
      ${whereSql}
      ORDER BY b.city ASC, b.name ASC
      LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  res.json({
    page, pageSize, total,
    items: rows.map(r => ({
      id: Number(r.id),
      exhibitorId: Number(r.exhibitor_id),
      name: r.name,
      city: r.city || null,
      address: r.address || null,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
      isActive: !!r.is_active
    }))
  });
});

// DETAIL
router.get('/branches/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [[r]] = await pool.query(
    `SELECT id,exhibitor_id,name,city,address,latitude,longitude,is_active FROM branches WHERE id=?`, [id]
  );
  if (!r) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
  res.json({
    id: Number(r.id),
    exhibitorId: Number(r.exhibitor_id),
    name: r.name, city: r.city || null, address: r.address || null,
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
    isActive: !!r.is_active
  });
});

// CREATE
router.post('/branches', async (req, res) => {
  const b = req.body || {};
  const exhibitorId = Number(b.exhibitorId || 0);
  const name = String(b.name || '').trim();
  const city = b.city || null;
  if (!exhibitorId || !name || !city) return bad(res, 'BAD_REQUEST', 'exhibitorId, name, city bắt buộc');

  // xác thực FK
  const [[ex]] = await pool.query('SELECT id FROM exhibitors WHERE id=?', [exhibitorId]);
  if (!ex) return bad(res, 'EXHIBITOR_NOT_FOUND', 'exhibitorId không tồn tại', 400);

  try {
    const [r] = await pool.query(
      `INSERT INTO branches(exhibitor_id,name,city,address,latitude,longitude,is_active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
      [
        exhibitorId,
        name,
        city,
        b.address || null,
        b.latitude === '' || b.latitude === null || b.latitude === undefined ? null : Number(b.latitude),
        b.longitude === '' || b.longitude === null || b.longitude === undefined ? null : Number(b.longitude),
        b.isActive === false ? 0 : 1
      ]
    );
    const id = Number(r.insertId);
    const [[row]] = await pool.query(
      `SELECT id,exhibitor_id,name,city,address,latitude,longitude,is_active FROM branches WHERE id=?`, [id]
    );
    res.json({
      id,
      exhibitorId: Number(row.exhibitor_id),
      name: row.name,
      city: row.city,
      address: row.address,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      isActive: !!row.is_active
    });
  } catch (e) {
    if (e && (e.code === 'ER_NO_REFERENCED_ROW_2' || e.errno === 1452))
      return bad(res, 'EXHIBITOR_NOT_FOUND', 'exhibitorId không tồn tại', 400);
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// UPDATE
router.put('/branches/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const fields = [], vals = [];
  const set = (c, v) => { fields.push(`${c}=?`); vals.push(v); };

  if (b.exhibitorId !== undefined) {
    const newEx = Number(b.exhibitorId || 0);
    if (!newEx) return bad(res, 'BAD_REQUEST', 'exhibitorId phải hợp lệ');
    const [[ex]] = await pool.query('SELECT id FROM exhibitors WHERE id=?', [newEx]);
    if (!ex) return bad(res, 'EXHIBITOR_NOT_FOUND', 'exhibitorId không tồn tại', 400);
    set('exhibitor_id', newEx);
  }
  if (b.name !== undefined) set('name', String(b.name || '').trim());
  if (b.city !== undefined) set('city', b.city || null);
  if (b.address !== undefined) set('address', b.address || null);
  if (b.latitude !== undefined) set('latitude', b.latitude === '' || b.latitude === null ? null : Number(b.latitude));
  if (b.longitude !== undefined) set('longitude', b.longitude === '' || b.longitude === null ? null : Number(b.longitude));
  if (b.isActive !== undefined) set('is_active', b.isActive ? 1 : 0);
  if (!fields.length) return bad(res, 'BAD_REQUEST', 'Không có trường để cập nhật');

  fields.push('updated_at=UTC_TIMESTAMP()');

  try {
    const [r] = await pool.query(`UPDATE branches SET ${fields.join(', ')} WHERE id=?`, [...vals, id]);
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    const [[row]] = await pool.query(
      `SELECT id,exhibitor_id,name,city,address,latitude,longitude,is_active FROM branches WHERE id=?`, [id]
    );
    res.json({
      id: Number(row.id),
      exhibitorId: Number(row.exhibitor_id),
      name: row.name,
      city: row.city,
      address: row.address,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      isActive: !!row.is_active
    });
  } catch (e) {
    if (e && (e.code === 'ER_NO_REFERENCED_ROW_2' || e.errno === 1452))
      return bad(res, 'EXHIBITOR_NOT_FOUND', 'exhibitorId không tồn tại', 400);
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// DELETE
router.delete('/branches/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) cnt FROM rooms WHERE branch_id=?`, [id]);
    if (cnt > 0) return bad(res, 'BRANCH_IN_USE', 'Đang có phòng chiếu', 409);
    const [r] = await pool.query(`DELETE FROM branches WHERE id=?`, [id]);
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    res.json({ deleted: true });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

module.exports = router;
