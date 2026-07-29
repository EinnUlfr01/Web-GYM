export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus =
  "UNPAID" | "PENDING" | "PAID" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
export interface AdminOrderFilters {
  search?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy:
    | "order_number"
    | "customer_name"
    | "total_amount"
    | "order_status"
    | "payment_status"
    | "created_at"
    | "updated_at";
  sortOrder: "asc" | "desc";
  page: number;
  limit: 10 | 20 | 50 | 100;
}
export interface AdminOrderListItem {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface PaginatedAdminOrders {
  items: AdminOrderListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface AdminOrderItem {
  id: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
}
export type ShopOrderStatus="PENDING_PAYMENT"|"PENDING_STOCK_CHECK"|"PREPARING"|"READY_FOR_PICKUP"|"UNABLE_TO_FULFILL"|"CANCELLED";
export interface AdminShopOrder {
  id:number;
  shop:{id:number;name:string;slug:string};
  status:ShopOrderStatus;
  subtotal:number;
  createdAt:Date;
  updatedAt:Date;
  items:AdminOrderItem[];
}
export interface OrderStatusHistoryItem {
  id: number;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: number | null;
  changedByName: string | null;
  changedByEmail: string | null;
  note: string | null;
  createdAt: Date;
}
export type PaymentActorType = "CUSTOMER" | "ADMIN" | "SYSTEM";
export type BankTransferConfigurationField =
  | "BANK_NAME"
  | "BANK_ACCOUNT_NAME"
  | "BANK_ACCOUNT_NUMBER"
  | "BANK_QR_IMAGE_URL";
export type MailConfigurationField =
  | "MAIL_HOST"
  | "MAIL_PORT"
  | "MAIL_SECURE"
  | "MAIL_USER"
  | "MAIL_APP_PASSWORD"
  | "ADMIN_NOTIFICATION_EMAIL";
export interface AdminPaymentConfigurationStatus {
  bankTransfer: {
    ready: boolean;
    missingFields: BankTransferConfigurationField[];
  };
  mail: { configured: boolean; missingFields: MailConfigurationField[] };
}
export interface PaymentStatusHistoryItem {
  id: number;
  orderId: number;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  changedBy: number | null;
  changedByName: string | null;
  changedByEmail: string | null;
  actorType: PaymentActorType;
  note: string | null;
  paymentReference: string | null;
  createdAt: Date;
}
export interface AdminOrderDetail {
  id: number;
  orderNumber: string;
  userId: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; email: string; phone: string | null };
  shipping: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  payment: {
    provider: string | null;
    reference: string | null;
  };
  items: AdminOrderItem[];
  shopOrders: AdminShopOrder[];
  statusHistory: OrderStatusHistoryItem[];
  paymentHistory: PaymentStatusHistoryItem[];
}
export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
}
export interface OrderInventoryItem {
  variantId: number;
  quantity: number;
  inventoryId: number;
  onHand: number;
  reserved: number;
}
export interface InventoryFulfillmentAdjustment {
  variantId: number;
  previousOnHand: number;
  quantityDelta: number;
  newOnHand: number;
}
export interface OrderInventoryLifecycleResult {
  action: "RESERVATION_RELEASED" | "STOCK_CONSUMED";
  items: OrderInventoryItem[];
  adjustments: InventoryFulfillmentAdjustment[];
}
