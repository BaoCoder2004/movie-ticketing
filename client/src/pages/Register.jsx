import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../lib/api';

export default function Register(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [ok,setOk]=useState('');
  const [err,setErr]=useState('');
  const nav = useNavigate();

  async function onSubmit(e){
    e.preventDefault(); setErr(''); setOk('');
    try{
      await post('/users/register', { name, email, password });
      setOk('Đăng ký thành công. Hãy đăng nhập.');
      setTimeout(()=>nav('/login'), 500);
    }catch(ex){ setErr(ex?.message || 'Lỗi'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Đăng ký</h1>
        {ok && <div className="mb-3 text-green-700 text-sm">{ok}</div>}
        {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Họ tên"
            value={name} onChange={e=>setName(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email"
            value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Mật khẩu" type="password"
            value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-black text-white rounded-lg py-2">Tạo tài khoản</button>
        </form>
        <div className="text-sm mt-4">
          Đã có tài khoản? <Link className="text-blue-600" to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
