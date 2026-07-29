import api from "../api/axios";
import type { ShopOrderStatus } from "../types/orders";
import type { PaginatedSellerShopOrders,SellerShopOrderDetail } from "../types/sellerOrders";
interface ApiResponse<T>{success:boolean;data:T;message?:string}
export const sellerOrdersApi={
  list:(params:{page:number;limit:10|20|50;status?:ShopOrderStatus;sortOrder:"asc"|"desc"})=>api.get<ApiResponse<PaginatedSellerShopOrders>>("/seller/orders",{params}),
  detail:(shopOrderId:number)=>api.get<ApiResponse<SellerShopOrderDetail>>(`/seller/orders/${shopOrderId}`),
};
