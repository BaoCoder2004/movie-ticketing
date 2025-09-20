// server/routes/rooms.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

const FT = new Set(['2D','3D','IMAX','4DX']);

async function branchExists(id){ const [[r]] = await pool.query(`SELECT id FROM branches WHERE id=?`, [id]); return !!r; }
async function roomById(id){
  const [[r]] = await pool.query(`SELECT id,branch_id,name,format_type,capacity,is_active FROM rooms WHERE id=?`, [id]);
  return r || null;
}

// LIST
router.get('/rooms', async (req,res)=>{
  const branchId = req.query.branchId ? Number(req.query.branchId) : null;
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 50)));
  const where=[], args=[];
  if (branchId){ where.push('r.branch_id=?'); args.push(branchId); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM rooms r ${whereSql}`, args);
  const [rows] = await pool.query(
    `SELECT r.id,r.branch_id,r.name,r.format_type,r.capacity,r.is_active
     FROM rooms r ${whereSql} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
    [...args, pageSize, (page-1)*pageSize]
  );
  res.json({ page,pageSize,total, items: rows.map(r=>({
    id:Number(r.id), branchId:Number(r.branch_id), name:r.name,
    formatType:r.format_type, capacity:Number(r.capacity||0), isActive:!!r.is_active
  })) });
});

// DETAIL
router.get('/rooms/:id', async (req,res)=>{
  const id = Number(req.params.id); if(!id) return bad(res,'BAD_REQUEST','id không hợp lệ');
  const r = await roomById(id); if(!r) return bad(res,'NOT_FOUND','Không có phòng',404);
  res.json({ id:Number(r.id), branchId:Number(r.branch_id), name:r.name,
    formatType:r.format_type, capacity:Number(r.capacity||0), isActive:!!r.is_active });
});

// CREATE: capacity không bắt buộc, mặc định 0. Sẽ cập nhật theo sơ đồ ghế.
router.post('/rooms', async (req,res)=>{
  const b = req.body||{};
  const branchId = Number(b.branchId||0);
  const name = String(b.name||'').trim();
  const formatType = String(b.formatType||'').toUpperCase();
  const capacity = Number.isFinite(b.capacity) ? Math.max(0, Number(b.capacity||0)) : 0;
  const isActive = b.isActive===false ? 0 : 1;

  if(!branchId||!name) return bad(res,'BAD_REQUEST','branchId, name bắt buộc');
  if(!FT.has(formatType)) return bad(res,'BAD_REQUEST','formatType không hợp lệ');
  if(!(await branchExists(branchId))) return bad(res,'BRANCH_NOT_FOUND','branchId không tồn tại');

  const [r] = await pool.query(
    `INSERT INTO rooms (branch_id,name,format_type,capacity,is_active,created_at,updated_at)
     VALUES (?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
    [branchId,name,formatType,capacity,isActive]
  );
  res.json({ id:Number(r.insertId), branchId, name, formatType, capacity, isActive:!!isActive });
});

// UPDATE: không cho sửa capacity trực tiếp qua UI, nhưng API vẫn hỗ trợ nếu cần.
router.patch('/rooms/:id', async (req,res)=>{
  const id = Number(req.params.id); if(!id) return bad(res,'BAD_REQUEST','id không hợp lệ');
  if(!(await roomById(id))) return bad(res,'NOT_FOUND','Không có phòng',404);
  const b=req.body||{}; const sets=[],args=[];
  if(b.branchId!==undefined){ const bid=Number(b.branchId||0);
    if(!bid) return bad(res,'BAD_REQUEST','branchId không hợp lệ');
    if(!(await branchExists(bid))) return bad(res,'BRANCH_NOT_FOUND','branchId không tồn tại');
    sets.push('branch_id=?'); args.push(bid);
  }
  if(b.name!==undefined){ const nm=String(b.name||'').trim(); if(!nm) return bad(res,'BAD_REQUEST','name không hợp lệ'); sets.push('name=?'); args.push(nm); }
  if(b.formatType!==undefined){ const ft=String(b.formatType||'').toUpperCase(); if(!FT.has(ft)) return bad(res,'BAD_REQUEST','formatType không hợp lệ'); sets.push('format_type=?'); args.push(ft); }
  if(b.capacity!==undefined){ const cap=Math.max(0,Number(b.capacity||0)); sets.push('capacity=?'); args.push(cap); }
  if(b.isActive!==undefined){ sets.push('is_active=?'); args.push(b.isActive?1:0); }
  if(!sets.length) return bad(res,'BAD_REQUEST','Không có thay đổi');
  sets.push('updated_at=UTC_TIMESTAMP()'); args.push(id);
  await pool.query(`UPDATE rooms SET ${sets.join(', ')} WHERE id=?`, args);
  const r=await roomById(id);
  res.json({ id:Number(r.id), branchId:Number(r.branch_id), name:r.name,
    formatType:r.format_type, capacity:Number(r.capacity||0), isActive:!!r.is_active });
});

// Đồng bộ capacity từ bảng seats
router.post('/rooms/:roomId/recalc-capacity', async (req,res)=>{
  const roomId = Number(req.params.roomId);
  if (!Number.isInteger(roomId) || roomId <= 0)
    return bad(res,'BAD_REQUEST','roomId không hợp lệ');

  const [[room]] = await pool.query('SELECT id FROM rooms WHERE id=?', [roomId]);
  if (!room) return bad(res,'NOT_FOUND','Không tìm thấy phòng',404);

  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM seats WHERE room_id=?', [roomId]);
  await pool.query('UPDATE rooms SET capacity=?, updated_at=UTC_TIMESTAMP() WHERE id=?', [c.n, roomId]);
  res.json({ roomId, capacity: Number(c.n), recalculated: true });
});

// DELETE (chặn nếu còn showtimes)
router.delete('/rooms/:id', async (req,res)=>{
  const id = Number(req.params.id); if(!id) return bad(res,'BAD_REQUEST','id không hợp lệ');
  if(!(await roomById(id))) return bad(res,'NOT_FOUND','Không có phòng',404);
  const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) cnt FROM showtimes WHERE room_id=?`, [id]);
  if(Number(cnt)>0) return bad(res,'ROOM_HAS_SHOWTIMES','Không thể xoá vì còn suất chiếu',409);
  const conn=await pool.getConnection();
  try{ await conn.beginTransaction();
    await conn.query(`DELETE FROM seats WHERE room_id=?`, [id]);
    await conn.query(`DELETE FROM rooms WHERE id=?`, [id]);
    await conn.commit(); res.json({ ok:true });
  } catch(e){ await conn.rollback(); bad(res,'SERVER_ERROR',e.message,500); }
  finally{ conn.release(); }
});

module.exports = router;
