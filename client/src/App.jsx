import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserHome from './pages/UserHome';

import AdminLayout from './layouts/AdminLayout';
import { getAuth } from './lib/auth';

// User booking flow
import MoviesList from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import SeatMap from './pages/SeatMap';
import Checkout from './pages/Checkout';
import OrderTickets from './pages/Tickets';

// Admin placeholders
import AdminDashboard from './pages/admin/AdminDashboard';
import Movies from './pages/admin/AdminMovies';
import Cinemas from './pages/admin/AdminCinemas';
import Branches from './pages/admin/AdminBranches';
import Rooms from './pages/admin/AdminRooms';
import Seats from './pages/admin/AdminSeats';
import Showtimes from './pages/admin/AdminShowtimes';
import Users from './pages/admin/AdminUsers';
import Orders from './pages/admin/AdminOrders';
import Payments from './pages/admin/AdminPayments';
import Tickets from './pages/admin/AdminTickets';
import Vouchers from './pages/admin/AdminVouchers';
import Reports from './pages/admin/AdminReports';

function RequireAuth({ children }) {
  const u = getAuth();
  return u ? children : <Navigate to="/login" replace />;
}
function RequireAdmin({ children }) {
  const u = getAuth();
  if (!u) return <Navigate to="/admin/login" replace />;
  return u.role === 'ADMIN' ? children : <Navigate to="/login" replace />;
}
function RequireUser({ children }) {
  const u = getAuth();
  if (!u) return <Navigate to="/login" replace />;
  return u.role === 'ADMIN' ? <Navigate to="/admin" replace /> : children;
}
function RedirectIfAuthed({ children, admin = false }) {
  const u = getAuth();
  if (!u) return children;
  if (admin && u.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (!admin && u.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<RedirectIfAuthed><Login mode="USER" /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
        <Route path="/admin/login" element={<RedirectIfAuthed admin={true}><Login mode="ADMIN" /></RedirectIfAuthed>} />

        {/* User area */}
        <Route path="/" element={<RequireUser><UserHome /></RequireUser>} />
        <Route path="/movies" element={<RequireUser><MoviesList /></RequireUser>} />
        <Route path="/movies/:id" element={<RequireUser><MovieDetail /></RequireUser>} />
        <Route path="/showtimes/:id/seatmap" element={<RequireUser><SeatMap /></RequireUser>} />
        <Route path="/checkout/:orderId" element={<RequireUser><Checkout /></RequireUser>} />
        <Route path="/tickets/:orderId" element={<RequireUser><OrderTickets /></RequireUser>} />

        {/* Admin area */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<Movies />} />
          <Route path="cinemas" element={<Cinemas />} />
          <Route path="branches" element={<Branches />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="seats" element={<Seats />} />
          <Route path="showtimes" element={<Showtimes />} />
          <Route path="users" element={<Users />} />
          <Route path="orders" element={<Orders />} />
          <Route path="payments" element={<Payments />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
