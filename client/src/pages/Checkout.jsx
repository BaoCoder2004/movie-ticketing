// client/src/pages/Checkout.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { post } from '../lib/api';

export default function Checkout(){
  const { orderId } = useParams();
  const nav = useNavigate();
  const showtimeId = Number(sessionStorage.getItem(`order_showtime_${orderId}`) || 0);

  async function pay(){
    await post('/payments/sandbox/pay', { orderId: Number(orderId), showtimeId });
    nav(`/tickets/${orderId}`);
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold">Thanh toán</h1>
        <div className="mt-2 text-sm text-gray-600">Đơn hàng: #{orderId}</div>
        <button onClick={pay} className="mt-6 w-full py-2 rounded-lg bg-black text-white">Thanh toán sandbox</button>
      </div>
    </div>
  );
}
