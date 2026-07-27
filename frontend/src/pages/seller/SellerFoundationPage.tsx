import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function SellerFoundationPage(){
  const user=useAuthStore(state=>state.user);
  return <section className="mx-auto max-w-4xl space-y-6 p-4 md:p-8"><div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Seller foundation</p><h1 className="mt-3 text-3xl font-bold">Chào mừng {user?.name}</h1><p className="mt-3 max-w-2xl text-slate-300">Tài khoản của bạn đã có role Seller. SELLER-001 chưa tạo Shop, sản phẩm, đơn hàng hay dữ liệu doanh thu giả.</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950 p-6"><h2 className="text-xl font-semibold">Bước tiếp theo</h2><p className="mt-2 text-slate-400">Shop onboarding và GymFit Official thuộc SELLER-002.</p><Link className="mt-5 inline-block text-emerald-400 hover:underline" to="/seller/apply">Xem hồ sơ đã duyệt</Link></div></section>;
}

