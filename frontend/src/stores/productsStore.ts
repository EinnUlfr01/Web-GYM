import { create } from 'zustand';
import api from '../api/axios';
import type { Product, ProductDetailResponse } from '../types/product';

interface CartItem {
  productId: number;
  variantId?: number;
  quantity: number;
  name: string;
  price: number;
  sale_price?: number;
  main_image?: string;
  stock: number;
}

interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  newProducts: Product[];
  saleProducts: Product[];
  cartItems: CartItem[];
  wishlistItems: number[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewProducts: () => Promise<void>;
  fetchSaleProducts: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  toggleWishlist: (productId: number) => void;
  clearCart: () => void;
  isInWishlist: (productId: number) => boolean;
  cartTotal: () => number;
  cartCount: () => number;
}

const CART_KEY = 'gymer_cart';
const WISHLIST_KEY = 'gymer_wishlist';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  featuredProducts: [],
  newProducts: [],
  saleProducts: [],
  cartItems: loadFromStorage<CartItem[]>(CART_KEY, []),
  wishlistItems: loadFromStorage<number[]>(WISHLIST_KEY, []),
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/products');
      set({ products: Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || [] });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch products' });
    }
    set({ isLoading: false });
  },

  fetchFeaturedProducts: async () => {
    try {
      const res = await api.get('/products/featured');
      set({ featuredProducts: res.data.data || [] });
    } catch {}
  },

  fetchNewProducts: async () => {
    try {
      const res = await api.get('/products/new');
      set({ newProducts: res.data.data || [] });
    } catch {}
  },

  fetchSaleProducts: async () => {
    try {
      const res = await api.get('/products/sale');
      set({ saleProducts: res.data.data || [] });
    } catch {}
  },

  addToCart: async (productId: number, quantity = 1) => {
    const { cartItems } = get();
    const existing = cartItems.find(i => i.productId === productId);

    if (existing) {
      if (localStorage.getItem('token') && existing.variantId) {
        await api.post('/cart/items', { variant_id: existing.variantId, quantity });
      }
      const updated = cartItems.map(i =>
        i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
      );
      set({ cartItems: updated });
      saveToStorage(CART_KEY, updated);
    } else {
      try {
        const res = await api.get<ProductDetailResponse>(`/products/${productId}`);
        const p = res.data.data;
        const variantId = p.display_variant.id;
        if (localStorage.getItem('token')) {
          await api.post('/cart/items', { variant_id: variantId, quantity });
        }
        const newItem: CartItem = {
          productId,
          variantId,
          quantity,
          name: p.product_name,
          price: p.display_variant.effective_price,
          sale_price: p.display_variant.sale_price ?? undefined,
          main_image: p.main_image,
          stock: p.display_variant.available,
        };
        const updated = [...cartItems, newItem];
        set({ cartItems: updated });
        saveToStorage(CART_KEY, updated);
      } catch {
        set({ error: 'Failed to load canonical product availability' });
      }
    }
  },

  removeFromCart: (productId: number) => {
    const updated = get().cartItems.filter(i => i.productId !== productId);
    set({ cartItems: updated });
    saveToStorage(CART_KEY, updated);
  },

  updateCartItemQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) return get().removeFromCart(productId);
    const updated = get().cartItems.map(i => i.productId === productId ? { ...i, quantity } : i);
    set({ cartItems: updated });
    saveToStorage(CART_KEY, updated);
  },

  toggleWishlist: (productId: number) => {
    const { wishlistItems } = get();
    const updated = wishlistItems.includes(productId)
      ? wishlistItems.filter(id => id !== productId)
      : [...wishlistItems, productId];
    set({ wishlistItems: updated });
    saveToStorage(WISHLIST_KEY, updated);
  },

  clearCart: () => {
    set({ cartItems: [] });
    saveToStorage(CART_KEY, []);
  },

  isInWishlist: (productId: number) => get().wishlistItems.includes(productId),

  cartTotal: () => get().cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),

  cartCount: () => get().cartItems.reduce((sum, i) => sum + i.quantity, 0),
}));
