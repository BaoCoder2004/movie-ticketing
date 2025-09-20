import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || '/api';
const toISOStart = d => new Date(`${d}T00:00:00.000Z`).toISOString();
const toISOEnd   = d => new Date(`${d}T23:59:59.999Z`).toISOString();
const money = n => (Number(n||0)).toLocaleString('vi-VN') + ' ₫';

async function getJson(url){
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || '';
  const t = await r.text();
  if (!ct.includes('application/json')) throw new Error(`${r.status} ${r.statusText}`);
  const d = JSON.parse(t);
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d;
}

/* ===== util: build dãy ngày và đổ 0 ===== */
const pad = n => String(n).padStart(2,'0');
const dstr = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
function daysBetween(from, to){
  const a=new Date(`${from}T00:00:00Z`), b=new Date(`${to}T00:00:00Z`);
  const out=[]; for(let d=new Date(a); d<=b; d.setUTCDate(d.getUTCDate()+1)) out.push(dstr(d));
  return out;
}
function fillDaily(from, to, rows){
  const map=new Map(rows.map(x=>[x.date,x]));
  return daysBetween(from,to).map(d=>({
    date:d,
    gross:Number(map.get(d)?.gross||0),
    refund:Number(map.get(d)?.refund||0),
    net:Number(map.get(d)?.net||0),
    tickets:Number(map.get(d)?.tickets||0),
    orders:Number(map.get(d)?.orders||0),
  }));
}

/* ===== Charts (SVG), luôn vẽ kể cả toàn 0 ===== */
function LineChart({ data, xKey='date', yKey='value', title }) {
  const H=220, W=Math.max(360,(data?.length||0)*50||360), P=30;
  const xs=(data||[]).map(d=>d[xKey]); const ys=(data||[]).map(d=>Number(d[yKey]||0));
  const max=Math.max(...ys,1);
  const X=i=>P+i*(W-2*P)/Math.max(1,(xs.length||1)-1||1);
  const Y=v=>(H-P)-(v/max)*(H-2*P);
  const path=(ys.length?ys:[0,0]).map((v,i)=>`${i?'L':'M'} ${X(i)} ${Y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect x="0" y="0" width={W} height={H} rx="12" className="fill-white stroke-gray-200" />
      <path d={path} className="stroke-sky-600 fill-none" strokeWidth="2"/>
      {ys.map((v,i)=>(<circle key={i} cx={X(i)} cy={Y(v)} r="2.5" className="fill-sky-600" />))}
      {(xs.length?xs:['', '']).map((d,i)=>(
        <text key={i} x={X(i)} y={H-6} textAnchor="middle" className="text-[10px] fill-gray-600">
          {String(d).slice(5)}
        </text>
      ))}
      {!data?.length && <text x={W/2} y={H/2} textAnchor="middle" className="text-xs fill-gray-500">Không có dữ liệu {title}</text>}
    </svg>
  );
}
function BarChart({ data, xKey='label', yKey='value', title }) {
  const H=220, bar=28, gap=16, n=(data?.length||0)||5, W=n*(bar+gap)+gap;
  const rows=data?.length?data:Array.from({length:n},()=>({[xKey]:'-',[yKey]:0}));
  const max=Math.max(...rows.map(d=>Number(d[yKey]||0)),1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect x="0" y="0" width={W} height={H} rx="12" className="fill-white stroke-gray-200" />
      {rows.map((d,i)=>{
        const v=Number(d[yKey]||0);
        const h=Math.round((v/max)*(H-40));
        const x=gap+i*(bar+gap), y=H-20-h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bar} height={h} rx="6" className="fill-sky-600" />
            <text x={x+bar/2} y={H-6} textAnchor="middle" className="text-[10px] fill-gray-600">
              {String(d[xKey]).slice(5)}
            </text>
          </g>
        );
      })}
      {!data?.length && <text x={W/2} y={H/2} textAnchor="middle" className="text-xs fill-gray-500">Không có dữ liệu {title}</text>}
    </svg>
  );
}

/* ===== KPI ===== */
function Kpi({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard(){
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = new Date(Date.now()-6*864e5).toISOString().slice(0,10);

  const [from,setFrom]=useState(weekAgo);
  const [to,setTo]=useState(today);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');

  const [sum,setSum]=useState(null);
  const [daily,setDaily]=useState([]);

  const netSeries = useMemo(()=> daily.map(d=>({date:d.date, value:d.net})),[daily]);
  const grossBars = useMemo(()=> daily.map(d=>({label:d.date, value:d.gross})),[daily]);

  const load = async ()=>{
    setErr(''); setLoading(true);
    try{
      const [s,d] = await Promise.all([
        getJson(`${API}/reports/summary?from=${encodeURIComponent(toISOStart(from))}&to=${encodeURIComponent(toISOEnd(to))}`),
        getJson(`${API}/reports/daily?from=${encodeURIComponent(toISOStart(from))}&to=${encodeURIComponent(toISOEnd(to))}`)
      ]);
      setSum(s);
      setDaily(fillDaily(from,to,d||[]));
    }catch(e){
      setErr(e.message);
      setSum(null);
      setDaily(fillDaily(from,to,[]));
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const setQuick = days => {
    const t=new Date(); const f=new Date(); f.setDate(t.getDate()-(days-1));
    setFrom(f.toISOString().slice(0,10)); setTo(t.toISOString().slice(0,10));
  };

  return (
    <section className="space-y-5">
      {/* Header + filters */}
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="mr-auto">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <div className="text-xs text-gray-500">Tổng quan doanh thu và vé theo ngày</div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Từ</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-3 py-2"/>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Đến</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-3 py-2"/>
          </div>
          <button onClick={load} disabled={loading} className="h-[38px] px-4 rounded bg-black text-white">
            {loading?'Đang tải…':'Tải'}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={()=>setQuick(7)} className="text-xs px-2 py-1 rounded border">7 ngày</button>
          <button onClick={()=>setQuick(30)} className="text-xs px-2 py-1 rounded border">30 ngày</button>
          <button onClick={()=>setQuick(90)} className="text-xs px-2 py-1 rounded border">90 ngày</button>
        </div>
        {err && <div className="mt-2 text-sm text-rose-600 break-words">{err}</div>}
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Doanh thu gộp" value={money(sum?.gross_revenue||0)} />
        <Kpi label="Hoàn tiền" value={money(sum?.refund_total||0)} />
        <Kpi label="Doanh thu ròng" value={money(sum?.net_revenue||0)} />
        <Kpi label="Vé đã bán" value={(sum?.tickets_sold||0).toLocaleString('vi-VN')}
             sub={`Đơn đã thanh toán: ${(sum?.orders_count||0).toLocaleString('vi-VN')}`} />
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Doanh thu gộp theo ngày</h3>
          <BarChart data={grossBars} title="doanh thu gộp" />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Doanh thu ròng theo ngày</h3>
          <LineChart data={netSeries} title="doanh thu ròng" />
        </div>
      </div>
    </section>
  );
}
