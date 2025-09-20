import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/movies', label: 'Quản lý phim' },
  { to: '/admin/cinemas', label: 'Quản lý rạp chiếu' },
  { to: '/admin/branches', label: 'Quản lý chi nhánh' },
  { to: '/admin/rooms', label: 'Quản lý phòng chiếu' },
  { to: '/admin/seats', label: 'Quản lý ghế' },
  { to: '/admin/showtimes', label: 'Quản lý suất chiếu' },
  { to: '/admin/users', label: 'Quản lý người dùng' },
  { to: '/admin/orders', label: 'Quản lý đơn hàng' },
  { to: '/admin/payments', label: 'Quản lý thanh toán' },
  { to: '/admin/tickets', label: 'Quản lý vé' },
  { to: '/admin/vouchers', label: 'Quản lý voucher' },
  { to: '/admin/reports', label: 'Báo cáo' },
];

export default function AdminSidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r">
      <div className="px-4 py-4 border-b">
        <div className="text-lg font-semibold">Admin</div>
        <div className="text-xs text-gray-500">Movie Ticketing 2.0</div>
      </div>
      <nav className="p-2 space-y-1">
        {items.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
