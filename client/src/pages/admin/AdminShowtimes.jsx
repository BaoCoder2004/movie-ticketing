// client/src/pages/admin/AdminShowtimes.jsx
import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/api';
const inputToMySQL = v => (v ? v.replace('T', ' ') + ':00' : '');
const mysqlToInput = v => (v ? v.replace(' ', 'T').slice(0, 16) : '');

function roomLabel(r) {
  const name = r.name || r.roomName || r.room_name || `Room ${r.id}`;
  const fmt = r.formatType || r.format_type || '';
  const br = r.branchName || r.branch_name || '';
  return [name, fmt, br].filter(Boolean).join(' • ');
}

export default function AdminShowtimes() {
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [list, setList] = useState([]);
  const [f, setF] = useState({ movieId: '', roomId: '', startAtMySQL: '', basePrice: 90000 });
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setMsg('');
    const [m, r, s] = await Promise.all([
      fetch(`${API}/movies?page=1&pageSize=200`).then(x => x.json()).catch(() => ({ items: [] })),
      fetch(`${API}/rooms?page=1&pageSize=500`).then(x => x.json()).catch(() => ({ items: [] })),
      fetch(`${API}/showtimes`).then(x => x.json()).catch(() => ({ items: [] })),
    ]);
    setMovies(m.items || []);
    setRooms(r.items || r || []);
    const arr = (s.items || s || []).map(x => ({
      id: x.id,
      title: x.title || x.movieTitle || x.movie_title,
      roomName: x.roomName || x.room_name,
      startAt: x.start_at || x.startAt,
      endAt:   x.end_at   || x.endAt,
      basePrice: x.base_price || x.basePrice,
      movieId: x.movie_id || x.movieId,
      roomId: x.room_id || x.roomId,
    }));
    setList(arr);
  };
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setMsg('');
    const body = {
      movieId: Number(f.movieId),
      roomId: Number(f.roomId),
      startAt: f.startAtMySQL, // BE sẽ tính end_at theo duration_min
      basePrice: Number(String(f.basePrice).replace(',', '.')),
    };
    if (!body.movieId || !body.roomId || !body.startAt) { setMsg('Thiếu dữ liệu'); return; }

    const url = editId ? `${API}/showtimes/${editId}` : `${API}/showtimes`;
    const method = editId ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }

    setEditId(null);
    setF({ movieId: '', roomId: '', startAtMySQL: '', basePrice: 90000 });
    load();
  };

  const edit = st => {
    setEditId(st.id);
    setF({
      movieId: st.movieId || st.movie_id || '',
      roomId: st.roomId || st.room_id || '',
      startAtMySQL: st.startAt || st.start_at || '',
      basePrice: st.basePrice || st.base_price || 90000,
    });
  };

  const del = async id => {
    if (!confirm('Xoá suất chiếu này?')) return;
    const r = await fetch(`${API}/showtimes/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    load();
  };

  const inputValue = mysqlToInput(f.startAtMySQL);

  return (
    <section className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="text-lg font-semibold">Suất chiếu</h2>

      <form onSubmit={submit} className="grid md:grid-cols-5 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Phim</span>
          <select value={f.movieId} onChange={e => setF({ ...f, movieId: e.target.value })} className="border rounded px-2 py-2">
            <option value="">Chọn phim</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Phòng chiếu</span>
          <select value={f.roomId} onChange={e => setF({ ...f, roomId: e.target.value })} className="border rounded px-2 py-2">
            <option value="">Chọn phòng</option>
            {(rooms.items || rooms).map(r => (
              <option key={r.id} value={r.id}>{roomLabel(r)}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Bắt đầu</span>
          <input
            type="datetime-local"
            value={inputValue}
            onChange={e => setF({ ...f, startAtMySQL: inputToMySQL(e.target.value) })}
            className="border rounded px-2 py-2"
            required
          />
        </label>

        <div className="flex flex-col opacity-60 pointer-events-none">
          <span className="text-sm text-gray-600">Kết thúc (tự tính)</span>
          <input type="text" value="Auto by BE" readOnly className="border rounded px-2 py-2" />
        </div>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Giá vé cơ bản (VND)</span>
          <input
            type="number"
            value={f.basePrice}
            onChange={e => setF({ ...f, basePrice: e.target.value })}
            className="border rounded px-2 py-2"
          />
        </label>

        <div className="md:col-span-5 flex gap-2">
          <button className="px-4 rounded bg-black text-white">{editId ? 'Cập nhật' : 'Tạo'}</button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setF({ movieId: '', roomId: '', startAtMySQL: '', basePrice: 90000 }); }}
              className="px-4 rounded bg-gray-300"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {msg && <div className="text-sm text-red-600">{msg}</div>}

      <div className="space-y-2">
        {list.map(st => (
          <div key={st.id} className="border rounded p-2 flex justify-between text-sm">
            <div>
              #{st.id} • {st.title || '—'} • {st.roomName || '—'} • {st.startAt} → {st.endAt}
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(st)} className="text-blue-600 text-sm">Sửa</button>
              <button onClick={() => del(st.id)} className="text-red-600 text-sm">Xóa</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-gray-500">Chưa có dữ liệu.</div>}
      </div>
    </section>
  );
}
