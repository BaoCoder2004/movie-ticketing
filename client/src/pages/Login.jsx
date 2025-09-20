import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../lib/api';
import { saveAuth } from '../lib/auth';

export default function Login({ mode }) { // 'USER' | 'ADMIN'
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  const nav = useNavigate();
  const title = mode==='ADMIN' ? 'Đăng nhập Admin' : 'Đăng nhập';

  async function onSubmit(e){
    e.preventDefault(); setErr('');
    try{
      const u = await post('/users/login', { email, password });
      if (mode==='ADMIN' && u.role!=='ADMIN') { setErr('Tài khoản không phải ADMIN'); return; }
      if (mode==='USER' && u.role==='ADMIN') { setErr('Dùng trang Admin để đăng nhập'); return; }
      saveAuth(u);
      nav(u.role==='ADMIN' ? '/admin' : '/');
    }catch(ex){ setErr(ex?.message || 'Lỗi'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">{title}</h1>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email"
            value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Mật khẩu" type="password"
            value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-black text-white rounded-lg py-2">Đăng nhập</button>
        </form>
        {mode!=='ADMIN' && (
          <div className="text-sm mt-4">
            Chưa có tài khoản? <Link className="text-blue-600" to="/register">Đăng ký</Link>
          </div>
        )}
      </div>
    </div>
  );
}
