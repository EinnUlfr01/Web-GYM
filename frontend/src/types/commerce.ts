export interface CartItem {
  id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  slug: string;
  variant_name: string | null;
  sku: string;
  unit_price: number;
  price: number;
  sale_price: number | null;
  available: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
  is_active: boolean;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  count: number;
}

export interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  province_city: string;
  postal_code?: string | null;
  is_default: boolean;
}

export interface CheckoutPreview {
  cart: Cart;
  address: Address | null;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  grand_total: number;
  currency: string;
  payment_methods: string[];
}

export interface OrderItem {
  id: number;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  image_url_snapshot: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  grand_total: number;
  currency: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  province_city: string;
  postal_code?: string | null;
  payment_status?: string;
  payment_method?: string;
  payment_amount?: number;
  created_at: string;
  items?: OrderItem[];
  email?: string;
  name?: string;
}

export interface InventoryRow {
  variant_id: number;
  sku: string;
  variant_name: string | null;
  product_id: number;
  product_name: string;
  on_hand: number;
  reserved: number;
  available: number;
}
