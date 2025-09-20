// client/AdminRooms.jsx
import { useEffect, useState } from 'react';
const API = import.meta.env.VITE_API_BASE || '/api';

export default function AdminRooms() {
  const [exs, setExs] = useState([]);
  const [exFilter, setExFilter] = useState(0);
  const [branches, setBranches] = useState([]);
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);

  const [f, setF] = useState({ branchId:'', name:'', formatType:'2D', isActive:true });
  const [eform, setEform] = useState({ id:0, branchId:'', name:'', formatType:'2D', isActive:true });

  async function loadExs(){ const r=await fetch(`${API}/exhibitors?pageSize=500`); const d=await r.json(); setExs(d.items||[]); }
  async function loadBranches(exId){ if(!exId){setBranches([]);return;} const r=await fetch(`${API}/branches?exhibitorId=${exId}&pageSize=500`); const d=await r.json(); setBranches(d.items||[]); }
  async function loadRooms(exId){ if(!exId){setList([]);return;} const r=await fetch(`${API}/exhibitors/${exId}/rooms`); const d=await r.json(); setList(Array.isArray(d)?d:[]); }

  useEffect(()=>{ loadExs(); },[]);
  useEffect(()=>{ loadBranches(exFilter); loadRooms(exFilter); },[exFilter]);

  async function createRoom(e){
    e.preventDefault(); setMsg('');
    const body = {
      branchId: Number(f.branchId||0),
      name: String(f.name||'').trim(),
      formatType: f.formatType,
      isActive: !!f.isActive
      // capacity bỏ, BE sẽ để 0 và cập nhật sau từ sơ đồ ghế
    };
    if(!body.branchId || !body.name){ setMsg('Nhập đủ Chi nhánh và Tên phòng'); return; }
    const r=await fetch(`${API}/rooms`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d=await r.json(); if(!r.ok){ setMsg(d?.message||'Lỗi'); return; }
    setMsg('Đã tạo'); setF({ branchId:'', name:'', formatType:'2D', isActive:true }); await loadRooms(exFilter);
  }

  function startEdit(r){
    setEditing(r.id);
    setEform({ id:r.id, branchId:r.branch_id ?? r.branchId, name:r.name, formatType:r.format_type ?? r.formatType, isActive: !!(r.is_active ?? r.isActive) });
  }
  async function saveEdit(){
    setMsg('');
    const id = eform.id;
    const body = {
      branchId: Number(eform.branchId||0),
      name: String(eform.name||'').trim(),
      formatType: eform.formatType,
      isActive: !!eform.isActive
      // capacity không cho sửa ở đây
    };
    if(!body.branchId || !body.name){ setMsg('Thiếu dữ liệu'); return; }
    const r=await fetch(`${API}/rooms/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d=await r.json(); if(!r.ok){ setMsg(d?.message||'Lỗi'); return; }
    setEditing(null); await loadRooms(exFilter);
  }
  async function remove(id){
    if(!confirm('Xoá phòng?')) return;
    setMsg('');
    const r=await fetch(`${API}/rooms/${id}`, { method:'DELETE' });
    const d=await r.json(); if(!r.ok){ setMsg(d?.message||'Lỗi'); return; }
    await loadRooms(exFilter);
  }
  async function recalc(id){
    setMsg('');
    const r=await fetch(`${API}/rooms/${id}/recalc-capacity`, { method:'POST' });
    const d=await r.json(); if(!r.ok){ setMsg(d?.message||'Đồng bộ lỗi'); return; }
    await loadRooms(exFilter);
  }

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold">Phòng chiếu</h2>

      {/* Filter theo hệ thống rạp */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Hệ thống rạp</label>
          <select className="border rounded px-3 py-2 min-w-56" value={exFilter} onChange={e=>setExFilter(Number(e.target.value))}>
            <option value={0}>-- Chọn hệ thống rạp --</option>
            {exs.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
      </div>

      {/* Form tạo phòng */}
      <form onSubmit={createRoom} className="grid md:grid-cols-5 gap-3">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Chi nhánh</label>
          <select className="border rounded px-3 py-2" value={f.branchId} onChange={e=>setF(p=>({...p, branchId:e.target.value}))}>
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.city?` (${b.city})`:''}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Tên phòng</label>
          <input className="border rounded px-3 py-2" value={f.name} placeholder="VD: Phòng 1, Screen 2" onChange={e=>setF(p=>({...p, name:e.target.value}))}/>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Loại rạp chiếu</label>
          <select className="border rounded px-3 py-2" value={f.formatType} onChange={e=>setF(p=>({...p, formatType:e.target.value}))}>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Số ghế</label>
          <input className="border rounded px-3 py-2 bg-gray-100" value="Tự tính từ sơ đồ ghế" disabled />
          <p className="text-xs text-gray-500 mt-1">Lưu sơ đồ ghế ở mục “Quản lý ghế”.</p>
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={f.isActive} onChange={e=>setF(p=>({...p, isActive:e.target.checked}))}/>
          <label htmlFor="active" className="text-sm">Kích hoạt</label>
        </div>
        <div className="md:col-span-5">
          <button className="px-4 py-2 rounded bg-black text-white">Tạo phòng</button>
          {msg && <span className="ml-3 text-sm text-red-600">{msg}</span>}
        </div>
      </form>

      {/* Danh sách phòng */}
      <div className="space-y-2">
        {list.map(r => (
          <div key={r.id} className="border rounded p-2 text-sm">
            {editing === r.id ? (
              <div className="grid md:grid-cols-6 gap-2 items-end">
                <div className="flex flex-col">
                  <label className="text-xs">Chi nhánh ID</label>
                  <input className="border rounded px-2 py-1" value={eform.branchId} onChange={e=>setEform(p=>({...p, branchId:e.target.value}))}/>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs">Tên</label>
                  <input className="border rounded px-2 py-1" value={eform.name} onChange={e=>setEform(p=>({...p, name:e.target.value}))}/>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs">Loại</label>
                  <select className="border rounded px-2 py-1" value={eform.formatType} onChange={e=>setEform(p=>({...p, formatType:e.target.value}))}>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs">Số ghế</label>
                  <input className="border rounded px-2 py-1 bg-gray-100" value="Tự tính" disabled />
                </div>
                <div className="flex items-center gap-2">
                  <input id={`ea${r.id}`} type="checkbox" checked={eform.isActive} onChange={e=>setEform(p=>({...p, isActive:e.target.checked}))}/>
                  <label htmlFor={`ea${r.id}`} className="text-xs">Kích hoạt</label>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-3 py-1 rounded bg-blue-600 text-white">Lưu</button>
                  <button onClick={()=>setEditing(null)} className="px-3 py-1 rounded bg-gray-200">Huỷ</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div className="font-medium">{r.name}</div>
                <div>Chi nhánh: {r.branch_name || r.branchId}</div>
                <div>Loại: {r.format_type || r.formatType}</div>
                <div>Số ghế: {r.capacity ?? 0}</div>
                <div>Trạng thái: {(r.is_active ?? r.isActive) ? 'Active' : 'Inactive'}</div>
                <div className="ml-auto flex gap-2">
                  <button onClick={()=>recalc(r.id)} className="px-2 py-1 rounded bg-emerald-600 text-white">Đồng bộ số ghế</button>
                  <button onClick={()=>startEdit(r)} className="px-2 py-1 rounded bg-yellow-500 text-white">Sửa</button>
                  <button onClick={()=>remove(r.id)} className="px-2 py-1 rounded bg-red-600 text-white">Xoá</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-gray-500">Chưa có dữ liệu.</div>}
      </div>
    </section>
  );
}
