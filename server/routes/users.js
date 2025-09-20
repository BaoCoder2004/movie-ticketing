// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

const normEmail = (e) => String(e || '').trim().toLowerCase();
const normStr = (s) => String(s || '').trim();

// ---------- Helpers ----------
async function getUser(id) {
  const [[u]] = await pool.query(
    `SELECT id,name,email,phone,role,is_active,created_at FROM users WHERE id=?`,
    [id]
  );
  return u || null;
}
function toDto(u) {
  return {
    id: Number(u.id),
    email: u.email,
    fullName: u.name,
    phone: u.phone,
    role: u.role,
    isActive: !!u.is_active,
    createdAt: u.created_at,
  };
}

// ---------- Admin: list/search ----------
router.get('/users', async (req, res) => {
  const q = normStr(req.query.q || '');
  const where = [];
  const args = [];
  if (q) {
    where.push(`(email LIKE ? OR name LIKE ? OR phone LIKE ?)`);
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT id,name,email,phone,role,is_active,created_at
     FROM users ${whereSql}
     ORDER BY id DESC LIMIT 500`,
    args
  );
  res.json({ items: rows.map(toDto) });
});

// ---------- Admin: create ----------
router.post('/users', async (req, res) => {
  const email = normEmail(req.body?.email);
  const name = normStr(req.body?.fullName || req.body?.name);
  const phone = normStr(req.body?.phone || null) || null;
  const role = String(req.body?.role || 'USER').toUpperCase();
  const isActive = req.body?.isActive === false ? 0 : 1;
  const rawPwd = normStr(req.body?.password);
  const validRole = new Set(['ADMIN', 'STAFF', 'USER']);
  if (!email || !name) return bad(res, 'BAD_REQUEST', 'email, fullName bắt buộc');
  if (!validRole.has(role)) return bad(res, 'BAD_REQUEST', 'role không hợp lệ');

  const [[e1]] = await pool.query(`SELECT id FROM users WHERE email=?`, [email]);
  if (e1) return bad(res, 'EMAIL_EXISTS', 'Email đã tồn tại', 409);
  if (phone) {
    const [[p1]] = await pool.query(`SELECT id FROM users WHERE phone=?`, [phone]);
    if (p1) return bad(res, 'PHONE_EXISTS', 'Số điện thoại đã tồn tại', 409);
  }

  const tempPassword = rawPwd || Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(tempPassword, 10);

  const [r] = await pool.query(
    `INSERT INTO users(name,email,phone,password_hash,role,is_active,created_at,updated_at)
     VALUES(?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
    [name, email, phone, hash, role, isActive]
  );
  const u = await getUser(r.insertId);
  res.json({ ...toDto(u), tempPassword });
});

// ---------- Admin: update/toggle ----------
router.put('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');
  const u = await getUser(id);
  if (!u) return bad(res, 'NOT_FOUND', 'Không tìm thấy user', 404);

  const sets = [];
  const args = [];

  if (req.body?.email !== undefined) {
    const email = normEmail(req.body.email);
    if (!email) return bad(res, 'BAD_REQUEST', 'email không hợp lệ');
    const [[e2]] = await pool.query(`SELECT id FROM users WHERE email=? AND id<>?`, [email, id]);
    if (e2) return bad(res, 'EMAIL_EXISTS', 'Email đã tồn tại', 409);
    sets.push('email=?'); args.push(email);
  }
  if (req.body?.fullName !== undefined || req.body?.name !== undefined) {
    const name = normStr(req.body.fullName ?? req.body.name);
    if (!name) return bad(res, 'BAD_REQUEST', 'fullName không hợp lệ');
    sets.push('name=?'); args.push(name);
  }
  if (req.body?.phone !== undefined) {
    const phone = normStr(req.body.phone || null) || null;
    if (phone) {
      const [[p2]] = await pool.query(`SELECT id FROM users WHERE phone=? AND id<>?`, [phone, id]);
      if (p2) return bad(res, 'PHONE_EXISTS', 'Số điện thoại đã tồn tại', 409);
    }
    sets.push('phone=?'); args.push(phone);
  }
  if (req.body?.role !== undefined) {
    const role = String(req.body.role || '').toUpperCase();
    if (!['ADMIN', 'STAFF', 'USER'].includes(role)) return bad(res, 'BAD_REQUEST', 'role không hợp lệ');
    sets.push('role=?'); args.push(role);
  }
  if (req.body?.isActive !== undefined) {
    sets.push('is_active=?'); args.push(req.body.isActive ? 1 : 0);
  }
  if (req.body?.password) {
    const hash = await bcrypt.hash(String(req.body.password), 10);
    sets.push('password_hash=?'); args.push(hash);
  }
  if (!sets.length) return bad(res, 'BAD_REQUEST', 'Không có thay đổi');

  sets.push('updated_at=UTC_TIMESTAMP()');
  args.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=?`, args);
  const nu = await getUser(id);
  res.json(toDto(nu));
});

// ---------- Admin: delete ----------
router.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return bad(res, 'BAD_REQUEST', 'id không hợp lệ');
  const u = await getUser(id);
  if (!u) return bad(res, 'NOT_FOUND', 'Không tìm thấy user', 404);
  await pool.query(`DELETE FROM users WHERE id=?`, [id]); // orders.user_id ON DELETE SET NULL
  res.json({ ok: true });
});

// ---------- Public: register ----------
router.post('/users/register', async (req, res) => {
  const name = normStr(req.body?.name);
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (!name || !email || !password) return bad(res, 'BAD_REQUEST', 'Thiếu thông tin');
  if (password.length < 4) return bad(res, 'WEAK_PASSWORD', 'Mật khẩu phải từ 4 ký tự');

  const [[exists]] = await pool.query(`SELECT id FROM users WHERE email=?`, [email]);
  if (exists) return bad(res, 'EMAIL_EXISTS', 'Email đã tồn tại', 409);

  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    `INSERT INTO users (name,email,phone,password_hash,role,is_active,created_at,updated_at)
     VALUES (?,?,NULL,?,'USER',1,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
    [name, email, hash]
  );
  res.json({ id: r.insertId, name, email, role: 'USER' });
});

