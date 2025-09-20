import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/api';
const IMG_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original';

// ===== helpers thời gian (LOCAL -> input "datetime-local") =====
function pad(n){ return String(n).padStart(2,'0'); }
function toInputLocal(d){
  const yy = d.getFullYear();
  const mm = pad(d.getMonth()+1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yy}-${mm}-${dd}T${hh}:${mi}`;
}
function localDayRangeForInput(base=new Date()){
  const s = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0,0,0,0);
  const e = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23,59,59,999);
  return { fromIn: toInputLocal(s), toIn: toInputLocal(e) };
}
const toLocalText = (s) => s ? new Date(s.replace(' ','T') + 'Z').toLocaleString('vi-VN', { hour12:false }) : '-';
// (ở API trả về 'YYYY-MM-DD HH:mm:ss' UTC, add 'Z' để hiển thị đúng giờ địa phương)

export default function AdminMovies() {
  // DB
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);

  // Liên kết: showtimes + exhibitors
  const [fromIn, setFromIn] = useState('');   // 'yyyy-MM-ddTHH:mm' (LOCAL)
  const [toIn, setToIn] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);

  const applyRangeDefaultToday = () => {
    const { fromIn, toIn } = localDayRangeForInput(new Date());
    setFromIn(fromIn);
    setToIn(toIn);
  };

  // TMDB
  const [cat, setCat] = useState('now_playing');
  const [page, setPage] = useState(1);
  const [feed, setFeed] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const [q, setQ] = useState('');
  const [tmdbList, setTmdbList] = useState([]);
  const [tmdbPick, setTmdbPick] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // ===== DB =====
  const loadDB = async () => {
    try {
      const r = await fetch(`${API}/movies?page=1&pageSize=500`);
      const d = await r.json();
      setList(d.items || []);
    } catch {
      setMsg('Không lấy được danh sách phim trong hệ thống');
    }
  };
  useEffect(() => { loadDB(); applyRangeDefaultToday(); }, []);

  const pickDB = async (id) => {
    setEditingId(id);
    const r = await fetch(`${API}/movies/${id}`);
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setDetail(d);
    await loadRelations(id, fromIn, toIn);
  };

  const saveDB = async (patch) => {
    if (!editingId) return;
    const r = await fetch(`${API}/movies/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
    });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    setMsg('Đã cập nhật'); await loadDB(); await pickDB(editingId);
  };
  const delDB = async (id) => {
    if (!confirm('Xóa phim này?')) return;
    const r = await fetch(`${API}/movies/${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (!r.ok) { setMsg(d?.message || 'Lỗi'); return; }
    if (editingId === id) { setEditingId(null); setDetail(null); }
    setMsg('Đã xóa'); await loadDB();
  };

  // ===== RELATIONS (showtimes + exhibitors) =====
  async function loadRelations(movieId, fromInput, toInput) {
    if (!movieId) return;

    // GỬI NGUYÊN 'datetime-local' (LOCAL). BE sẽ quy đổi -> UTC/MySQL.
    const qs = new URLSearchParams({ from: fromInput, to: toInput }).toString();

    const st = await fetch(`${API}/movies/${movieId}/showtimes?` + qs)
      .then(r => r.json()).catch(() => ({ items: [] }));
    setShowtimes(st.items || []);

    const ex = await fetch(`${API}/movies/${movieId}/exhibitors?` + qs)
      .then(r => r.json()).catch(() => ({ items: [] }));
    setExhibitors(ex.items || []);
  }

  const applyRange = async () => {
    if (!editingId) return;
    if (!fromIn || !toIn) applyRangeDefaultToday();
    await loadRelations(editingId, fromIn, toIn);
  };

  // ===== TMDB: catalog feed =====
  const loadFeed = async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const r = await fetch(`${API}/tmdb/list?cat=${cat}&page=${p}`);
      const d = await r.json();
      const items = d.items || [];
      setFeed(reset ? items : [...feed, ...items]);
      setPage((reset ? 1 : page) + 1);
      setHasMore((d.totalPages || 1) >= (reset ? 2 : page + 1));
    } finally { setLoading(false); }
  };
  useEffect(() => { setPage(1); setHasMore(true); setFeed([]); loadFeed(true); }, [cat]);

  // ===== TMDB: search + detail + import =====
  const searchTMDB = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const r = await fetch(`${API}/tmdb/search?query=${encodeURIComponent(q)}`);
      const d = await r.json();
      setTmdbList(d.items || []);
    } finally { setLoading(false); }
  };
  const openTMDB = async (tmdbId) => {
    setLoading(true); setMsg('');
    try {
      const r = await fetch(`${API}/tmdb/movie/${tmdbId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message || 'TMDB lỗi');
      setTmdbPick(d);
    } catch (e) { setMsg(String(e.message || e)); }
    finally { setLoading(false); }
  };
  const importTMDB = async (tmdbId) => {
    setLoading(true); setMsg('');
    try {
      const r = await fetch(`${API}/tmdb/import/${tmdbId}`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message || 'Import lỗi');
      setMsg('Đã import'); await loadDB();
    } catch (e) { setMsg(String(e.message || e)); }
    finally { setLoading(false); }
  };

  const trailerEmbed = useMemo(() => {
    if (!tmdbPick?.trailer || tmdbPick.trailer.site !== 'YouTube') return null;
    return `https://www.youtube.com/embed/${tmdbPick.trailer.key}`;
  }, [tmdbPick]);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Quản lý phim</h2>
      {msg && <div className="text-sm text-emerald-700">{msg}</div>}

      {/* 1) Danh sách trong hệ thống */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-medium mb-3">Trong hệ thống</h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-[720px]">
            {list.map(m => (
              <div key={m.id} className="w-44 flex-shrink-0 border rounded-lg overflow-hidden">
                {m.posterUrl
                  ? <img src={m.posterUrl} alt="" className="w-44 h-64 object-cover" />
                  : <div className="w-44 h-64 flex items-center justify-center text-xs text-gray-500">No poster</div>}
                <div className="p-2 text-sm">
                  <div className="font-medium line-clamp-2">{m.title}</div>
                  <div className="text-gray-500">{m.durationMin} phút</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => pickDB(m.id)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Sửa</button>
                    <button onClick={() => delDB(m.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Xóa</button>
                  </div>
                </div>
              </div>
            ))}
            {list.length === 0 && <div className="text-sm text-gray-500 p-3">Chưa có dữ liệu.</div>}
          </div>
        </div>

        {detail && (
          <div className="mt-4 grid md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              {detail.posterUrl && <img src={detail.posterUrl} alt="" className="w-full rounded-lg" />}
            </div>
            <div className="md:col-span-3 space-y-3">
              <div className="text-xl font-semibold">{detail.title}</div>
              <div className="text-sm text-gray-600">{detail.releaseDate || ''}</div>
              <div className="text-sm text-gray-600">Độ tuổi: {detail.ratingAge || 'N/A'}</div>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={4}
                value={detail.description || ''}
                onChange={(e) => setDetail({ ...detail, description: e.target.value })}
                placeholder="Mô tả"
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded bg-black text-white" onClick={() => saveDB({ description: detail.description })}>Lưu</button>
                <button className="px-4 py-2 rounded bg-gray-200" onClick={() => { setEditingId(null); setDetail(null); }}>Đóng</button>
              </div>

              {/* Bộ lọc thời gian và danh sách liên kết */}
              <div className="mt-3 p-3 border rounded-xl">
                <div className="flex items-end gap-3">
                  <label className="text-sm">From
                    <input type="datetime-local" className="border rounded px-2 py-1 ml-2"
                      value={fromIn}
                      onChange={(e) => setFromIn(e.target.value)} />
                  </label>
                  <label className="text-sm">To
                    <input type="datetime-local" className="border rounded px-2 py-1 ml-2"
                      value={toIn}
                      onChange={(e) => setToIn(e.target.value)} />
                  </label>
                  <button onClick={applyRange} className="h-9 px-4 rounded bg-black text-white">Lọc</button>
                  <button onClick={() => { applyRangeDefaultToday(); applyRange(); }} className="h-9 px-3 rounded bg-gray-200">Hôm nay</button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div className="border rounded-lg p-2">
                    <div className="font-semibold mb-2">Suất chiếu</div>
                    {showtimes.length === 0 && <div className="text-sm text-gray-500">Không có dữ liệu</div>}
                    <ul className="space-y-1 text-sm">
                      {showtimes.map(s => (
                        <li key={s.id}>#{s.id} • {s.room_name || 'Phòng ?'} • {toLocalText(s.start_at)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded-lg p-2">
                    <div className="font-semibold mb-2">Rạp phim đang chiếu</div>
                    {exhibitors.length === 0 && <div className="text-sm text-gray-500">Không có dữ liệu</div>}
                    <ul className="space-y-1 text-sm">
                      {exhibitors.map(x => (
                        <li key={`${x.exhibitorId}-${x.branchId}`}>
                          {x.exhibitorName} • {x.branchName} • {x.city} • {x.showtimes} suất
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2) Danh mục TMDB */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Danh mục TMDB</h3>
          <div className="flex gap-2 text-sm">
            {['now_playing', 'popular', 'top_rated', 'upcoming'].map(k => (
              <button
                key={k}
                onClick={() => { setCat(k); }}
                className={`px-3 py-1 rounded ${cat === k ? 'bg-black text-white' : 'bg-gray-200'}`}
              >
                {k.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-[720px]">
            {feed.map(t => (
              <div key={t.tmdbId} className="w-44 flex-shrink-0 border rounded-lg overflow-hidden cursor-pointer">
                {t.posterPath
                  ? <img src={`${IMG_BASE}${t.posterPath}`} className="w-44 h-64 object-cover" alt="" />
                  : <div className="w-44 h-64 flex items-center justify-center text-xs text-gray-500">No poster</div>}
                <div className="p-2 text-sm">
                  <div className="font-medium line-clamp-2">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.releaseDate || ''}</div>
                  <div className="text-xs">★ {t.voteAverage ?? '-'}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openTMDB(t.tmdbId)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Chi tiết</button>
                    <button onClick={() => importTMDB(t.tmdbId)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Import</button>
                  </div>
                </div>
              </div>
            ))}
            {feed.length === 0 && <div className="text-sm text-gray-500 p-3">Không có dữ liệu.</div>}
          </div>
        </div>
        {hasMore && (
          <div className="mt-3">
            <button onClick={() => loadFeed(false)} className="px-4 py-2 rounded bg-gray-100 border">Tải thêm</button>
          </div>
        )}
      </div>

      {/* 3) Tìm kiếm TMDB */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-medium mb-2">Tìm trên TMDB</h3>
        <form onSubmit={searchTMDB} className="flex gap-2 mb-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Từ khóa TMDB"
            className="border rounded px-3 py-2 w-full" />
          <button className="px-4 rounded bg-black text-white" disabled={loading}>Tìm</button>
        </form>

        <div className="overflow-x-auto mb-4">
          <div className="flex gap-3 min-w-[720px]">
            {tmdbList.map(t => (
              <div key={t.tmdbId} className="w-44 flex-shrink-0 border rounded-lg overflow-hidden">
                {t.posterPath
                  ? <img src={`${IMG_BASE}${t.posterPath}`} className="w-44 h-64 object-cover" alt="" />
                  : <div className="w-44 h-64 flex items-center justify-center text-xs text-gray-500">No poster</div>}
                <div className="p-2 text-sm">
                  <div className="font-medium line-clamp-2">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.releaseDate || ''}</div>
                  <div className="text-xs">★ {t.voteAverage ?? '-'}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openTMDB(t.tmdbId)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Chi tiết</button>
                    <button onClick={() => importTMDB(t.tmdbId)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Import</button>
                  </div>
                </div>
              </div>
            ))}
            {tmdbList.length === 0 && <div className="text-sm text-gray-500 p-3">Chưa có kết quả.</div>}
          </div>
        </div>

        {tmdbPick && (
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-3 md:col-span-2">
              {tmdbPick.posterPath && <img src={`${IMG_BASE}${tmdbPick.posterPath}`} className="w-full rounded-lg" alt="" />}
              {tmdbPick.backdropPath && <img src={`${IMG_BASE}${tmdbPick.backdropPath}`} className="w-full rounded-lg" alt="" />}
            </div>
            <div className="space-y-3 md:col-span-3">
              <div className="text-2xl font-semibold">{tmdbPick.title}</div>
              <div className="text-sm text-gray-600">{tmdbPick.releaseDate} • {tmdbPick.runtime} phút</div>
              <div className="text-sm">★ {tmdbPick.voteAverage ?? '-'} ({tmdbPick.voteCount ?? 0}) • {tmdbPick.ratingAge || 'N/A'}</div>
              <p className="text-sm whitespace-pre-wrap">{tmdbPick.overview || '(Không có mô tả)'}</p>
              {trailerEmbed && (
                <div className="aspect-video">
                  <iframe className="w-full h-full rounded-lg" src={trailerEmbed} title="Trailer" allowFullScreen />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => importTMDB(tmdbPick.tmdbId)} className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={loading}>
                  Import vào hệ thống
                </button>
                <button onClick={() => setTmdbPick(null)} className="px-4 py-2 rounded bg-gray-200">Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
