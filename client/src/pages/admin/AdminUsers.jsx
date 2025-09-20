import { useEffect, useState } from 'react';

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [f, setF] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: 'CUSTOMER',
    isActive: true,
  });

  const norm = u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName || u.name || '',
    phone: u.phone || '',
    role: u.role || 'CUSTOMER',
    isActive: u.isActive ?? (u.is_active ?? true),
    createdAt: u.createdAt || u.created_at,
  });

  async function load() {
    setMsg('');
    const r = await fetch(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    const d = await r.json();
    setList((d.items || d || []).map(norm));
  }
  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setMsg('');
    const body = {
      email: f.email.trim(),
      fullName: f.fullName.trim(),
      phone: f.phone.trim(),
      role: f.role,
      isActive: !!f.isActive,
    };
    const r = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Tạo user lỗi'); return; }
    setF({ email: '', fullName: '', phone: '', role: 'CUSTOMER', isActive: true });
    load();
  }

  async function toggleActive(u) {
    const r = await fetch(`/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (!r.ok) { const d = await r.json(); setMsg(d?.message || 'Cập nhật lỗi'); return; }
    load();
  }

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold">Quản lý người dùng</h2>

      <form onSubmit={createUser} className="grid md:grid-cols-6 gap-2">
        <input value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="Email" className="border rounded px-3 py-2 md:col-span-2" />
        <input value={f.fullName} onChange={e=>setF({...f,fullName:e.target.value})} placeholder="Họ tên" className="border rounded px-3 py-2 md:col-span-2" />
        <input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="Điện thoại" className="border rounded px-3 py-2" />
        <select value={f.role} onChange={e=>setF({...f,role:e.target.value})} className="border rounded px-3 py-2">
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.isActive} onChange={e=>setF({...f,isActive:e.target.checked})}/> Active
        </label>
        <button className="px-4 rounded bg-black text-white">Tạo</button>
      </form>

      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo email/tên" className="border rounded px-3 py-2 w-full max-w-md" />
        <button onClick={load} className="px-3 rounded bg-gray-800 text-white">Tìm</button>
      </div>

      {msg && <div className="text-sm text-red-600">{msg}</div>}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Họ tên</th>
              <th className="p-2 text-left">Điện thoại</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.map(u=>(
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.fullName}</td>
                <td className="p-2">{u.phone}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.isActive?'bg-emerald-100 text-emerald-700':'bg-gray-200'}`}>
                    {u.isActive?'ACTIVE':'INACTIVE'}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <button onClick={()=>toggleActive(u)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                    {u.isActive?'Deactivate':'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {list.length===0 && (
              <tr><td className="p-3 text-gray-500" colSpan={7}>Chưa có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
