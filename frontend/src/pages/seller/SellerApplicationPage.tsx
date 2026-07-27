import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sellerApplicationsApi } from '../../services/sellerApplicationsApi';
import { useAuthStore } from '../../stores/authStore';
import type { SellerApplication, SellerApplicationInput, SellerBusinessType } from '../../types/sellerApplications';

type FormState = Record<'businessName'|'businessType'|'contactName'|'contactEmail'|'contactPhone'|'businessAddress'|'pickupAddress'|'taxCode'|'websiteUrl'|'socialUrl'|'description', string>;
const empty: FormState = { businessName:'',businessType:'',contactName:'',contactEmail:'',contactPhone:'',businessAddress:'',pickupAddress:'',taxCode:'',websiteUrl:'',socialUrl:'',description:'' };
const required: Array<keyof FormState> = ['businessName','businessType','contactName','contactEmail','contactPhone','businessAddress','pickupAddress'];
const labels: Record<keyof FormState,string> = {
  businessName:'Tên doanh nghiệp',businessType:'Loại hình',contactName:'Người liên hệ',contactEmail:'Email liên hệ',
  contactPhone:'Số điện thoại',businessAddress:'Địa chỉ doanh nghiệp',pickupAddress:'Địa chỉ lấy hàng',
  taxCode:'Mã số thuế (không bắt buộc)',websiteUrl:'Website (không bắt buộc)',socialUrl:'Mạng xã hội (không bắt buộc)',
  description:'Giới thiệu doanh nghiệp (không bắt buộc)',
};

function fromApplication(application: SellerApplication): FormState {
  return Object.fromEntries(Object.keys(empty).map(key => [key, String(application[key as keyof SellerApplication] ?? '')])) as FormState;
}
function payload(form: FormState): SellerApplicationInput {
  return {
    businessName:form.businessName.trim()||null,businessType:(form.businessType||null) as SellerBusinessType|null,
    contactName:form.contactName.trim()||null,contactEmail:form.contactEmail.trim()||null,contactPhone:form.contactPhone.trim()||null,
    businessAddress:form.businessAddress.trim()||null,pickupAddress:form.pickupAddress.trim()||null,taxCode:form.taxCode.trim()||null,
    websiteUrl:form.websiteUrl.trim()||null,socialUrl:form.socialUrl.trim()||null,description:form.description.trim()||null,
  };
}
function errorMessage(error: unknown) {
  return error instanceof AxiosError && typeof error.response?.data?.message === 'string'
    ? error.response.data.message : 'Không thể xử lý hồ sơ người bán.';
}

