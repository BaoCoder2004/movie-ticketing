import { useEffect, useState, useCallback } from 'react';
const API = import.meta.env.VITE_API_BASE || '/api';

export default function AdminOrders() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState('');
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({});          // { [orderId]: detail }
  const [detailLoading, setDetailLoading] = useState(0); // orderId đang tải

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setMsg('');
    setList([]);
    const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (q) qs.set('q', q);
    if (status) qs.set('status', status);
    try {
      const r = await fetch(`${API}/orders?` + qs.toString());
      const d = await r.json();
      if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
      setList(d.items || []);
      setTotal(Number(d.total || 0));
      setPage(Number(d.page || p));
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }, [q, status, pageSize]);

  useEffect(() => { load(1); }, [load]);

  const onKey = e => { if (e.key === 'Enter') load(1); };

  async function toggleView(id){
    setMsg('');
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (details[id]) return; // đã cache
    setDetailLoading(id);
    const r = await fetch(`${API}/orders/${id}`);
    const d = await r.json();
    setDetailLoading(0);
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setDetails(prev => ({ ...prev, [id]: d }));
  }

  async function cancelOrder(id){
    if (!confirm('Hủy đơn PENDING?')) return;
    setMsg('');
    const r = await fetch(`${API}/orders/${id}/cancel`, { method:'PATCH' });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setOpenId(null);
    load(page);
  }

  async function refundOrder(id){
    if (!confirm('Hoàn tiền đơn PAID theo rule (> 2h)?')) return;
    setMsg('');
    const r = await fetch(`${API}/orders/${id}/refund`, { method:'POST' });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setOpenId(null);
    load(page);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Quản lý đơn hàng</h2>

      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Tìm kiếm</span>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey}
                   placeholder="mã đơn, email, tên, sđt" className="border rounded px-3 py-2 w-72"/>
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Trạng thái</span>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-3 py-2">
              <option value="">Tất cả</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </label>
          <button onClick={()=>load(1)} className="px-4 py-2 rounded bg-black text-white">Lọc</button>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          {loading && <div className="text-sm text-gray-500">Đang tải…</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Mã đơn</th>
                <th className="px-2 py-2">Khách</th>
                <th className="px-2 py-2">Tổng (VND)</th>
                <th className="px-2 py-2">Trạng thái</th>
                <th className="px-2 py-2">Ngày tạo</th>
                <th className="px-2 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map(o=>(
                <Row
                  key={o.id}
                  o={o}
                  opened={openId===o.id}
                  onToggle={toggleView}
                  onRefund={refundOrder}
                  onCancel={cancelOrder}
                  detail={details[o.id]}
                  detailLoading={detailLoading===o.id}
                />
              ))}
              {list.length===0 && !loading && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-6">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-600">Tổng {total} đơn • Trang {page}/{pages}</div>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>{ const p=Math.max(1,page-1); setPage(p); load(p); }} className="px-3 py-1 rounded border disabled:opacity-50">Trước</button>
            <button disabled={page>=pages} onClick={()=>{ const p=Math.min(pages,page+1); setPage(p); load(p); }} className="px-3 py-1 rounded border disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }){
  const map = {
    PENDING:'bg-yellow-100 text-yellow-800',
    PAID:'bg-emerald-100 text-emerald-800',
    CANCELLED:'bg-gray-200 text-gray-700',
    REFUNDED:'bg-blue-100 text-blue-800'
  };
  return <span className={`px-2 py-0.5 rounded-full text-[12px] ${map[status]||'bg-gray-100'}`}>{status}</span>;
}

function Row({ o, opened, onToggle, onRefund, onCancel, detail, detailLoading }){
  return (
    <>
      <tr className="border-b">
        <td className="px-2 py-2">{o.id}</td>
        <td className="px-2 py-2 font-mono">{o.orderCode}</td>
        <td className="px-2 py-2">{o.userEmail || o.userName || '—'}</td>
        <td className="px-2 py-2">{Number(o.total||0).toLocaleString('vi-VN')}</td>
        <td className="px-2 py-2"><StatusBadge status={o.status}/></td>
        <td className="px-2 py-2">{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
        <td className="px-2 py-2 text-right space-x-2">
          <button onClick={()=>onToggle(o.id)} className="px-2 py-1 rounded border">{opened?'Đóng':'Xem'}</button>
          <button onClick={()=>onRefund(o.id)} disabled={o.status!=='PAID'} className="px-2 py-1 rounded border disabled:opacity-50">Hoàn tiền</button>
          <button onClick={()=>onCancel(o.id)} disabled={o.status!=='PENDING'} className="px-2 py-1 rounded border disabled:opacity-50">Hủy</button>
        </td>
      </tr>

      {opened && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="p-3">
            {detailLoading && <div className="text-sm text-gray-500">Đang tải chi tiết…</div>}
            {!detailLoading && detail && <DetailBox detail={detail} />}
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBox({ detail }){
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-4">
        <div><span className="text-gray-600">Mã:</span> <span className="font-mono">{detail.orderCode}</span></div>
        <div><span className="text-gray-600">Khách:</span> {detail.userEmail || detail.userName || '—'}</div>
        <div><span className="text-gray-600">Tổng:</span> {Number(detail.total||0).toLocaleString('vi-VN')} VND</div>
        <div><span className="text-gray-600">Trạng thái:</span> {detail.status}</div>
        {detail.minStartAt && <div><span className="text-gray-600">Suất sớm nhất:</span> {new Date(detail.minStartAt).toLocaleString('vi-VN')}</div>}
      </div>

      <div>
        <div className="font-medium mb-1">Vé</div>
        <div className="grid md:grid-cols-2 gap-2">
          {detail.items?.tickets?.map(t=>(
            <div key={t.id} className="border rounded p-2 text-xs">
              <div>{t.movieTitle} • {t.roomName}</div>
              <div>Ghế: {t.seatLabel} • {t.status}</div>
              <div>Suất: {t.startAt ? new Date(t.startAt).toLocaleString('vi-VN') : '—'}</div>
              {t.qrCode && <div className="font-mono break-all">QR: {t.qrCode}</div>}
              {t.scannedAt && <div>Đã quét: {new Date(t.scannedAt).toLocaleString('vi-VN')}</div>}
            </div>
          ))}
          {(!detail.items || detail.items.tickets?.length===0) && <div className="text-xs text-gray-500">Không có vé</div>}
        </div>
      </div>

      <div>
        <div className="font-medium mb-1">Thanh toán</div>
        <div className="grid md:grid-cols-2 gap-2">
          {detail.payments?.map(p=>(
            <div key={p.id} className="border rounded p-2 text-xs">
              <div>Provider: {p.provider || '—'}</div>
              <div>Trạng thái: {p.status}</div>
              <div>Số tiền: {Number(p.amount||0).toLocaleString('vi-VN')} VND</div>
              <div>Thời gian: {p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '—'}</div>
            </div>
          ))}
          {(!detail.payments || detail.payments.length===0) && <div className="text-xs text-gray-500">Không có giao dịch</div>}
        </div>
      </div>
    </div>
  );
}
