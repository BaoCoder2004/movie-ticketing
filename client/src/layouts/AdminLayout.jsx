import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { getAuth, clearAuth } from '../lib/auth';

export default function AdminLayout() {
  const u = getAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="text-base text-gray-600">Xin chào, <b>{u?.name}</b></div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{u?.email}</span>
              <button
                onClick={()=>{ clearAuth(); nav('/admin/login'); }}
                className="px-3 py-1 rounded-lg border"
              >Đăng xuất</button>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
