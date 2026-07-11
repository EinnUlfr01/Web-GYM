import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin } from 'lucide-react';
import { commerceApi } from '../../services/commerce';
import type { Address, CheckoutPreview } from '../../types/commerce';

const blankAddress: Omit<Address, 'id'> = {
  recipient_name: '',
  phone: '',
  address_line: '',
  ward: '',
  district: '',
  province_city: '',
  postal_code: '',
  is_default: true,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [address, setAddress] = useState(blankAddress);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [existing, nextPreview] = await Promise.all([commerceApi.listAddresses(), commerceApi.previewCheckout()]);
    setAddresses(existing);
    setSelectedId(nextPreview.address?.id || existing[0]?.id);
    setPreview(nextPreview);
  };

  useEffect(() => { load().catch((err) => setError(err.response?.data?.message || 'Unable to prepare checkout')); }, []);

  const createAddress = async (event: FormEvent) => {
    event.preventDefault();
    const created = await commerceApi.createAddress(address);
    setAddresses([created, ...addresses]);
    setSelectedId(created.id);
    setAddress(blankAddress);
  };

  const placeOrder = async () => {
    if (!selectedId) {
      setError('Create or select a shipping address first');
      return;
    }
    const order = await commerceApi.placeOrder(selectedId);
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-[#94A3B8]">COD payment is reserved for this MVP checkout flow.</p>
      </div>
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-[#1e293b] bg-[#0F172A] p-5">
            <div className="mb-4 flex items-center gap-2 font-semibold"><MapPin size={18} className="text-[#22C55E]" />Shipping address</div>
            <div className="space-y-2">
              {addresses.map((item) => (
                <label key={item.id} className="flex cursor-pointer gap-3 rounded-md border border-[#1e293b] p-3">
                  <input type="radio" checked={selectedId === item.id} onChange={() => setSelectedId(item.id)} />
                  <span className="text-sm">{item.recipient_name} - {item.phone}<br /><span className="text-[#94A3B8]">{item.address_line}, {item.ward}, {item.district}, {item.province_city}</span></span>
                </label>
              ))}
            </div>
          </div>
          <form onSubmit={createAddress} className="rounded-lg border border-[#1e293b] bg-[#0F172A] p-5">
            <h2 className="mb-4 font-semibold">New address</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(['recipient_name','phone','address_line','ward','district','province_city'] as const).map((key) => (
                <input key={key} required value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} placeholder={key.replace(/_/g, ' ')} className="rounded-md border border-[#334155] bg-[#020617] px-3 py-2 text-sm outline-none focus:border-[#22C55E]" />
              ))}
            </div>
            <button className="hero-btn-primary mt-4 px-5 py-2">Save address</button>
          </form>
        </section>
        <aside className="h-fit rounded-lg border border-[#1e293b] bg-[#0F172A] p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold"><CreditCard size={18} className="text-[#22C55E]" />Order summary</div>
          <div className="space-y-2 text-sm text-[#94A3B8]">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(preview?.subtotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${Number(preview?.shipping_fee || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Payment</span><span>COD</span></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-[#1e293b] pt-4 text-lg font-bold"><span>Total</span><span>${Number(preview?.grand_total || 0).toFixed(2)}</span></div>
          <button onClick={placeOrder} className="hero-btn-primary mt-5 w-full py-3">Place order</button>
        </aside>
      </div>
    </div>
  );
}
