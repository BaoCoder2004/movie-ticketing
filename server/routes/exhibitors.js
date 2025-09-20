const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

// LIST
router.get('/exhibitors', async (req, res) => {
  const q = String(req.query.search || '').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 20)));
  const where = q ? 'WHERE name LIKE ? OR code LIKE ?' : '';
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM exhibitors ${where}`, params);
  const [rows] = await pool.query(
    `SELECT id,name,code,website FROM exhibitors ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  res.json({
    page, pageSize, total,
    items: rows.map(r => ({
      id: Number(r.id),
      name: r.name,
      code: r.code || null,
      website: r.website || null
    }))
  });
});

// CREATE
router.post('/exhibitors', async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  if (!name) return bad(res, 'BAD_REQUEST', 'name bắt buộc');
  try {
    const [r] = await pool.query(
      `INSERT INTO exhibitors(name,code,website,created_at,updated_at)
       VALUES (?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
      [name, b.code || null, b.website || null]
    );
    res.json({
      id: Number(r.insertId),
      name,
      code: b.code || null,
      website: b.website || null
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// đoạn UPDATE trong server/routes/exhibitors.js
router.put('/exhibitors/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const fields = [], vals = [];
  const set = (c, v) => { fields.push(`${c}=?`); vals.push(v); };
  if (b.name !== undefined) set('name', String(b.name || '').trim());
  if (b.code !== undefined) set('code', b.code || null);
  if (b.website !== undefined) set('website', b.website || null);
  if (!fields.length) return bad(res, 'BAD_REQUEST', 'Không có trường để cập nhật');
  fields.push('updated_at=UTC_TIMESTAMP()');
  try {
    const [r] = await pool.query(
      `UPDATE exhibitors SET ${fields.join(', ')} WHERE id=?`,
      [...vals, id] // fix: trước đây là [.vals, id]
    );
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    const [[row]] = await pool.query(`SELECT id,name,code,website FROM exhibitors WHERE id=?`, [id]);
    res.json({
      id: Number(row.id),
      name: row.name,
      code: row.code || null,
      website: row.website || null
    });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// DELETE
router.delete('/exhibitors/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) cnt FROM branches WHERE exhibitor_id=?`, [id]
    );
    if (cnt > 0) return bad(res, 'EXHIBITOR_IN_USE', 'Đang có chi nhánh', 409);
    const [r] = await pool.query(`DELETE FROM exhibitors WHERE id=?`, [id]);
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không tìm thấy', 404);
    res.json({ deleted: true });
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// 📌 NEW: GET /exhibitors/:id/movies
router.get('/exhibitors/:id/movies', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');

  const [rows] = await pool.query(
    `SELECT DISTINCT m.id, m.title, m.poster_url, COUNT(st.id) AS showtimes
     FROM movies m
     JOIN showtimes st ON st.movie_id = m.id
     JOIN rooms r ON r.id = st.room_id
     JOIN branches b ON b.id = r.branch_id
     WHERE b.exhibitor_id = ?
     GROUP BY m.id, m.title, m.poster_url
     ORDER BY m.title`,
    [id]
  );
  res.json({
    items: rows.map(r => ({
      id: r.id,
      title: r.title,
      posterUrl: r.poster_url,
      showtimes: Number(r.showtimes)
    }))
  });
});

module.exports = router;
