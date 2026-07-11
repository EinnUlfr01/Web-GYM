import { useEffect, useState } from 'react';
import { commerceApi } from '../../services/commerce';
import type { Order } from '../../types/commerce';

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => commerceApi.adminOrders().then(setOrders);
  useEffect(() => { load(); }, []);

  const update = async (order: Order, status: string) => {
    await commerceApi.updateOrderStatus(order.id, status);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commerce Orders</h1>
        <p className="text-sm text-[#94A3B8]">Order lifecycle and COD payment visibility.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#1e293b] bg-[#0F172A]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#020617] text-[#94A3B8]"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Payment</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[#1e293b]">
                <td className="p-3 font-semibold">{order.order_number}</td>
                <td className="p-3 text-[#94A3B8]">{order.name || order.email}</td>
                <td className="p-3 text-[#94A3B8]">{order.payment_method} {order.payment_status}</td>
                <td className="p-3">${Number(order.grand_total).toFixed(2)}</td>
                <td className="p-3">
                  <select value={order.status} onChange={(e) => update(order, e.target.value)} className="rounded-md border border-[#334155] bg-[#020617] px-2 py-1">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
