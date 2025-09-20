import { useEffect, useState } from 'react';
const API = import.meta.env.VITE_API_BASE || '/api';
const money = v => (Number(v||0)).toLocaleString('vi-VN') + ' đ';
const toLocal = s => s ? new Date(s).toLocaleString('vi-VN') : '-';

function CodeChip({ text }) {
  return <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100">{text}</span>;
}

export default function AdminVouchers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState({
    code:'', kind:'AMOUNT', value:50000, minTotal:0, expiryAt:'', quota:'', perUserLimit:1, isActive:true
  });
  const [editRow, setEditRow] = useState(null);

  const load = async () => {
    setMsg('');
    const qs = new URLSearchParams(); if (q) qs.set('q', q);
    const r = await fetch(`${API}/vouchers?`+qs.toString());
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message||`HTTP ${r.status}`); setList([]); return; }
    setList(d.items || []);
  };
  useEffect(()=>{ load(); }, []);

  const randLocal = () => {
    const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s=''; for(let i=0;i<10;i++) s += ABC[Math.floor(Math.random()*ABC.length)];
    return s;
  };

  const createVoucher = async (e) => {
    e.preventDefault();
    setMsg('');
    const body = {
      code: creating.code?.trim() || undefined,
      kind: creating.kind,
      value: Number(creating.value),
      minTotal: Number(creating.minTotal||0),
      expiryAt: creating.expiryAt ? new Date(creating.expiryAt).toISOString() : null,
      quota: creating.quota === '' ? null : Number(creating.quota),
      perUserLimit: Number(creating.perUserLimit||1),
      isActive: !!creating.isActive
    };
    const r = await fetch(`${API}/vouchers`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Tạo thất bại'); return; }
    setMsg(`Đã tạo: ${d.code}`);
    setCreating({ code:'', kind:'AMOUNT', value:50000, minTotal:0, expiryAt:'', quota:'', perUserLimit:1, isActive:true });
    load();
  };

  const saveEdit = async () => {
    if (!editRow) return;
    setMsg('');
    const body = {
      code: editRow.code?.trim(),
      kind: editRow.kind,
      value: Number(editRow.value),
      minTotal: Number(editRow.minTotal||0),
      expiryAt: editRow.expiryAt ? new Date(editRow.expiryAt).toISOString() : null,
      quota: editRow.quota === '' ? null : Number(editRow.quota),
      perUserLimit: Number(editRow.perUserLimit||1),
      isActive: !!editRow.isActive
    };
    const r = await fetch(`${API}/vouchers/${editRow.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) { setMsg(d?.message || 'Sửa thất bại'); return; }
    setEditRow(null); load();
  };

  const remove = async (id) => {
    if (!confirm('Xoá voucher này?')) return;
    setMsg('');
    const r = await fetch(`${API}/vouchers/${id}`, { method:'DELETE' });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) { setMsg(d?.message || 'Xoá thất bại'); return; }
    load();
  };

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-5">
      <h2 className="text-lg font-semibold">Quản lý voucher</h2>

      {/* Tìm kiếm */}
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo code"
               className="border rounded px-3 py-2 w-64"/>
        <button onClick={load} className="px-3 rounded bg-black text-white">Tìm</button>
        {msg && <span className="text-sm text-gray-700 ml-auto">{msg}</span>}
      </div>

      {/* Tạo mới: chia nhiều dòng */}
      <form onSubmit={createVoucher} className="border rounded p-4 space-y-3">
        {/* Dòng 1: Code + Random + Active */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Code (để trống sẽ random)</label>
            <div className="flex gap-2">
              <input value={creating.code}
                     onChange={e=>setCreating({...creating,code:e.target.value.toUpperCase()})}
                     placeholder="VD: AUTO"
                     className="border rounded px-3 py-2 w-full"/>
              <button type="button" onClick={()=>setCreating({...creating,code:randLocal()})}
                      className="px-2 rounded border">Random</button>
            </div>
          </div>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={creating.isActive}
                   onChange={e=>setCreating({...creating,isActive:e.target.checked})}/>
            Active
          </label>
        </div>

        {/* Dòng 2: Loại + Giá trị + Min tổng */}
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Loại</label>
            <select value={creating.kind} onChange={e=>setCreating({...creating,kind:e.target.value})}
                    className="border rounded px-3 py-2 w-full">
              <option value="AMOUNT">AMOUNT (VND)</option>
              <option value="PERCENT">PERCENT (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Giá trị</label>
            <input type="number" value={creating.value}
                   onChange={e=>setCreating({...creating,value:e.target.value})}
                   className="border rounded px-3 py-2 w-full"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min tổng</label>
            <input type="number" value={creating.minTotal}
                   onChange={e=>setCreating({...creating,minTotal:e.target.value})}
                   className="border rounded px-3 py-2 w-full"/>
          </div>
        </div>

        {/* Dòng 3: Hết hạn + Quota + /User */}
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hết hạn</label>
            <input type="datetime-local" value={creating.expiryAt}
                   onChange={e=>setCreating({...creating,expiryAt:e.target.value})}
                   className="border rounded px-3 py-2 w-full"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quota</label>
            <input type="number" value={creating.quota}
                   onChange={e=>setCreating({...creating,quota:e.target.value})}
                   placeholder="trống = không giới hạn"
                   className="border rounded px-3 py-2 w-full"/>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">/User</label>
            <input type="number" value={creating.perUserLimit}
                   onChange={e=>setCreating({...creating,perUserLimit:e.target.value})}
                   className="border rounded px-3 py-2 w-full"/>
          </div>
        </div>

        {/* Dòng 4: Nút tạo */}
        <div className="flex">
          <button className="px-4 rounded bg-black text-white ml-auto">Tạo</button>
        </div>
      </form>

      {/* Bảng */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Loại</th>
              <th className="p-2 text-left">Giá trị</th>
              <th className="p-2 text-left">Min tổng</th>
              <th className="p-2 text-left">Hết hạn</th>
              <th className="p-2 text-left">Quota</th>
              <th className="p-2 text-left">/User</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.map(v=>(
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.id}</td>
                <td className="p-2"><CodeChip text={v.code} /></td>
                <td className="p-2">{v.kind}</td>
                <td className="p-2">{v.kind==='PERCENT' ? `${v.value}%` : money(v.value)}</td>
                <td className="p-2">{money(v.minTotal)}</td>
                <td className="p-2">{toLocal(v.expiryAt)}</td>
                <td className="p-2">{v.quota ?? '-'}</td>
                <td className="p-2">{v.perUserLimit}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${v.isActive?'bg-emerald-100 text-emerald-700':'bg-gray-200'}`}>
                    {v.isActive?'ACTIVE':'INACTIVE'}
                  </span>
                </td>
                <td className="p-2 text-right space-x-2">
                  <button onClick={()=>setEditRow({...v})}
                          className="text-xs px-2 py-1 rounded border">Sửa</button>
                  <button onClick={()=>remove(v.id)}
                          className="text-xs px-2 py-1 rounded bg-rose-600 text-white">Xoá</button>
                </td>
              </tr>
            ))}
            {list.length===0 && (
              <tr><td className="p-3 text-gray-500" colSpan={10}>Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Panel Sửa */}
      {editRow && (
        <div className="fixed inset-0 bg-black/30 flex" onClick={()=>setEditRow(null)}>
          <div className="ml-auto w-full max-w-xl h-full bg-white p-4 overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Sửa voucher #{editRow.id}</h3>
              <button onClick={()=>setEditRow(null)} className="px-2 py-1 rounded border">Đóng</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Code</label>
                <div className="flex gap-2">
                  <input value={editRow.code} onChange={e=>setEditRow({...editRow, code:e.target.value.toUpperCase()})}
                         className="border rounded px-3 py-2 w-full"/>
                  <button type="button" onClick={()=>setEditRow({...editRow, code:randLocal()})}
                          className="px-2 rounded border">Random</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Loại</label>
                  <select value={editRow.kind} onChange={e=>setEditRow({...editRow,kind:e.target.value})}
                          className="border rounded px-3 py-2 w-full">
                    <option value="AMOUNT">AMOUNT</option>
                    <option value="PERCENT">PERCENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Giá trị</label>
                  <input type="number" value={editRow.value} onChange={e=>setEditRow({...editRow,value:e.target.value})}
                         className="border rounded px-3 py-2 w-full"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min tổng</label>
                  <input type="number" value={editRow.minTotal} onChange={e=>setEditRow({...editRow,minTotal:e.target.value})}
                         className="border rounded px-3 py-2 w-full"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quota</label>
                  <input type="number" value={editRow.quota ?? ''} onChange={e=>setEditRow({...editRow,quota:e.target.value})}
                         placeholder="trống = không giới hạn" className="border rounded px-3 py-2 w-full"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">/User</label>
                  <input type="number" value={editRow.perUserLimit} onChange={e=>setEditRow({...editRow,perUserLimit:e.target.value})}
                         className="border rounded px-3 py-2 w-full"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hết hạn</label>
                  <input type="datetime-local"
                         value={editRow.expiryAt ? new Date(editRow.expiryAt).toISOString().slice(0,16) : ''}
                         onChange={e=>setEditRow({...editRow,expiryAt:e.target.value})}
                         className="border rounded px-3 py-2 w-full"/>
                </div>
              </div>

              <label className="text-sm">
                <input type="checkbox" checked={!!editRow.isActive}
                       onChange={e=>setEditRow({...editRow,isActive:e.target.checked})}/> Active
              </label>

              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-3 py-2 rounded bg-black text-white">Lưu</button>
                <button onClick={()=>setEditRow(null)} className="px-3 py-2 rounded border">Huỷ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
