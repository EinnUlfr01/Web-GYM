import api from '../api/axios';
import type { Address, Cart, CheckoutPreview, InventoryRow, Order } from '../types/commerce';

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

export const commerceApi = {
  getCart: () => api.get('/cart').then(unwrap<Cart>),
  addCartItem: (variant_id: number, quantity: number) => api.post('/cart/items', { variant_id, quantity }).then(unwrap<Cart>),
  updateCartItem: (id: number, quantity: number) => api.patch(`/cart/items/${id}`, { quantity }).then(unwrap<Cart>),
  removeCartItem: (id: number) => api.delete(`/cart/items/${id}`).then(unwrap<Cart>),
  mergeCart: (items: Array<{ variant_id: number; quantity: number }>) => api.post('/cart/merge', { items }).then(unwrap<{ cart: Cart; adjustments: unknown[] }>),
  listAddresses: () => api.get('/addresses').then(unwrap<Address[]>),
  createAddress: (address: Omit<Address, 'id'>) => api.post('/addresses', address).then(unwrap<Address>),
  updateAddress: (id: number, address: Omit<Address, 'id'>) => api.put(`/addresses/${id}`, address).then(unwrap<Address>),
  deleteAddress: (id: number) => api.delete(`/addresses/${id}`).then(unwrap<null>),
  setDefaultAddress: (id: number) => api.patch(`/addresses/${id}/default`).then(unwrap<Address>),
  previewCheckout: (address_id?: number) => api.post('/checkout/preview', { address_id }).then(unwrap<CheckoutPreview>),
  placeOrder: (address_id: number) => api.post('/checkout/place-order', { address_id }).then(unwrap<Order>),
  listOrders: () => api.get('/orders').then(unwrap<Order[]>),
  getOrder: (id: number | string) => api.get(`/orders/${id}`).then(unwrap<Order>),
  cancelOrder: (id: number) => api.post(`/orders/${id}/cancel`).then(unwrap<Order>),
  adminOrders: () => api.get('/admin/orders').then(unwrap<Order[]>),
  adminOrder: (id: number | string) => api.get(`/admin/orders/${id}`).then(unwrap<Order>),
  updateOrderStatus: (id: number, status: string) => api.patch(`/admin/orders/${id}/status`, { status }).then(unwrap<Order>),
  adminInventory: () => api.get('/admin/inventory').then(unwrap<InventoryRow[]>),
};
