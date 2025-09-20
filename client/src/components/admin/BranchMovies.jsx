// client/src/components/admin/BranchMovies.jsx
import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE || "/api";

function roomLabel(r) {
  const name = r.name || r.roomName || r.room_name || `Room ${r.id}`;
  const fmt = r.formatType || r.format_type || '';
  const cap = r.capacity;
  return [name, fmt, cap ? `${cap} ghế` : ''].filter(Boolean).join(' • ');
}

export default function BranchMovies({ branchId }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!branchId) { setRooms([]); return; }
    fetch(`${API}/rooms?branchId=${branchId}&pageSize=500`)
      .then(r=>r.json())
      .then(d=>setRooms(Array.isArray(d.items)?d.items:Array.isArray(d)?d:[]))
      .catch(()=>setRooms([]));
  }, [branchId]);

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-semibold mb-3">Phòng thuộc chi nhánh</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {rooms.map(r=>(
          <div key={r.id} className="border rounded p-3 text-sm">
            <div className="font-medium">{roomLabel(r)}</div>
            <div className="text-gray-500">
              {(r.branchName || r.branch_name) ? (r.branchName || r.branch_name) : '—'}
              {r.city ? ` • ${r.city}` : ''}
            </div>
          </div>
        ))}
        {!rooms.length && <div className="text-gray-500 text-sm">Không có dữ liệu</div>}
      </div>
    </div>
  );
}
