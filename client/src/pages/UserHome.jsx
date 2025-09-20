import { useEffect, useState } from 'react';
import { getAuth, clearAuth } from '../lib/auth';
import { get } from '../lib/api';

export default function UserHome(){
  const u = getAuth();
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await get('/health');
        if (mounted) setHealth(h);
      } catch (e) {
        if (mounted) setErr(e?.message || 'Lỗi');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Trang chủ</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{u?.email}</span>
            <button
              className="px-3 py-1 rounded-lg border"
              onClick={()=>{ clearAuth(); location.href='/login'; }}
            >Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="text-gray-600 text-sm">Xin chào</div>
          <div className="text-2xl font-semibold">{u?.name || 'User'}</div>
          <div className="mt-2 text-sm text-gray-600">Vai trò: <b>{u?.role}</b></div>
          {err && <div className="mt-3 text-sm text-red-600">Health error: {String(err)}</div>}
          {health && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${health.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Hệ thống: {health.ok ? 'Sẵn sàng' : 'Sự cố'}</span>
            </div>
          )}
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="#" className="bg-white rounded-2xl shadow p-4 hover:ring-1 hover:ring-gray-200">
            <div className="font-medium">Đặt vé nhanh</div>
            <div className="text-sm text-gray-600 mt-1">Chọn suất chiếu và ghế (sẽ làm ở bước sau)</div>
          </a>
          <a href="#" className="bg-white rounded-2xl shadow p-4 hover:ring-1 hover:ring-gray-200">
            <div className="font-medium">Đơn hàng của tôi</div>
            <div className="text-sm text-gray-600 mt-1">Xem danh sách đơn đã tạo</div>
          </a>
          <a href="#" className="bg-white rounded-2xl shadow p-4 hover:ring-1 hover:ring-gray-200">
            <div className="font-medium">Vé của tôi</div>
            <div className="text-sm text-gray-600 mt-1">Xem mã QR đã phát hành</div>
          </a>
        </section>

        <section className="bg-white rounded-2xl shadow p-5">
          <div className="font-semibold mb-3">Thông báo</div>
          <div className="text-sm text-gray-600">Tính năng phim và suất chiếu sẽ được gắn sau khi kết nối TMDB và API showtimes.</div>
        </section>
      </main>
    </div>
  );
}
