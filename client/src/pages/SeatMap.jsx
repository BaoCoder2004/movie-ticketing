// client/src/pages/SeatMap.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api';
import { getAuth } from '../lib/auth';

const POLL_MS = 5000;

export default function SeatMap(){
  const { id } = useParams(); // showtimeId
  const nav = useNavigate();
  const user = useMemo(()=>getAuth(),[]);
  const [info,setInfo]=useState(null);
  const [seats,setSeats]=useState([]);
  const [picked,setPicked]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');

  async function load(){
    try{
      const i = await get(`/showtimes/${id}`);
      setInfo(i);
      const s = await get(`/showtimes/${id}/seats`, { userId: user?.id });
      setSeats(s.seats || []);
    }catch(e){ setErr(e?.message||'Lỗi'); }
  }
  useEffect(()=>{ load(); const t=setInterval(load, POLL_MS); return ()=>clearInterval(t); },[id]);

  function toggleSeat(seatId, status){
    if (status!=='AVAILABLE' && status!=='HELD_BY_ME') return;
    setPicked(p=>{
      const has = p.includes(seatId);
      if (has) return p.filter(x=>x!==seatId);
      return [...p, seatId];
    });
  }

  async function holdAndOrder(){
    if (picked.length===0) return;
    setLoading(true); setErr('');
    try{
      await post('/holds', { showtimeId: Number(id), seatIds: picked, userId: user.id });
      const o = await post('/orders', { userId: user.id, showtimeId: Number(id), seatIds: picked });
      sessionStorage.setItem(`order_showtime_${o.id}`, String(id));
      nav(`/checkout/${o.id}`);
    }catch(e){ setErr(e?.message || 'Lỗi'); }
    finally{ setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Chọn ghế</div>
            {info && <div className="text-sm text-gray-600">{info.title} • {new Date(info.start_at).toLocaleString('vi-VN')}</div>}
          </div>
          <button onClick={holdAndOrder} disabled={loading || picked.length===0}
                  className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50">
            {loading?'Đang xử lý…':`Tiếp tục (${picked.length})`}
          </button>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

        <div className="mt-5 grid grid-cols-8 sm:grid-cols-12 gap-2">
          {seats.map(s=>(
            <button key={s.seatId}
              onClick={()=>toggleSeat(s.seatId, s.status)}
              className={
                `h-10 rounded-lg text-sm `
                + (picked.includes(s.seatId) ? 'bg-blue-600 text-white'
                : s.status==='AVAILABLE' || s.status==='HELD_BY_ME' ? 'bg-gray-100 hover:bg-gray-200'
                : s.status==='HELD' ? 'bg-yellow-200 cursor-not-allowed'
                : 'bg-red-300 cursor-not-allowed')
              }>
              {s.seatId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
