import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { commerceApi } from '../../services/commerce';
import type { Cart } from '../../types/commerce';
import { formatMoney } from '../../utils/currency';
import { getApiErrorMessage } from '../../utils/errors';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => commerceApi.getCart().then(setCart).catch((err) => setError(err.response?.data?.message || 'Unable to load cart')).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const update = async (id: number, quantity: number) => {
    try {
      setError('');
      setCart(await commerceApi.updateCartItem(id, quantity));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update cart'));
    }
  };

  const remove = async (id: number) => {
    try {
      setError('');
      setCart(await commerceApi.removeCartItem(id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to remove cart item'));
    }
  };

  if (loading) return <div className="p-8 text-[#94A3B8]">Loading cart...</div>;
  const hasInvalidItems = Boolean(cart?.items.some((item) => !item.is_active || item.quantity > item.available));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="text-[#22C55E]" />
        <div>
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-[#94A3B8]">{cart?.count || 0} item(s)</p>
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {hasInvalidItems && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">Some cart items are inactive or exceed available stock. Update quantities before checkout.</div>}

      {!cart?.items.length ? (
        <div className="rounded-lg border border-[#1e293b] bg-[#0F172A] p-8 text-center">
          <p className="mb-4 text-[#94A3B8]">Your cart is empty.</p>
          <Link to="/products" className="hero-btn-primary inline-flex px-5 py-2">Shop products</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#1e293b] bg-[#0F172A] p-4">
                <div className="flex gap-4">
                  <img src={item.image_url || '/placeholder-product.png'} alt={item.product_name} className="h-20 w-20 rounded-md object-cover bg-[#020617]" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.slug}`} className="font-semibold hover:text-[#22C55E]">{item.product_name}</Link>
                    <p className="text-sm text-[#94A3B8]">SKU {item.sku}</p>
                    <p className="text-sm text-[#64748B]">Available {item.available}</p>
                    {!item.is_active && <p className="text-sm text-red-300">This variant is inactive.</p>}
                    {item.quantity > item.available && <p className="text-sm text-amber-200">Quantity exceeds available stock.</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost p-2" onClick={() => update(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={16} /></button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button className="btn-ghost p-2" onClick={() => update(item.id, item.quantity + 1)} disabled={!item.is_active || item.quantity >= item.available} aria-label="Increase quantity"><Plus size={16} /></button>
                  </div>
                  <div className="w-28 text-right">
                    <div className="font-semibold">{formatMoney(item.line_total)}</div>
                    <button className="mt-3 inline-flex text-red-300 hover:text-red-200" onClick={() => remove(item.id)} aria-label="Remove item"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-lg border border-[#1e293b] bg-[#0F172A] p-5">
            <div className="flex justify-between text-sm text-[#94A3B8]"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>
            <div className="mt-4 flex justify-between border-t border-[#1e293b] pt-4 text-lg font-bold"><span>Total</span><span>{formatMoney(cart.subtotal)}</span></div>
            <Link to="/checkout" className={`hero-btn-primary mt-5 flex justify-center py-3 ${hasInvalidItems ? 'pointer-events-none opacity-60' : ''}`}>Checkout COD</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
