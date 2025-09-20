import { useEffect, useMemo, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "/api";

function toISOZ(localStr){ if(!localStr) return null; const d=new Date(localStr); return isNaN(d)?null:d.toISOString(); }

export default function MovieRelations({ movieId }) {
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");
  const [status, setStatus] = useState("");

  const [showtimes, setShowtimes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const f = toISOZ(fromLocal); const t = toISOZ(toLocal);
    if (f) p.set("from", f); if (t) p.set("to", t);
    return p.toString();
  }, [fromLocal, toLocal]);

  useEffect(() => {
    if (!movieId) return;
    (async () => {
      setLoading(true);
      try {
        const [s, e] = await Promise.all([
          fetch(`${API}/movies/${movieId}/showtimes?${qs}`),
          fetch(`${API}/movies/${movieId}/exhibitors`)
        ]);
        setShowtimes(Array.isArray(await s.json()) ? await s.json() : []);
        const ej = await e.json();
        setExhibitors(Array.isArray(ej.items) ? ej.items : []);
      } finally { setLoading(false); }
    })();
  }, [movieId, qs]);

  useEffect(() => {
    if (!movieId) return;
    const p = new URLSearchParams();
    const f = toISOZ(fromLocal); const t = toISOZ(toLocal);
    if (f) p.set("from", f); if (t) p.set("to", t);
    if (status) p.set("status", status);
    fetch(`${API}/movies/${movieId}/tickets?${p.toString()}`)
      .then(r=>r.json()).then(d=>setTickets(Array.isArray(d)?d:[]))
      .catch(()=>setTickets([]));
  }, [movieId, fromLocal, toLocal, status]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><label className="block text-xs text-gray-500">From</label>
          <input type="datetime-local" value={fromLocal} onChange={e=>setFromLocal(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-56"/></div>
        <div><label className="block text-xs text-gray-500">To</label>
          <input type="datetime-local" value={toLocal} onChange={e=>setToLocal(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-56"/></div>
        <div><label className="block text-xs text-gray-500">Ticket status</label>
          <select className="border rounded px-2 py-1 text-sm" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All</option><option value="ISSUED">ISSUED</option>
            <option value="SCANNED">SCANNED</option><option value="REFUNDED">REFUNDED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select></div>
        {loading && <span className="text-sm text-gray-500">Đang tải…</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h3 className="font-semibold mb-2">Suất chiếu</h3>
          <div className="max-h-72 overflow-auto divide-y">
            {showtimes.map(st=>(
              <div key={st.id} className="py-2 text-sm flex justify-between">
                <div><div className="font-medium">{st.room_name} • {st.format_type}</div>
                  <div className="text-gray-600">{st.branch_name} • {st.city}</div></div>
                <div className="text-right">
                  <div className="tabular-nums">{new Date(st.start_at).toISOString()}</div>
                  <div className="text-xs text-gray-500">{st.status}</div>
                </div>
              </div>
            ))}
            {!showtimes.length && <div className="text-sm text-gray-500">Không có dữ liệu</div>}
          </div>
        </section>

        <section className="border rounded p-3">
          <h3 className="font-semibold mb-2">Rạp phim đang chiếu</h3>
          {exhibitors.length ? (
            <ul className="space-y-2 text-sm">
              {exhibitors.map(x=>(
                <li key={x.id} className="flex justify-between">
                  <span className="font-medium">{x.name}</span>
                  <span className="text-gray-500">{x.branches} chi nhánh • {x.showtimes} suất</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-sm text-gray-500">Không có dữ liệu</div>}
        </section>
      </div>

      <section className="border rounded p-3">
        <h3 className="font-semibold mb-2">Vé</h3>
        <div className="max-h-72 overflow-auto text-sm">
          <table className="w-full border-collapse">
            <thead><tr className="text-left border-b">
              <th className="py-1 pr-2">ID</th><th className="py-1 pr-2">Trạng thái</th>
              <th className="py-1 pr-2">Chi nhánh</th><th className="py-1 pr-2">Bắt đầu</th>
            </tr></thead>
            <tbody>
              {tickets.map(t=>(
                <tr key={t.id} className="border-b">
                  <td className="py-1 pr-2">{t.id}</td>
                  <td className="py-1 pr-2">{t.status}</td>
                  <td className="py-1 pr-2">{t.branch_name} • {t.city}</td>
                  <td className="py-1 pr-2 tabular-nums">{new Date(t.start_at).toISOString()}</td>
                </tr>
              ))}
              {!tickets.length && <tr><td colSpan={4} className="py-2 text-gray-500">Không có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
