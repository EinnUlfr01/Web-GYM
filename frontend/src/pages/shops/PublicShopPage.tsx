import { FormEvent,useEffect,useState } from 'react';
import { useParams,useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import ProductCard from '../../components/products/ProductCard';
import type { Product } from '../../types/product';
import type { Shop } from '../../services/shopsApi';

type Option={id:number;name:string};
const sorts=[['relevance','Liên quan'],['newest','Mới nhất'],['price_asc','Giá tăng dần'],['price_desc','Giá giảm dần'],['name_asc','Tên A-Z'],['name_desc','Tên Z-A']];
export default function PublicShopPage(){
  const{shopSlug=''}=useParams(),[query,setQuery]=useSearchParams(),[shop,setShop]=useState<Shop|null>(null),[products,setProducts]=useState<Product[]>([]);
  const[options,setOptions]=useState<{categories:Option[];brands:Option[]}>({categories:[],brands:[]}),[search,setSearch]=useState(query.get('q')??''),[meta,setMeta]=useState({page:1,pages:1,total:0}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const key=query.toString();
  useEffect(()=>{api.get('/products/filters').then(r=>setOptions(r.data.data)).catch(()=>undefined);},[]);
  useEffect(()=>{setSearch(query.get('q')??'');setLoading(true);api.get(`/shops/${encodeURIComponent(shopSlug)}`,{params:Object.fromEntries(query)})
    .then(r=>{setShop(r.data.data);setProducts(r.data.products);setMeta({page:r.data.pagination.page,pages:r.data.pagination.pages,total:r.data.pagination.total});setError('');})
    .catch((e:any)=>{setShop(null);setProducts([]);setError(e.response?.status===404?'Shop không khả dụng.':'Không thể tải Shop.');}).finally(()=>setLoading(false));},[shopSlug,key]);
  const change=(name:string,value:string)=>{const next=new URLSearchParams(query);value?next.set(name,value):next.delete(name);if(name!=='page')next.set('page','1');setQuery(next);};
  const submit=(e:FormEvent)=>{e.preventDefault();change('q',search.trim().replace(/\s+/g,' '));};
  if(loading)return <p className="p-8">Đang tải…</p>;if(error||!shop)return <p className="p-8 text-red-400">{error}</p>;
  return <main className="mx-auto max-w-7xl space-y-6 p-6">
    {shop.bannerUrl&&<img className="h-52 w-full rounded-xl object-cover" src={shop.bannerUrl} alt=""/>}
    <header className="flex gap-4">{shop.logoUrl&&<img className="h-20 w-20 rounded object-cover" src={shop.logoUrl} alt=""/>}<div><h1 className="text-3xl font-bold">{shop.name}</h1>{shop.isVerified&&<p className="text-emerald-400">Shop đã xác minh</p>}<p className="text-slate-300">{shop.description}</p><small className="text-slate-500">Tham gia {new Date(shop.createdAt).toLocaleDateString('vi-VN')}</small></div></header>
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-800 p-4 md:grid-cols-4">
      <input className="rounded bg-slate-900 p-2 md:col-span-3" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm trong Shop"/><button className="rounded bg-orange-500 p-2">Tìm</button>
      <select value={query.get('categoryId')??''} onChange={e=>change('categoryId',e.target.value)} className="rounded bg-slate-900 p-2"><option value="">Mọi danh mục</option>{options.categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select value={query.get('brandId')??''} onChange={e=>change('brandId',e.target.value)} className="rounded bg-slate-900 p-2"><option value="">Mọi thương hiệu</option>{options.brands.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <input type="number" min="0" value={query.get('minPrice')??''} onChange={e=>change('minPrice',e.target.value)} className="rounded bg-slate-900 p-2" placeholder="Giá tối thiểu"/>
      <input type="number" min="0" value={query.get('maxPrice')??''} onChange={e=>change('maxPrice',e.target.value)} className="rounded bg-slate-900 p-2" placeholder="Giá tối đa"/>
      <select value={query.get('sort')??'newest'} onChange={e=>change('sort',e.target.value)} className="rounded bg-slate-900 p-2">{sorts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <label className="flex items-center gap-2"><input type="checkbox" checked={query.get('inStock')==='true'} onChange={e=>change('inStock',e.target.checked?'true':'')}/> Còn hàng</label>
    </form>
    <p className="text-slate-400">{meta.total} sản phẩm</p>
    {products.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<p>Shop chưa có sản phẩm phù hợp.</p>}
    <nav className="flex justify-center gap-4"><button disabled={meta.page<=1} onClick={()=>change('page',String(meta.page-1))}>Trước</button><span>{meta.page}/{Math.max(1,meta.pages)}</span><button disabled={meta.page>=meta.pages} onClick={()=>change('page',String(meta.page+1))}>Sau</button></nav>
  </main>;
}
