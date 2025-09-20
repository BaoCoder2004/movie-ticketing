import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/api';
const toISOStart = d => new Date(`${d}T00:00:00.000Z`).toISOString();
const toISOEnd   = d => new Date(`${d}T23:59:59.999Z`).toISOString();
const fmtMoney = n => (Number(n||0)).toLocaleString('vi-VN') + ' đ';
const toLocalDT = s => s ? new Date(s).toLocaleString('vi-VN') : '-';

async function getJson(url){
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (!ct.includes('application/json')) throw new Error(`${r.status} ${r.statusText}`);
  const d = JSON.parse(text);
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d;
}
async function getJsonOcc(url){
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();
  if (r.status === 404) return [];
  if (!ct.includes('application/json')) throw new Error(`${r.status} ${r.statusText}`);
  const d = JSON.parse(text);
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d;
}

function Card({ label, value }) {
  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function EmptyBox({ title, height=220 }) {
  return (
    <div className="rounded-xl border bg-white flex items-center justify-center"
         style={{height}}>
      <div className="text-sm text-gray-500">Không có dữ liệu {title?.toLowerCase?.() || ''}</div>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, height=220, title='' }) {
  if (!data?.length) return <EmptyBox title={title} height={height} />;
  const max = Math.max(1, ...data.map(d => Number(d[valueKey] || 0)));
  const barW = 32, gap = 16;
  const width = data.length * (barW + gap) + gap;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-xl border">
      {data.map((d, i) => {
        const v = Number(d[valueKey] || 0);
        const h = Math.round((v / max) * (height - 40));
        const x = gap + i * (barW + gap);
        const y = height - 20 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="6" className="fill-gray-800" />
            <text x={x + barW/2} y={height - 6} textAnchor="middle" className="text-[10px] fill-gray-700">
              {String(d[labelKey]).slice(0,12)}
            </text>
            <text x={x + barW/2} y={y - 4} textAnchor="middle" className="text-[10px] fill-gray-700">
              {v.toLocaleString('vi-VN')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, xKey='date', yKey='net', height=220, title='' }) {
  if (!data?.length) return <EmptyBox title={title} height={height} />;
  const pad = 30;
  const width = Math.max(320, data.length * 50);
  const xs = data.map(d => d[xKey]);
  const ys = data.map(d => Number(d[yKey]||0));
  const minY = 0, maxY = Math.max(...ys, 1);
  const x = i => pad + (i * (width - 2*pad) / Math.max(1, xs.length - 1));
  const y = v => (height - pad) - ((v - minY) / (maxY - minY)) * (height - 2*pad);
  const path = ys.map((v,i)=>`${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-xl border">
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} className="stroke-gray-300" />
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} className="stroke-gray-300" />
      <path d={path} className="stroke-emerald-600 fill-none" strokeWidth="2" />
      {ys.map((v,i)=>(<circle key={i} cx={x(i)} cy={y(v)} r="2.5" className="fill-emerald-600" />))}
      {xs.map((d,i)=>(
        <text key={i} x={x(i)} y={height-6} textAnchor="middle" className="text-[10px] fill-gray-700">
          {String(d).slice(5)}
        </text>
      ))}
    </svg>
  );
}

export default function AdminReports(){
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = new Date(Date.now() - 6*864e5).toISOString().slice(0,10);

  const [from,setFrom]=useState(weekAgo);
  const [to,setTo]=useState(today);
  const [occDate,setOccDate]=useState(today);

  const [sum,setSum]=useState(null);
  const [daily,setDaily]=useState([]);
  const [top,setTop]=useState([]);
  const [occ,setOcc]=useState([]);

  const [msgMain,setMsgMain]=useState('');
  const [msgOcc,setMsgOcc]=useState('');

  const loadMain = async ()=>{
    setMsgMain('');
    try{
      const [d1,d2,d3] = await Promise.all([
        getJson(`${API}/reports/summary?from=${encodeURIComponent(toISOStart(from))}&to=${encodeURIComponent(toISOEnd(to))}`),
        getJson(`${API}/reports/daily?from=${encodeURIComponent(toISOStart(from))}&to=${encodeURIComponent(toISOEnd(to))}`),
        getJson(`${API}/reports/top-movies?from=${encodeURIComponent(toISOStart(from))}&to=${encodeURIComponent(toISOEnd(to))}&limit=10`)
      ]);
      setSum(d1); setDaily(d2); setTop(d3);
    }catch(e){ setMsgMain(e.message); setSum(null); setDaily([]); setTop([]); }
  };

  const loadOcc = async ()=>{
    setMsgOcc('');
    try{
      const d4 = await getJsonOcc(`${API}/reports/occupancy?date=${encodeURIComponent(occDate)}`);
      setOcc(d4);
    }catch(e){ setMsgOcc(e.message); setOcc([]); }
  };

  useEffect(()=>{ loadMain(); loadOcc(); /* eslint-disable-next-line */ },[]);

  // CSV
  const csv = (rows, name)=>{
    const out = rows.map(r => r.map(x => {
      const s = String(x ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([out], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };
  const exportDaily = ()=> csv([['date','gross','refund','net','tickets','orders'], ...daily.map(d=>[d.date,d.gross,d.refund,d.net,d.tickets,d.orders])], `daily_${from}_to_${to}.csv`);
  const exportTop = ()=> csv([['movie_id','title','tickets_sold'], ...top.map(x=>[x.movie_id,x.title,x.tickets_sold])], `top_${from}_to_${to}.csv`);
  const exportOcc = ()=> csv([['showtime_id','movie_title','starts_at','sold','capacity','occupancy'], ...occ.map(x=>[x.showtime_id,x.movie_title,x.starts_at,x.sold,x.capacity,x.occupancy])], `occ_${occDate}.csv`);

  const netSeries = daily.map(d => ({ date: d.date, net: d.net }));
  const ticketsSeries = daily.map(d => ({ date: d.date, tickets: d.tickets }));
  const totalOcc = useMemo(()=>occ.reduce((a,b)=>a + (b.capacity||0),0),[occ]);
  const totalSold = useMemo(()=>occ.reduce((a,b)=>a + (b.sold||0),0),[occ]);

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h2 className="text-xl font-semibold">Báo cáo</h2>

        {/* Bộ lọc */}
        <div className="grid lg:grid-cols-2 gap-3">
          <div className="border rounded p-3 space-y-2">
            <div className="text-sm font-medium">Khoảng thời gian</div>
            <div className="flex flex-wrap gap-2">
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2"/>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2"/>
              <button onClick={()=>{ loadMain(); loadOcc(); }} className="px-3 rounded bg-black text-white">Tải</button>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{const d=new Date(); d.setDate(d.getDate()-6); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10));}}
                      className="text-xs px-2 py-1 rounded border">7 ngày</button>
              <button onClick={()=>{const d=new Date(); d.setDate(d.getDate()-29); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10));}}
                      className="text-xs px-2 py-1 rounded border">30 ngày</button>
            </div>
            {msgMain && <div className="text-sm text-rose-600 break-words">{msgMain}</div>}
          </div>

          <div className="border rounded p-3 space-y-2">
            <div className="text-sm font-medium">Ngày tính occupancy</div>
            <div className="flex gap-2">
              <input type="date" value={occDate} onChange={e=>setOccDate(e.target.value)} className="border rounded px-3 py-2"/>
              <button onClick={loadOcc} className="px-3 rounded border">Làm mới</button>
            </div>
            {msgOcc && <div className="text-sm text-rose-600 break-words">{msgOcc}</div>}
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-5 gap-3">
          <Card label="Doanh thu gộp" value={fmtMoney(sum?.gross_revenue || 0)} />
          <Card label="Hoàn tiền" value={fmtMoney(sum?.refund_total || 0)} />
          <Card label="Doanh thu ròng" value={fmtMoney(sum?.net_revenue || 0)} />
          <Card label="Vé đã bán" value={(sum?.tickets_sold || 0).toLocaleString('vi-VN')} />
          <Card label="Đơn đã thanh toán" value={(sum?.orders_count || 0).toLocaleString('vi-VN')} />
        </div>

        {/* Doanh thu theo ngày */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Doanh thu ròng theo ngày</h3>
            <button onClick={exportDaily} className="text-sm px-3 py-1 rounded border">Xuất CSV</button>
          </div>
          <LineChart data={netSeries} xKey="date" yKey="net" title="doanh thu" />
        </div>

        {/* Vé theo ngày */}
        <div className="space-y-2">
          <h3 className="font-medium">Vé bán theo ngày</h3>
          <LineChart data={ticketsSeries} xKey="date" yKey="tickets" title="vé theo ngày" />
        </div>

        {/* Top phim */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Top phim theo vé bán</h3>
            <button onClick={exportTop} className="text-sm px-3 py-1 rounded border">Xuất CSV</button>
          </div>
          <BarChart data={top.map(x => ({ label: x.title, value: x.tickets_sold }))} labelKey="label" valueKey="value" title="top phim" />

          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Phim</th>
                  <th className="p-2 text-left">Vé bán</th>
                </tr>
              </thead>
              <tbody>
                {top.map((m,i)=>(
                  <tr key={m.movie_id} className="border-t">
                    <td className="p-2">{i+1}</td>
                    <td className="p-2">{m.title}</td>
                    <td className="p-2">{m.tickets_sold}</td>
                  </tr>
                ))}
                {top.length===0 && <tr><td colSpan={3} className="p-3 text-gray-500">Không có dữ liệu.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Occupancy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Occupancy {occDate} — Tổng {totalSold}/{totalOcc} ghế</h3>
            <button onClick={exportOcc} className="text-sm px-3 py-1 rounded border">Xuất CSV</button>
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Suất</th>
                  <th className="p-2 text-left">Phim</th>
                  <th className="p-2 text-left">Bắt đầu</th>
                  <th className="p-2 text-left">Đã bán</th>
                  <th className="p-2 text-left">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {occ.map(o=>(
                  <tr key={o.showtime_id} className="border-t">
                    <td className="p-2">#{o.showtime_id}</td>
                    <td className="p-2">{o.movie_title}</td>
                    <td className="p-2">{toLocalDT(o.starts_at)}</td>
                    <td className="p-2">{o.sold}/{o.capacity}</td>
                    <td className="p-2">
                      <div className="w-48 h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-emerald-600 rounded" style={{ width: `${Math.min(100, Math.round((o.occupancy||0)*100))}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 ml-2">{Math.round((o.occupancy||0)*100)}%</span>
                    </td>
                  </tr>
                ))}
                {occ.length===0 && <tr><td colSpan={5} className="p-3 text-gray-500">Không có dữ liệu.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
