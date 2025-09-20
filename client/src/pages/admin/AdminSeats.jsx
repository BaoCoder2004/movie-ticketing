import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/api';

// util tạo nhãn hàng: A,B,...,Z, AA, AB,...
function makeRowLabels(n){
  const out = [];
  for (let i=0;i<n;i++){
    let s = '', x = i;
    do { s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x/26) - 1; } while (x >= 0);
    out.push(s);
  }
  return out;
}

const TYPES = [
  { key: 'OFF',      label: 'Không đặt', cls: 'bg-gray-200 text-gray-600' },
  { key: 'STANDARD', label: 'Thường',    cls: 'bg-green-200 border border-green-600' },
  { key: 'VIP',      label: 'VIP',       cls: 'bg-yellow-200 border border-yellow-600' },
  { key: 'DOUBLE',   label: 'Sweetbox',  cls: 'bg-pink-200 border border-pink-600' },
];

export default function AdminSeats(){
  // chọn hệ thống rạp → phòng
  const [exs, setExs] = useState([]);
  const [exId, setExId] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(0);

  // lưới
  const [rowsN, setRowsN] = useState(10);
  const [colsN, setColsN] = useState(15);
  const [grid, setGrid] = useState({}); // key `${r}|${c}` => 'OFF'|'STANDARD'|'VIP'|'DOUBLE'
  const [tool, setTool] = useState('STANDARD');
  const [msg, setMsg] = useState('');

  // load exhibitors
  useEffect(()=>{ (async()=>{
    const r = await fetch(`${API}/exhibitors?pageSize=500`); const d = await r.json();
    setExs(d.items||[]);
  })(); },[]);
  // load rooms theo exhibitor
  useEffect(()=>{ (async()=>{
    setRooms([]); setRoomId(0);
    if(!exId) return;
    const r = await fetch(`${API}/exhibitors/${exId}/rooms`); const d = await r.json();
    setRooms(Array.isArray(d)?d:[]);
  })(); },[exId]);

  // tải seats của phòng
  async function loadSeats(id){
    setMsg('');
    if(!id) return;
    const r = await fetch(`${API}/rooms/${id}/seats`);
    const d = await r.json();
    const list = Array.isArray(d) ? d : (d.items||[]);
    // ước lượng rows/cols
    const rows = new Set(); let maxCol = 0;
    const m = {};
    for (const s of list){
      const rl = s.row_label ?? s.rowLabel;
      const cn = s.col_number ?? s.colNumber;
      const tp = (s.seat_type ?? s.seatType ?? 'STANDARD').toUpperCase();
      rows.add(rl); if (cn>maxCol) maxCol = cn;
      m[`${rl}|${cn}`] = ['STANDARD','VIP','DOUBLE'].includes(tp) ? tp : 'STANDARD';
    }
    setRowsN(Math.max(rows.size || 10, 1));
    setColsN(Math.max(maxCol || 15, 1));
    setGrid(m);
  }
  useEffect(()=>{ if(roomId) loadSeats(roomId); },[roomId]);

  const rowLabels = useMemo(()=>makeRowLabels(rowsN),[rowsN]);
  const cells = (rl)=> Array.from({length: colsN}, (_,i)=> i+1).map(cn => {
    const key = `${rl}|${cn}`;
    return { rl, cn, type: grid[key] ?? 'OFF', key };
  });

  function paintCell(rl, cn){
    const key = `${rl}|${cn}`;
    setGrid(g => ({ ...g, [key]: tool }));
  }

  function clearAll(){
    setGrid({});
  }

  async function save(){
    setMsg('');
    if (!roomId) { setMsg('Chưa chọn phòng'); return; }
    const seats = [];
    for (const [k, v] of Object.entries(grid)){
      if (v === 'OFF') continue;
      const [rl, cn] = k.split('|'); seats.push({ rowLabel: rl, colNumber: Number(cn), seatType: v });
    }
    if (seats.length === 0) { setMsg('Chưa có ghế nào'); return; }
    const r = await fetch(`${API}/rooms/${roomId}/seats/layout`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ seats })
    });
    const d = await r.json();
    if(!r.ok){ setMsg(d?.message || 'Lưu lỗi'); return; }
    setMsg(`Đã lưu ${d.inserted} ghế`);
    loadSeats(roomId);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Quản lý ghế</h2>

      {/* Chọn rạp & phòng */}
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Hệ thống rạp</span>
          <select value={exId} onChange={e=>setExId(Number(e.target.value))} className="border rounded px-3 py-2 min-w-56">
            <option value={0}>-- Chọn hệ thống rạp --</option>
            {exs.map(x=> <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Phòng chiếu</span>
          <select value={roomId} onChange={e=>setRoomId(Number(e.target.value))} className="border rounded px-3 py-2 min-w-56">
            <option value={0}>-- Chọn phòng --</option>
            {rooms.map(r=> <option key={r.id} value={r.id}>{r.branch_name ? `${r.branch_name} • `:''}{r.name}</option>)}
          </select>
        </label>
      </div>

      {/* Cấu hình lưới + công cụ */}
      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Số hàng</span>
            <input type="number" min={1} value={rowsN} onChange={e=>setRowsN(Math.max(1,Number(e.target.value||1)))} className="border rounded px-3 py-2 w-28"/>
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Số cột</span>
            <input type="number" min={1} value={colsN} onChange={e=>setColsN(Math.max(1,Number(e.target.value||1)))} className="border rounded px-3 py-2 w-28"/>
          </label>

          <div className="ml-auto flex flex-wrap gap-2">
            {TYPES.map(t=>(
              <button key={t.key}
                onClick={()=>setTool(t.key)}
                className={`px-3 py-2 rounded ${tool===t.key?'ring-2 ring-black':''} ${t.cls} text-sm`}>
                {t.label}
              </button>
            ))}
            <button onClick={clearAll} className="px-3 py-2 rounded bg-gray-100 border text-sm">Xóa toàn bộ</button>
            <button onClick={save} className="px-4 py-2 rounded bg-black text-white text-sm">Lưu layout</button>
          </div>
        </div>

        {msg && <div className="text-sm text-emerald-700">{msg}</div>}

        {/* Lưới ghế */}
        <div className="mt-3 overflow-x-auto">
          <div className="inline-block p-4 bg-gray-50 rounded-xl border">
            <div className="text-center text-sm text-gray-600 mb-2">SCREEN</div>
            <div className="space-y-2">
              {rowLabels.map(rl=>(
                <div key={rl} className="flex items-center gap-2">
                  <div className="w-6 text-right font-medium">{rl}</div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${colsN}, 2rem)` }}>
                    {cells(rl).map(cell=>{
                      const t = TYPES.find(x=>x.key===cell.type) || TYPES[0];
                      return (
                        <button key={cell.key}
                          onClick={()=>paintCell(cell.rl, cell.cn)}
                          className={`h-8 text-[11px] rounded select-none ${t.cls}`}
                          title={`${cell.rl}${cell.cn}`}>
                          {cell.rl}{cell.cn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Chú thích */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {TYPES.map(t=>(
                <div key={t.key} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded inline-block ${t.cls}`}></span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Sau khi lưu, trang người dùng sẽ tự đánh dấu ghế đã giữ/đã bán từ API suất chiếu.
        </p>
      </div>
    </section>
  );
}
