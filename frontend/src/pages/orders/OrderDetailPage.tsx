import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { commerceApi } from '../../services/commerce';
import type { Order } from '../../types/commerce';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const load = () => id && commerceApi.getOrder(id).then(setOrder).catch((err) => setError(err.response?.data?.message || 'Unable to load order'));
  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (!order) return;
    setOrder(await commerceApi.cancelOrder(order.id));
  };

  if (error) return <div className="p-8 text-red-300">{error}</div>;
  if (!order) return <div className="p-8 text-[#94A3B8]">Loading order...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-[#94A3B8]">{order.status} · {order.payment_method} {order.payment_status}</p>
        </div>
        {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && <button className="rounded-md border border-red-400/50 px-4 py-2 text-red-200 hover:bg-red-500/10" onClick={cancel}>Cancel order</button>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-[#1e293b] bg-[#0F172A]">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-[#1e293b] p-4 last:border-b-0">
              <img src={item.image_url_snapshot || '/placeholder-product.png'} alt={item.product_name_snapshot} className="h-16 w-16 rounded-md object-cover bg-[#020617]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{item.product_name_snapshot}</div>
                <div className="text-sm text-[#94A3B8]">SKU {item.sku_snapshot} · Qty {item.quantity}</div>
              </div>
              <div className="font-semibold">${Number(item.line_total).toFixed(2)}</div>
            </div>
          ))}
        </section>
        <aside className="h-fit rounded-lg border border-[#1e293b] bg-[#0F172A] p-5 text-sm">
          <h2 className="mb-3 font-semibold">Shipping snapshot</h2>
          <p>{order.recipient_name} - {order.phone}</p>
          <p className="text-[#94A3B8]">{order.address_line}, {order.ward}, {order.district}, {order.province_city}</p>
          <div className="mt-4 flex justify-between border-t border-[#1e293b] pt-4 text-lg font-bold"><span>Total</span><span>${Number(order.grand_total).toFixed(2)}</span></div>
          <Link to="/orders" className="mt-4 block text-[#22C55E] hover:text-[#86efac]">Back to orders</Link>
        </aside>
      </div>
    </div>
  );
}