// ---------- Public: login ----------
router.post('/users/login', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (!email || !password) return bad(res, 'BAD_REQUEST', 'Thiếu thông tin');

  const [[u]] = await pool.query(
    `SELECT id,name,email,password_hash,role,is_active FROM users WHERE email=?`,
    [email]
  );
  if (!u || !u.password_hash) return bad(res, 'INVALID_CREDENTIALS', 'Sai tài khoản hoặc mật khẩu', 401);
  if (!u.is_active) return bad(res, 'INACTIVE_USER', 'Tài khoản bị khóa', 403);

  const dbHash = String(u.password_hash || '').trim();
  const match = await bcrypt.compare(password, dbHash);
  if (!match) return bad(res, 'INVALID_CREDENTIALS', 'Sai tài khoản hoặc mật khẩu', 401);

  res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
});

// ---------- Seed ADMIN once ----------
router.post('/users/seed-admin', async (req, res) => {
  const name = normStr(req.body?.name || 'Admin');
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (!email || !password) return bad(res, 'BAD_REQUEST', 'Thiếu email/password');

  const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) AS cnt FROM users WHERE role='ADMIN'`);
  if (cnt > 0) return bad(res, 'ADMIN_EXISTS', 'Đã có ADMIN', 409);

  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    `INSERT INTO users (name,email,phone,password_hash,role,is_active,created_at,updated_at)
     VALUES (?,?,NULL,?,'ADMIN',1,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
    [name, email, hash]
  );
  res.json({ id: r.insertId, name, email, role: 'ADMIN' });
});

module.exports = router;
