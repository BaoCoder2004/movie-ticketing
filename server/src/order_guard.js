// server/src/order_guard.js
const pad=n=>n<10?'0'+n:''+n;
const toMySQL=v=>{ const d=new Date(v); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };

async function ensureOrderOpen(conn, orderId) {
  const [[o]] = await conn.query(
    'SELECT id, status, expires_at FROM orders WHERE id=? FOR UPDATE',
    [orderId]
  );
  if (!o) throw Object.assign(new Error('ORDER_NOT_FOUND'), { status: 404 });
  const now = new Date();
  if (o.status !== 'pending') throw Object.assign(new Error('ORDER_NOT_PENDING'), { status: 409 });
  if (o.expires_at && now >= new Date(o.expires_at)) throw Object.assign(new Error('ORDER_EXPIRED'), { status: 409 });
  return o;
}

module.exports = { ensureOrderOpen, toMySQL };
