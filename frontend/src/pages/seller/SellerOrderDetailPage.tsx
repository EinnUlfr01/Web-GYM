import { useCallback,useEffect,useState } from "react";
import { AxiosError } from "axios";
import { Link,useParams } from "react-router-dom";
import { sellerOrdersApi } from "../../services/sellerOrdersApi";
import type { SellerShopOrderDetail } from "../../types/sellerOrders";
const message=(error:unknown)=>error instanceof AxiosError&&typeof error.response?.data?.message==="string"?error.response.data.message:"Không thể tải ShopOrder.";
export default function SellerOrderDetailPage(){
  const id=Number(useParams().shopOrderId),[order,setOrder]=useState<SellerShopOrderDetail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{setOrder((await sellerOrdersApi.detail(id)).data.data)}catch(caught){setError(message(caught))}finally{setLoading(false)}},[id]);
  useEffect(()=>{void load()},[load]);
  if(loading)return <main className="p-8">Đang tải…</main>;
  if(error||!order)return <main className="space-y-4 p-8"><Link className="text-emerald-400" to="/seller/orders">Quay lại Shop orders</Link><div role="alert" className="rounded border border-red-500/30 p-4 text-red-300">{error||"ShopOrder not found"} <button className="underline" onClick={()=>void load()}>Thử lại</button></div></main>;
  return <main className="space-y-5 p-4 md:p-8"><div><Link className="text-emerald-400" to="/seller/orders">Quay lại Shop orders</Link><h1 className="mt-2 text-2xl font-bold">ShopOrder #{order.id}</h1><p>{order.parentOrderNumber} · {order.status}</p><strong>{order.subtotal.toLocaleString()} {order.currency}</strong></div><section className="rounded-xl border border-white/10 p-5"><h2 className="font-semibold">Thông tin giao hàng tối thiểu</h2><p>{order.shipping.name} · {order.shipping.phone||"—"}</p><p>{[order.shipping.addressLine1,order.shipping.addressLine2,order.shipping.city,order.shipping.state,order.shipping.postalCode,order.shipping.country].filter(Boolean).join(", ")||"—"}</p></section><section className="overflow-x-auto rounded-xl border border-white/10"><h2 className="p-5 font-semibold">Items</h2><table className="w-full min-w-[760px]"><thead><tr><th>Product</th><th>Variant</th><th>SKU</th><th>Quantity</th><th>Line total</th></tr></thead><tbody>{order.items.map(item=><tr key={item.id} className="border-t border-white/10"><td className="p-3">{item.productName}</td><td>{item.variantName}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{item.lineTotal.toLocaleString()} {order.currency}</td></tr>)}</tbody></table></section><p className="rounded bg-amber-500/10 p-4 text-amber-200">READ-ONLY: SELLER-008 không cung cấp hành động thay đổi trạng thái, tồn kho, hủy, hoàn tiền hay logistics.</p></main>;
}
