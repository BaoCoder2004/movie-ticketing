// client/src/pages/MovieDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || '/api';
const dayRangeUtc = (d) => {
  const start = new Date(d); start.setHours(0,0,0,0);
  const end   = new Date(d); end.setHours(23,59,59,999);
  return { from: start.toISOString(), to: end.toISOString() };
};
const toLocal = s => s ? new Date(s).toLocaleString('vi-VN', { hour12:false }) : '-';

export default function MovieDetail(){
  const { id } = useParams();
  const [m, setM]   = useState(null);
  const [sts, setSts] = useState([]);

  useEffect(()=>{ (async()=>{
    const mv = await fetch(`${API}/movies/${id}`).then(r=>r.json());
    setM(mv);

    const { from, to } = dayRangeUtc(new Date());
    const qs = new URLSearchParams({ movieId: id, from, to }).toString();
    const j = await fetch(`${API}/showtimes?`+qs).then(r=>r.json()).catch(()=>({items:[]}));
    setSts(j.items || []);
  })(); },[id]);

  if (!m) return null;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-2xl font-semibold">{m.title}</h1>
        {m.duration_min != null && (
          <div className="text-sm text-gray-600 mt-2">Thời lượng: {m.duration_min} phút</div>
        )}
        {m.overview && <p className="mt-3 text-gray-700">{m.overview}</p>}
      </div>
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="font-semibold mb-3">Suất chiếu hôm nay</div>
        <div className="flex flex-wrap gap-2">
          {sts.map(s=>(
            <Link key={s.id} to={`/showtimes/${s.id}/seatmap`} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
              {toLocal(s.start_at)}
            </Link>
          ))}
          {sts.length===0 && <div className="text-sm text-gray-600">Chưa có lịch.</div>}
        </div>
      </div>
    </div>
  );
}
