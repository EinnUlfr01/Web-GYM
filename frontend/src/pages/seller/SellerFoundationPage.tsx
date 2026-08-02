import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function SellerFoundationPage(){
  const user=useAuthStore(state=>state.user);
  const shortcuts=[
    {to:'/seller/products/new',label:'Thêm sản phẩm',description:'Tạo Product DRAFT mới'},
    {to:'/seller/products',label:'Quản lý sản phẩm',description:'Biến thể, ảnh, tồn kho và xét duyệt'},
    {to:'/seller/orders',label:'Đơn hàng',description:'Theo dõi Shop orders'},
    {to:'/seller/revenue',label:'Doanh thu',description:'Xem dữ liệu đối soát từ backend'},
    {to:'/seller/complaints',label:'Khiếu nại',description:'Theo dõi complaint của Shop'},
  ];
  return <section className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 md:p-8"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Kênh người bán</p><h1 className="mt-3 text-3xl font-bold">Chào mừng {user?.name}</h1><p className="mt-3 max-w-2xl text-slate-300">Tài khoản Seller của bạn đã có một Shop riêng.</p></div>
    <div><h2 className="text-xl font-semibold">Lối tắt</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shortcuts.map(shortcut=><Link className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/60 hover:bg-slate-900" key={shortcut.to} to={shortcut.to}><strong className="text-emerald-400">{shortcut.label}</strong><span className="mt-1 block text-sm text-slate-400">{shortcut.description}</span></Link>)}</div></div>
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6"><h2 className="text-xl font-semibold">Quản lý Shop</h2><p className="mt-2 text-slate-400">Cập nhật hồ sơ và mở trang Shop công khai.</p><div className="mt-5 flex flex-wrap gap-4"><Link className="text-emerald-400 hover:underline" to="/seller/shop">Hồ sơ Shop</Link><Link className="text-emerald-400 hover:underline" to="/seller/apply">Hồ sơ đã duyệt</Link></div></div>
  </section>;
}
