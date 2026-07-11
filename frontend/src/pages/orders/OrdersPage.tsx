import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { commerceApi } from '../../services/commerce';
import type { Order } from '../../types/commerce';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    commerceApi.listOrders().then(setOrders).catch((err) => setError(err.response?.data?.message || 'Unable to load orders'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PackageCheck className="text-[#22C55E]" />
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-[#94A3B8]">Commerce order history and COD payment status.</p>
        </div>
      </div>
      {error && <div className="text-red-300">{error}</div>}
      <div className="rounded-lg border border-[#1e293b] bg-[#0F172A]">
        {orders.length === 0 ? <div className="p-6 text-[#94A3B8]">No orders yet.</div> : orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="grid gap-3 border-b border-[#1e293b] p-4 transition-colors last:border-b-0 hover:bg-[#111827] md:grid-cols-[1fr_120px_120px_120px]">
            <div>
              <div className="font-semibold">{order.order_number}</div>
              <div className="text-sm text-[#94A3B8]">{new Date(order.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm text-[#94A3B8]">{order.status}</div>
            <div className="text-sm text-[#94A3B8]">{order.payment_method} {order.payment_status}</div>
            <div className="font-semibold">${Number(order.grand_total).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
