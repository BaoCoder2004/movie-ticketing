// client/src/pages/Movies.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../lib/api';

export default function Movies(){
  const [items,setItems]=useState([]);
  const [q,setQ]=useState('');
  const [loading,setLoading]=useState(false);

  async function load(){
    setLoading(true);
    const r = await get('/movies', q?{search:q}:{});
    setItems(r.items||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex gap-2">
        <input className="border rounded-lg px-3 py-2 w-full" placeholder="Tìm phim…" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load} className="px-4 rounded-lg bg-black text-white">{loading?'...':'Tìm'}</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(m=>(
          <Link key={m.id} to={`/movies/${m.id}`} className="bg-white rounded-2xl shadow p-3 hover:ring-1 hover:ring-gray-200">
            <div className="font-medium">{m.title}</div>
            <div className="text-sm text-gray-600 mt-1">Thời lượng: {m.duration} phút</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
