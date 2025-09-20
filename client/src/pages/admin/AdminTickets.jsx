// client/AdminTickets.jsx
import { useEffect, useMemo, useState } from 'react';
const API = import.meta.env.VITE_API_BASE || '/api';

function Badge({ children, tone='gray' }) {
  const map = {
    gray:'bg-gray-100 text-gray-800',
    green:'bg-emerald-100 text-emerald-800',
    blue:'bg-blue-100 text-blue-800'
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${map[tone]}`}>{children}</span>;
}
const toLocal = s => s ? new Date(s.replace(' ','T')+'Z').toLocaleString('vi-VN') : '';
const short = s => s?.length>10 ? s.slice(0,10)+'…' : (s||'');

export default function AdminTickets(){
  const [list,setList]=useState([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(20);
  const [status,setStatus]=useState('');
  const [q,setQ]=useState('');
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState('');

  const totalPages = useMemo(()=>Math.max(1, Math.ceil(total/pageSize)),[total,pageSize]);

  const load = async ()=>{
    setLoading(true); setMsg('');
    try{
      const qs = new URLSearchParams({ page, pageSize });
      if(status) qs.set('status', status);
      if(q) qs.set('q', q);
      if(dateFrom) qs.set('dateFrom', dateFrom);
      if(dateTo) qs.set('dateTo', dateTo);
      const r = await fetch(`${API}/tickets?`+qs.toString());
      const d = await r.json();
      if(!r.ok) throw new Error(d?.message||`HTTP ${r.status}`);
      setList(d.items||[]); setTotal(d.total||0);
    }catch(e){ setMsg(e.message); setList([]); setTotal(0); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[page,pageSize,status,dateFrom,dateTo]);

  const scan = async (row)=>{
    setMsg('');
    try{
      const r = await fetch(`${API}/tickets/scan`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ showtimeId: row.showtimeId, qrCode: row.qrCode })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d?.message||`HTTP ${r.status}`);
      setMsg(`Quét OK: #${d.id} • ${d.status}`);
      load();
    }catch(e){ setMsg('Quét lỗi: '+e.message); }
  };

  const onKey = (e)=>{ if(e.key==='Enter'){ setPage(1); load(); } };

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold">Vé — Bảng danh sách</h2>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={status} onChange={e=>{setStatus(e.target.value); setPage(1);}} className="border rounded px-3 py-2">
          <option value="">Tất cả trạng thái</option>
          <option value="ISSUED">ISSUED</option>
          <option value="SCANNED">SCANNED</option>
        </select>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey}
               placeholder="Tìm: QR / Order / Email / Phone / Phim / Ghế / Rạp"
               className="border rounded px-3 py-2 w-96"/>
        <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value); setPage(1);}}
               className="border rounded px-3 py-2"/>
        <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value); setPage(1);}}
               className="border rounded px-3 py-2"/>
        <button onClick={()=>{setPage(1); load();}} className="px-3 py-2 rounded bg-black text-white">Lọc</button>
        <span className="text-sm text-gray-600 ml-auto">Tổng: {total}</span>
      </div>

      {/* Bảng vé */}
      <div className="overflow-auto">
        <table className="min-w-[1000px] w-full border rounded">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 border-b">ID</th>
              <th className="px-3 py-2 border-b">QR</th>
              <th className="px-3 py-2 border-b">Ghế</th>
              <th className="px-3 py-2 border-b">Trạng thái</th>
              <th className="px-3 py-2 border-b">Suất chiếu</th>
              <th className="px-3 py-2 border-b">Phim</th>
              <th className="px-3 py-2 border-b">Phòng</th>
              <th className="px-3 py-2 border-b">Rạp</th>
              <th className="px-3 py-2 border-b">Order</th>
              <th className="px-3 py-2 border-b">Khách</th>
              <th className="px-3 py-2 border-b">Đã quét</th>
              <th className="px-3 py-2 border-b">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-500">Đang tải…</td></tr>
            ) : list.length===0 ? (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-500">Không có dữ liệu</td></tr>
            ) : list.map(row=>(
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">{row.id}</td>
                <td className="px-3 py-2 border-b">
                  <div className="font-mono text-xs">{short(row.qrCode)}</div>
                  <button
                    className="text-[10px] text-blue-700 underline"
                    onClick={()=>navigator.clipboard?.writeText(row.qrCode)}
                  >copy</button>
                </td>
                <td className="px-3 py-2 border-b">
                  <div><b>{row.seat?.row}{row.seat?.col}</b></div>
                  <div className="text-xs text-gray-500">{row.seat?.type}</div>
                </td>
                <td className="px-3 py-2 border-b">
                  <Badge tone={row.status==='SCANNED'?'green':'blue'}>{row.status}</Badge>
                </td>
                <td className="px-3 py-2 border-b text-sm">{toLocal(row.startAt)}</td>
                <td className="px-3 py-2 border-b">{row.movieTitle}</td>
                <td className="px-3 py-2 border-b">{row.roomName}</td>
                <td className="px-3 py-2 border-b">
                  <div>{row.branchName}</div>
                  <div className="text-xs text-gray-500">{row.city}</div>
                </td>
                <td className="px-3 py-2 border-b">
                  <div className="text-sm">{row.orderCode}</div>
                  <div className="text-xs text-gray-500">#{row.orderId}</div>
                </td>
                <td className="px-3 py-2 border-b text-sm">
                  <div>{row.email || '—'}</div>
                  <div className="text-xs text-gray-500">{row.phone || '—'}</div>
                </td>
                <td className="px-3 py-2 border-b text-sm">{row.scannedAt ? toLocal(row.scannedAt) : '—'}</td>
                <td className="px-3 py-2 border-b">
                  <button
                    disabled={row.status==='SCANNED'}
                    onClick={()=>scan(row)}
                    className="px-2 py-1 rounded border disabled:opacity-50 text-sm"
                  >Quét</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value)); setPage(1);}}
                className="border rounded px-2 py-1">
          {[10,20,50,100].map(n=><option key={n} value={n}>{n}/trang</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}
                  className="px-2 py-1 rounded border disabled:opacity-50">Trước</button>
          <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                  className="px-2 py-1 rounded border disabled:opacity-50">Sau</button>
        </div>
      </div>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </section>
  );
}
