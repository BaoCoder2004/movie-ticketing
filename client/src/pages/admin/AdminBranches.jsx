// client/AdminBranches.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import BranchMovies from '../../components/admin/BranchMovies.jsx';

const API = import.meta.env.VITE_API_BASE || '/api';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AdminBranches() {
  const [exs, setExs] = useState([]);
  const [exFilter, setExFilter] = useState(0);
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [f, setF] = useState({ exhibitorId:0, name:'', city:'', address:'', latitude:'', longitude:'', isActive:true });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const loadExs = async ()=> {
    const r = await fetch(`${API}/exhibitors?page=1&pageSize=500`);
    const d = await r.json(); setExs(d.items || []);
  };
  const load = async ()=> {
    const url = new URL(`${API}/branches`, location.origin);
    if (exFilter) url.searchParams.set('exhibitorId', exFilter);
    if (q) url.searchParams.set('search', q);
    url.searchParams.set('pageSize','500');
    const r = await fetch(url.toString().replace(location.origin,'')); const d = await r.json();
    setList(d.items || []);
  };
  useEffect(()=>{ loadExs().then(load); }, []);
  useEffect(()=>{ load(); }, [exFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = [f.address, f.city].filter(Boolean).join(', ');
      if (!q) return;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => {
          if (d[0]) {
            setF(prev => ({
              ...prev,
              latitude: parseFloat(d[0].lat).toFixed(6),
              longitude: parseFloat(d[0].lon).toFixed(6)
            }));
          }
        });
    }, 800);
    return () => clearTimeout(timer);
  }, [f.address, f.city]);

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    const body = {
      exhibitorId: Number(f.exhibitorId || 0),
      name: f.name, city: f.city, address: f.address || null,
      latitude: f.latitude!=='' ? Number(f.latitude) : null,
      longitude: f.longitude!=='' ? Number(f.longitude) : null,
      isActive: !!f.isActive
    };
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/branches/${editId}` : `${API}/branches`;
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json(); if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setMsg('OK'); setEditId(null);
    setF({ exhibitorId:0, name:'', city:'', address:'', latitude:'', longitude:'', isActive:true });
    load();
  };
  const pick = async (it) => {
    setEditId(it.id);
    setF({
      exhibitorId: it.exhibitorId, name: it.name, city: it.city || '',
      address: it.address || '', latitude: it.latitude ?? '', longitude: it.longitude ?? '', isActive: !!it.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const del = async (id) => {
    if (!confirm('Xóa chi nhánh này?')) return;
    const r = await fetch(`${API}/branches/${id}`, { method:'DELETE' });
    const d = await r.json(); if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setMsg('Đã xóa'); load();
  };

  const center = (f.latitude && f.longitude) ? [Number(f.latitude), Number(f.longitude)] : [21.0285, 105.8542];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Chi nhánh</h2>
      <div className="flex gap-2">
        <select value={exFilter} onChange={e=>setExFilter(Number(e.target.value))} className="border rounded px-3 py-2">
          <option value={0}>Tất cả rạp chuỗi</option>
          {exs.map(x=> <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <form onSubmit={(e)=>{e.preventDefault(); load();}} className="flex gap-2 flex-1">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên/địa chỉ/thành phố" className="border rounded px-3 py-2 w-full"/>
          <button className="px-4 rounded bg-black text-white">Tìm</button>
        </form>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-[900px]">
          {list.map(it=>(
            <div key={it.id} className="w-72 flex-shrink-0 border rounded-lg p-3">
              <div className="text-base font-semibold">{it.name}</div>
              <div className="text-xs text-gray-600">Rạp: {exs.find(x=>x.id===it.exhibitorId)?.name || it.exhibitorId}</div>
              <div className="text-xs text-gray-600">{it.city}</div>
              <div className="text-xs break-all">{it.address || ''}</div>
              <div className="text-xs text-gray-500">Lat/Lng: {it.latitude ?? '—'} / {it.longitude ?? '—'}</div>
              <div className="text-xs">{it.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}</div>
              {it.latitude != null && it.longitude != null && (
                <div className="mt-2">
                  <MapContainer center={[it.latitude, it.longitude]} zoom={13} style={{ height: '150px', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap"/>
                    <Marker position={[it.latitude, it.longitude]}><Popup>{it.name}</Popup></Marker>
                  </MapContainer>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={()=>pick(it)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Sửa</button>
                <button onClick={()=>del(it.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Xóa</button>
              </div>
            </div>
          ))}
          {list.length===0 && <div className="text-sm text-gray-500 p-3">Chưa có dữ liệu.</div>}
        </div>
      </div>

      <form onSubmit={submit} className="grid md:grid-cols-6 gap-3 bg-white rounded-2xl shadow p-4">
        <select value={f.exhibitorId} onChange={e=>setF({...f,exhibitorId:Number(e.target.value)})} className="border rounded px-3 py-2" required>
          <option value={0}>-- Chọn rạp chuỗi --</option>
          {exs.map(x=> <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Tên chi nhánh" className="border rounded px-3 py-2 md:col-span-2" required />
        <input value={f.city} onChange={e=>setF({...f,city:e.target.value})} placeholder="Thành phố/Tỉnh" className="border rounded px-3 py-2" required />
        <input value={f.address} onChange={e=>setF({...f,address:e.target.value})} placeholder="Địa chỉ" className="border rounded px-3 py-2 md:col-span-2" />
        <input value={f.latitude} onChange={e=>setF({...f,latitude:e.target.value})} placeholder="Latitude" className="border rounded px-3 py-2" />
        <input value={f.longitude} onChange={e=>setF({...f,longitude:e.target.value})} placeholder="Longitude" className="border rounded px-3 py-2" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.isActive} onChange={e=>setF({...f,isActive:e.target.checked})}/>
          <span>Đang hoạt động</span>
        </label>
        <div className="md:col-span-6">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {f.latitude && f.longitude && (
              <Marker position={[f.latitude, f.longitude]}>
                <Popup>Chi nhánh đang nhập</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="md:col-span-6 flex gap-2">
          <button className="px-4 rounded bg-black text-white">{editId?'Cập nhật':'Tạo mới'}</button>
          {editId && <button type="button" onClick={()=>{setEditId(null); setF({ exhibitorId:0, name:'', city:'', address:'', latitude:'', longitude:'', isActive:true });}} className="px-4 rounded bg-gray-200">Hủy</button>}
        </div>
      </form>
      {msg && <div className="text-sm text-emerald-700">{msg}</div>}

      {editId && (
        <div className="mt-6" id={`branch-${editId}`}>
          <BranchMovies branchId={editId} />
        </div>
      )}
    </section>
  );
}
