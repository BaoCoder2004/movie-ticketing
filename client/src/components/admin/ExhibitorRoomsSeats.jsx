// client/src/components/admin/ExhibitorRoomsSeats.jsx
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "/api";

// Lấy nhãn phòng: tên • định dạng
function roomLabel(r) {
  const name = r.name || r.roomName || r.room_name || `Phòng ${r.id}`;
  const fmt = r.formatType || r.format_type || "";
  return [name, fmt].filter(Boolean).join(" • ");
}

// Ghép nhãn ghế: hàng + số cột (theo quản lý ghế)
function seatLabel(s) {
  const row =
    s.row_label ?? s.rowLabel ?? s.row ?? ""; // ưu tiên row_label
  const col =
    s.col_number ?? s.colNumber ?? s.number ?? s.no ?? ""; // ưu tiên col_number
  return `${row}${col}`;
}

export default function ExhibitorRoomsSeats({ exhibitorId }) {
  const [rooms, setRooms] = useState([]);
  const [pickRoom, setPickRoom] = useState(null);
  const [pickRoomObj, setPickRoomObj] = useState(null);
  const [seats, setSeats] = useState([]);

  // tải danh sách phòng theo exhibitor
  useEffect(() => {
    if (!exhibitorId) {
      setRooms([]);
      setPickRoom(null);
      setPickRoomObj(null);
      setSeats([]);
      return;
    }
    fetch(`${API}/rooms?exhibitorId=${exhibitorId}&pageSize=500`)
      .then((r) => r.json())
      .then((d) => {
        const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
        setRooms(items);
        if (items.length) {
          setPickRoom(items[0].id);
          setPickRoomObj(items[0]);
        } else {
          setPickRoom(null);
          setPickRoomObj(null);
        }
      })
      .catch(() => {
        setRooms([]);
        setPickRoom(null);
        setPickRoomObj(null);
      });
  }, [exhibitorId]);

  // tải ghế theo phòng chọn
  useEffect(() => {
    if (!pickRoom) {
      setSeats([]);
      return;
    }
    fetch(`${API}/rooms/${pickRoom}/seats`)
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setSeats(d) : setSeats([])))
      .catch(() => setSeats([]));
  }, [pickRoom]);

  // nhóm phòng theo chi nhánh để render
  const grouped = useMemo(() => {
    const g = new Map();
    for (const r of rooms) {
      const branchId = r.branchId || r.branch_id || 0;
      const branchName = r.branchName || r.branch_name || `Branch ${branchId}`;
      const city = r.city || "";
      const key = `${branchId}|${branchName}|${city}`;
      if (!g.has(key)) g.set(key, []);
      g.get(key).push(r);
    }
    return Array.from(g.entries()).map(([k, arr]) => {
      const [id, name, city] = k.split("|");
      return { branchId: Number(id), branchName: name, city, rooms: arr };
    });
  }, [rooms]);

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      <h3 className="font-semibold">Phòng & Ghế theo Nhà phát hành</h3>

      {/* Danh sách phòng theo chi nhánh */}
      <div className="space-y-4">
        {grouped.map((b) => (
          <div key={b.branchId} className="border rounded p-3">
            <div className="font-medium">
              {b.branchName}
              {b.city ? ` • ${b.city}` : ""}
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-2">
              {b.rooms.map((r) => (
                <button
                  key={r.id}
                  className={`border rounded p-3 text-left ${
                    pickRoom === r.id ? "bg-black text-white" : ""
                  }`}
                  onClick={() => {
                    setPickRoom(r.id);
                    setPickRoomObj(r);
                  }}
                >
                  {roomLabel(r)}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!grouped.length && (
          <div className="text-gray-500 text-sm">Không có dữ liệu</div>
        )}
      </div>

      {/* Bảng ghế */}
      <div>
        <h4 className="font-medium mb-2">
          Ghế của {pickRoomObj ? roomLabel(pickRoomObj) : "—"}
        </h4>
        <div className="grid grid-cols-10 gap-1">
          {seats.map((s) => (
            <div
              key={s.id}
              className={`text-center text-xs border rounded py-1 ${
                s.is_blocked ? "bg-red-200" : "bg-gray-50"
              }`}
              title={seatLabel(s)}
            >
              {seatLabel(s)}
            </div>
          ))}
          {!seats.length && (
            <div className="text-gray-500 text-sm col-span-10">
              Chọn phòng để xem ghế
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
