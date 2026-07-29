import type { ShopOrderStatus } from "../orders/orders.types";

export interface SellerShopOrderItem {
  id:number;
  productId:number;
  variantId:number;
  productName:string;
  variantName:string;
  sku:string;
  quantity:number;
  unitPrice:number;
  lineTotal:number;
}

export interface SellerShopOrderSummary {
  id:number;
  parentOrderId:number;
  parentOrderNumber:string;
  status:ShopOrderStatus;
  subtotal:number;
  currency:string;
  itemCount:number;
  createdAt:Date;
  updatedAt:Date;
}

export interface SellerShopOrderDetail extends SellerShopOrderSummary {
  shipping:{
    name:string;
    phone:string|null;
    addressLine1:string|null;
    addressLine2:string|null;
    city:string|null;
    state:string|null;
    postalCode:string|null;
    country:string|null;
  };
  items:SellerShopOrderItem[];
}

export interface SellerShopOrderFilters {
  page:number;
  limit:10|20|50;
  status?:ShopOrderStatus;
  sortOrder:"asc"|"desc";
}

export interface PaginatedSellerShopOrders {
  items:SellerShopOrderSummary[];
  page:number;
  limit:number;
  total:number;
  totalPages:number;
}