export default function SellerApplicationPage() {
  const user=useAuthStore(state=>state.user);
  const [application,setApplication]=useState<SellerApplication|null>(null);
  const [form,setForm]=useState<FormState>(empty);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const eligible=user?.role==='member'||user?.role==='seller';
  useEffect(()=>{if(!eligible){setLoading(false);return}setLoading(true);sellerApplicationsApi.mine().then(response=>{setApplication(response.data.data);setForm(fromApplication(response.data.data));}).catch((requestError:unknown)=>{if(requestError instanceof AxiosError&&requestError.response?.status===404){setApplication(null);setForm(current=>({...current,contactName:user?.name||'',contactEmail:user?.email||'',contactPhone:user?.phone||''}));}else setError(errorMessage(requestError));}).finally(()=>setLoading(false));},[eligible,user?.email,user?.name,user?.phone]);
  const editable=!application||['DRAFT','REJECTED','WITHDRAWN'].includes(application.status);
  const missing=useMemo(()=>required.filter(key=>!form[key].trim()),[form]);
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim());
  const save=async()=>{setSaving(true);setError('');try{const response=application?await sellerApplicationsApi.update(payload(form)):await sellerApplicationsApi.create(payload(form));setApplication(response.data.data);setForm(fromApplication(response.data.data));toast.success('Đã lưu bản nháp.');return response.data.data;}catch(requestError){setError(errorMessage(requestError));return null;}finally{setSaving(false)}};
  const onSave=(event:FormEvent)=>{event.preventDefault();void save();};
  const submit=async()=>{if(missing.length||!validEmail){setError('Vui lòng hoàn tất các trường bắt buộc và nhập email hợp lệ trước khi gửi.');return}if(!window.confirm('Gửi hồ sơ để Admin xét duyệt? Hồ sơ sẽ khóa chỉnh sửa khi đang chờ.'))return;setSaving(true);setError('');try{let current=application;if(!current)current=(await sellerApplicationsApi.create(payload(form))).data.data;else current=(await sellerApplicationsApi.update(payload(form))).data.data;const response=await sellerApplicationsApi.submit();setApplication(response.data.data);setForm(fromApplication(response.data.data));toast.success('Hồ sơ đã được gửi xét duyệt.');}catch(requestError){setError(errorMessage(requestError));}finally{setSaving(false)}};
  const withdraw=async()=>{if(!window.confirm('Rút hồ sơ đang chờ xét duyệt?'))return;setSaving(true);try{const response=await sellerApplicationsApi.withdraw();setApplication(response.data.data);setForm(fromApplication(response.data.data));toast.success('Đã rút hồ sơ.');}catch(requestError){setError(errorMessage(requestError));}finally{setSaving(false)}};

  if(loading)return <div className="p-8 text-slate-400">Đang tải Kênh người bán…</div>;
  if(!eligible)return <section className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8"><h1 className="text-2xl font-bold">Kênh người bán</h1><p className="mt-3 text-amber-100">Chỉ tài khoản Member có thể tạo hồ sơ Seller. Tài khoản {user?.role?.toUpperCase()} hiện không đủ điều kiện.</p></div></section>;
  if(application?.status==='APPROVED'||user?.role==='seller')return <section className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8"><p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Approved</p><h1 className="mt-2 text-3xl font-bold">Tài khoản Seller đã được phê duyệt</h1><p className="mt-3 text-slate-300">Phiên đăng nhập cũ đã bị thu hồi khi phê duyệt. Shop onboarding sẽ được triển khai trong SELLER-002.</p><Link className="btn-primary mt-6 inline-block" to="/seller">Mở Seller workspace</Link></div></section>;
  const pending=application?.status==='PENDING';
  return <section className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Kênh người bán</p><h1 className="text-3xl font-bold">Hồ sơ đăng ký Seller</h1><p className="mt-2 text-slate-400">Lưu bản nháp trước, sau đó chủ động gửi xét duyệt.</p></header>
    {error&&<p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</p>}
    {application?.status==='REJECTED'&&<div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5"><strong>Hồ sơ cần chỉnh sửa</strong><p className="mt-2">{application.reviewReason}</p><p className="mt-2 text-sm text-slate-300">Reason cũ vẫn được giữ trong lịch sử khi bạn gửi lại.</p></div>}
    {application?.status==='WITHDRAWN'&&<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">Hồ sơ đã rút. Bạn có thể chỉnh sửa và gửi lại cùng hồ sơ này.</div>}
    {pending&&<div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5"><strong>Đang chờ xét duyệt</strong><p className="mt-2 text-slate-300">Đã gửi {application.submittedAt?new Date(application.submittedAt).toLocaleString('vi-VN'):'—'}. Hồ sơ đang ở chế độ chỉ đọc.</p></div>}
    <form onSubmit={onSave} className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 md:grid-cols-2 md:p-8">
      {(Object.keys(form) as Array<keyof FormState>).map(key=><label key={key} className={['businessAddress','pickupAddress','description'].includes(key)?'md:col-span-2':''}><span className="text-sm text-slate-300">{labels[key]}{required.includes(key)&&' *'}</span>{key==='businessType'?<select disabled={!editable||saving} className="input-field mt-1 w-full" value={form[key]} onChange={event=>setForm(current=>({...current,[key]:event.target.value}))}><option value="">Chọn loại hình</option><option value="BRAND">Thương hiệu</option><option value="SPORTS_STORE">Cửa hàng thể thao</option><option value="SMALL_BUSINESS">Doanh nghiệp nhỏ</option><option value="OTHER">Khác</option></select>:key==='description'?<textarea disabled={!editable||saving} rows={5} maxLength={2000} className="input-field mt-1 w-full" value={form[key]} onChange={event=>setForm(current=>({...current,[key]:event.target.value}))}/>:<input disabled={!editable||saving} type={key==='contactEmail'?'email':key.includes('Url')?'url':'text'} maxLength={key==='contactEmail'?255:key.includes('Address')||key.includes('Url')?500:key==='taxCode'||key==='contactPhone'?50:200} className="input-field mt-1 w-full" value={form[key]} onChange={event=>setForm(current=>({...current,[key]:event.target.value}))}/>}</label>)}
      <div className="flex flex-wrap gap-3 md:col-span-2">{editable&&<><button disabled={saving} className="btn-secondary" type="submit">{saving?'Đang lưu…':'Lưu bản nháp'}</button><button disabled={saving} className="btn-primary" type="button" onClick={()=>void submit()}>Gửi xét duyệt</button></>}{pending&&<button disabled={saving} className="btn-secondary" type="button" onClick={()=>void withdraw()}>Rút hồ sơ</button>}</div>
    </form>
    {application&&<section className="rounded-2xl border border-slate-800 p-5"><h2 className="text-lg font-semibold">Lịch sử trạng thái</h2><ol className="mt-4 space-y-3">{application.history.map(item=><li key={item.id} className="border-l-2 border-emerald-500/40 pl-4"><strong>{item.fromStatus||'Mới'} → {item.toStatus}</strong><p className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.actorName||'System'}</p>{item.reason&&<p className="text-sm text-red-200">{item.reason}</p>}</li>)}</ol></section>}
  </section>;
}

