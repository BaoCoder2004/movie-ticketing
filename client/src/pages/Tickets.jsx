// client/src/pages/Tickets.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../lib/api';

export default function Tickets(){
  const { orderId } = useParams();
  const [items,setItems]=useState([]);

  useEffect(()=>{ (async()=>{
    try{
      const r = await get('/tickets', { orderId });
      setItems(r.items || []);
    }catch{ setItems([]); }
  })(); },[orderId]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold">Vé của bạn</h1>
        <div className="mt-3 space-y-2">
          {items.map(t=>(
            <div key={t.id} className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">Ghế: {t.seatId}</div>
              <div className="font-mono break-all">{t.qrCode}</div>
            </div>
          ))}
          {items.length===0 && <div className="text-sm text-gray-600">Chưa thấy vé. Nếu vừa thanh toán, thử tải lại sau.</div>}
        </div>
      </div>
    </div>
  );
}
