// client/src/pages/admin/AdminPayments.jsx
import { useEffect, useMemo, useState } from 'react';
const API = import.meta.env.VITE_API_BASE || '/api';

function Badge({ children, tone = 'gray' }) {
  const map = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[tone]}`}>{children}</span>;
}
const STATUS_TONE = { INITIATED:'blue', SUCCESS:'green', FAILED:'red', REFUNDED:'purple' };

async function getJson(url) {
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await r.text();
    throw new Error(`Expect JSON, got: ${text.slice(0,100)}`);
  }
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d;
}
const money = n => (Number(n||0)).toLocaleString('vi-VN') + ' đ';
const toLocal = s => s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString('vi-VN') : '';

export default function AdminPayments() {
  const [f, setF] = useState({ status:'', provider:'', q:'', page:1, pageSize:20 });
  const [data, setData] = useState({ items:[], total:0, page:1, pageSize:20 });
  const [err, setErr] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    if (f.status) u.set('status', f.status);
    if (f.provider) u.set('provider', f.provider);
    if (f.q) u.set('q', f.q);
    u.set('page', String(f.page));
    u.set('pageSize', String(f.pageSize));
    return u.toString();
  }, [f.status, f.provider, f.q, f.page, f.pageSize]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (f.pageSize || 20))),
    [data.total, f.pageSize]
  );

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try { setData(await getJson(`${API}/payments?${qs}`)); }
      catch (e) { setErr(e.message); setData({ items:[], total:0, page:1, pageSize:f.pageSize }); }
      finally { setLoading(false); }
    })();
  }, [qs, f.pageSize]);

  const openDetail = async (id) => {
    setDetailId(id); setDetail(null); setDetailLoading(true);
    try { setDetail(await getJson(`${API}/payments/${id}`)); }
    catch (e) { setDetail({ error:e.message }); }
    finally { setDetailLoading(false); }
  };

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold">Thanh toán — Hiển thị & xử lý</h2>

      <div className="flex flex-wrap gap-2">
        <select value={f.status} onChange={e=>setF(s=>({ ...s, status:e.target.value, page:1 }))} className="border rounded px-2 py-2">
          <option value="">Tất cả trạng thái</option>
          <option value="INITIATED">INITIATED</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <select value={f.provider} onChange={e=>setF(s=>({ ...s, provider:e.target.value, page:1 }))} className="border rounded px-2 py-2">
          <option value="">Tất cả cổng</option>
          <option value="VNPAY">VNPAY</option>
          <option value="SANDBOX">SANDBOX</option>
        </select>
        <input value={f.q} onChange={e=>setF(s=>({ ...s, q:e.target.value, page:1 }))}
               onKeyDown={e=>{ if(e.key==='Enter') setF(s=>({ ...s })); }}
               placeholder="Tìm: order/ref/bank/ip/email/phone"
               className="border rounded px-2 py-2 w-80" />
        <button onClick={()=>setF(s=>({ ...s }))} className="px-4 rounded bg-black text-white">Lọc</button>
        <span className="text-sm text-gray-600 ml-auto">Tổng: {data.total}</span>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Order</th>
              <th className="p-2 border">Khách</th>
              <th className="p-2 border">Cổng</th>
              <th className="p-2 border">Trạng thái</th>
              <th className="p-2 border">Số tiền</th>
              <th className="p-2 border">Bank / TxnRef</th>
              <th className="p-2 border">Pay date</th>
              <th className="p-2 border">Tạo lúc</th>
              <th className="p-2 border">Xử lý</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-4 text-center text-gray-500">Đang tải…</td></tr>
            ) : (data.items||[]).length === 0 ? (
              <tr><td colSpan={10} className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
            ) : (data.items||[]).map(x => (
              <tr key={x.id} className="hover:bg-gray-50">
                <td className="p-2 border">{x.id}</td>
                <td className="p-2 border">#{x.orderId}</td>
                <td className="p-2 border">
                  <div className="flex flex-col">
                    <span>{x.email || '—'}</span>
                    <span className="text-xs text-gray-500">{x.phone || '—'}</span>
                  </div>
                </td>
                <td className="p-2 border"><Badge tone="orange">{x.provider || '—'}</Badge></td>
                <td className="p-2 border"><Badge tone={STATUS_TONE[x.status] || 'gray'}>{x.status}</Badge></td>
                <td className="p-2 border">{money(x.amount)}</td>
                <td className="p-2 border">{[x.bankCode, x.txnRef || x.refCode].filter(Boolean).join(' / ') || '—'}</td>
                <td className="p-2 border">{toLocal(x.payDate) || '—'}</td>
                <td className="p-2 border">{toLocal(x.createdAt)}</td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button onClick={()=>openDetail(x.id)} className="px-2 py-1 rounded border text-xs">Xem</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <select value={f.pageSize} onChange={e=>setF(s=>({ ...s, pageSize:Number(e.target.value), page:1 }))} className="border rounded px-2 py-1">
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}/trang</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button disabled={f.page<=1} onClick={()=>setF(s=>({ ...s, page:s.page-1 }))} className="px-2 py-1 rounded border disabled:opacity-50">Trước</button>
          <span className="text-sm text-gray-600">Trang {data.page} / {pages}</span>
          <button disabled={f.page>=pages} onClick={()=>setF(s=>({ ...s, page:s.page+1 }))} className="px-2 py-1 rounded border disabled:opacity-50">Sau</button>
        </div>
      </div>

      {err && <div className="text-sm text-rose-600">Lỗi: {err}</div>}

      {detailId !== null && (
        <div className="fixed inset-0 bg-black/30 flex" onClick={()=>setDetailId(null)}>
          <div className="ml-auto w-full max-w-2xl h-full bg-white shadow-xl p-4 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Chi tiết thanh toán #{detailId}</h3>
              <button onClick={()=>setDetailId(null)} className="px-2 py-1 rounded border">Đóng</button>
            </div>
            {detailLoading ? (
              <div className="text-gray-500">Đang tải…</div>
            ) : detail?.error ? (
              <div className="text-rose-600">{detail.error}</div>
            ) : detail ? (
              <div className="space-y-4 text-sm">
                <div className="border rounded p-3">
                  <div className="font-medium mb-2">Payment</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Provider: <b>{detail.payment.provider}</b></div>
                    <div>Trạng thái: <Badge tone={STATUS_TONE[detail.payment.status] || 'gray'}>{detail.payment.status}</Badge></div>
                    <div>Số tiền: <b>{money(detail.payment.amount)}</b></div>
                    <div>Bank: {detail.payment.bankCode || '—'}</div>
                    <div>TxnRef: {detail.payment.merchantTxnRef || '—'}</div>
                    <div>Pay date: {toLocal(detail.payment.payDate) || '—'}</div>
                    <div>IP: {detail.payment.clientIp || '—'}</div>
                    <div>Fail reason: {detail.payment.failReason || '—'}</div>
                  </div>
                </div>

                <div className="border rounded p-3">
                  <div className="font-medium mb-2">Order</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Code: <b>{detail.order.orderCode || `#${detail.order.id}`}</b></div>
                    <div>Trạng thái: <Badge tone={STATUS_TONE[detail.order.status] || 'gray'}>{detail.order.status}</Badge></div>
                    <div>Tổng: <b>{money(detail.order.total)}</b></div>
                    <div>Tạo lúc: {toLocal(detail.order.createdAt)}</div>
                    <div>Email: {detail.order.email || '—'}</div>
                    <div>Phone: {detail.order.phone || '—'}</div>
                  </div>
                </div>

                <div className="border rounded p-3">
                  <div className="font-medium mb-2">Vé</div>
                  {(detail.order.tickets||[]).length ? (
                    <div className="space-y-2">
                      {detail.order.tickets.map(t => (
                        <div key={t.id} className="flex items-center justify-between border rounded p-2">
                          <div>Ghế: <b>{t.rowLabel}{t.colNumber}</b> <span className="text-gray-500">({t.seatType})</span></div>
                          <div className="font-mono text-xs break-all">{t.qrCode}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-gray-500">Không có vé</div>}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
