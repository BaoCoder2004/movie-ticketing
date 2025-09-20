// client/src/pages/admin/AdminCinemas.jsx
import { useEffect, useState } from 'react';
import ExhibitorRoomsSeats from '../../components/admin/ExhibitorRoomsSeats.jsx';

const API = import.meta.env.VITE_API_BASE || '/api';

export default function AdminCinemas() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [f, setF] = useState({ name: '', code: '', website: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [movies, setMovies] = useState([]);

  async function load() {
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      params.set('pageSize', '100');
      const r = await fetch(`${API}/exhibitors?${params.toString()}`);
      const d = await r.json().catch(() => ({}));
      setList(Array.isArray(d.items) ? d.items : Array.isArray(d) ? d : []);
    } catch {
      setList([]);
    }
  }
  useEffect(() => { load(); }, []); // lần đầu

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const body = {
      name: f.name.trim(),
      code: f.code?.trim() || null,
      website: f.website?.trim() || null,
    };
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/exhibitors/${editId}` : `${API}/exhibitors`;
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d?.message || 'Lỗi');
    setMsg('OK');
    setEditId(null);
    setF({ name: '', code: '', website: '' });
    load();
  }

  function pick(it) {
    setEditId(it.id);
    setF({
      name: it.name || it.displayName || '',
      code: it.code || '',
      website: it.website || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function del(id) {
    if (!confirm('Xóa rạp chiếu này?')) return;
    const r = await fetch(`${API}/exhibitors/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d?.message || 'Lỗi');
    setMsg('Đã xóa');
    if (editId === id) setEditId(null);
    load();
  }

  // Phim đang chiếu của rạp đang chọn
  useEffect(() => {
    if (!editId) { setMovies([]); return; }
    fetch(`${API}/exhibitors/${editId}/movies`)
      .then(r => r.json())
      .then(d => {
        const items = Array.isArray(d.items) ? d.items : Array.isArray(d) ? d : [];
        setMovies(items.map(m => ({
          id: m.id,
          title: m.title || m.name,
          posterUrl: m.posterUrl || m.poster_url || '',
          showtimes: m.showtimes || m.showTimes || m.count || 0,
        })));
      })
      .catch(() => setMovies([]));
  }, [editId]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Rạp chiếu</h2>

      <form onSubmit={(e)=>{e.preventDefault(); load();}} className="flex gap-2">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Tìm theo tên/mã rạp"
          className="border rounded px-3 py-2 w-full"
        />
        <button className="px-4 rounded bg-black text-white">Tìm</button>
      </form>

      <div className="grid md:grid-cols-3 gap-3">
        {list.map(it => (
          <div key={it.id} className="border rounded-lg p-3">
            <div className="text-base font-semibold">{it.name || it.displayName || `Exhibitor ${it.id}`}</div>
            {(it.code || it.shortCode) && <div className="text-xs text-gray-600">Mã: {it.code || it.shortCode}</div>}
            {(it.website || it.url) && <div className="text-xs break-all">{it.website || it.url}</div>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => pick(it)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Sửa</button>
              <button onClick={() => del(it.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Xóa</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-gray-500 p-3">Chưa có dữ liệu.</div>}
      </div>

      <form onSubmit={submit} className="grid md:grid-cols-3 gap-3 bg-white rounded-2xl shadow p-4">
        <input
          value={f.name}
          onChange={e => setF({ ...f, name: e.target.value })}
          placeholder="Tên rạp"
          className="border rounded px-3 py-2"
          required
        />
        <input
          value={f.code}
          onChange={e => setF({ ...f, code: e.target.value })}
          placeholder="Mã rút gọn (VD: CGV)"
          className="border rounded px-3 py-2"
        />
        <input
          value={f.website}
          onChange={e => setF({ ...f, website: e.target.value })}
          placeholder="Website"
          className="border rounded px-3 py-2"
        />
        <div className="md:col-span-3 flex gap-2">
          <button className="px-4 rounded bg-black text-white">{editId ? 'Cập nhật' : 'Tạo mới'}</button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setF({ name: '', code: '', website: '' }); }}
              className="px-4 rounded bg-gray-200"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {msg && <div className="text-sm text-emerald-700">{msg}</div>}

      {/* Quản lý phòng + ghế + phim của rạp */}
      {editId && (
        <div className="mt-6 space-y-8">
          <ExhibitorRoomsSeats exhibitorId={editId} />

          <section className="border rounded p-4">
            <h3 className="font-semibold mb-2">Phim đang chiếu tại rạp</h3>
            {movies.length ? (
              <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {movies.map(m => (
                  <li key={m.id} className="border rounded p-3">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-gray-500">{m.showtimes} suất chiếu</div>
                    {m.posterUrl && (
                      <img src={m.posterUrl} alt={m.title} className="mt-1 rounded h-28 object-cover" />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Không có phim đang chiếu tại rạp này.</div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
