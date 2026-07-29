import { create } from "zustand";
import api from "../api/axios";
import type { Product, ProductDetailResponse } from "../types/product";

export interface VariantAwareCartItem {
  productId: number;
  variantId: number;
  quantity: number;
}
interface LegacyCartItem {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
}
interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  newProducts: Product[];
  saleProducts: Product[];
  cartItems: VariantAwareCartItem[];
  wishlistItems: number[];
  isLoading: boolean;
  error: string | null;
  cartWarning: string | null;
  fetchProducts: () => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewProducts: () => Promise<void>;
  fetchSaleProducts: () => Promise<void>;
  migratePersistedCart: () => Promise<void>;
  addToCart: (productId: number, variantId: number, quantity: number) => void;
  removeFromCart: (productId: number, variantId: number) => void;
  updateCartQuantity: (
    productId: number,
    variantId: number,
    quantity: number,
  ) => void;
  updateCartItemQuantity: (
    productId: number,
    variantId: number,
    quantity: number,
  ) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  cartCount: () => number;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}
const CART_KEY = "gymer_cart",
  WISHLIST_KEY = "gymer_wishlist";
const readUnknown = (key: string): unknown => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown): void =>
  localStorage.setItem(key, JSON.stringify(value));
const validId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const validProductId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;
const validQuantity = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const initialCart = (): VariantAwareCartItem[] => {
  const raw = readUnknown(CART_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: LegacyCartItem) =>
    validProductId(item.productId) &&
    validId(item.variantId) &&
    validQuantity(item.quantity)
      ? [
          {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        ]
      : [],
  );
};
const initialWishlist = (): number[] => {
  const raw = readUnknown(WISHLIST_KEY);
  return Array.isArray(raw) ? raw.filter(validId) : [];
};
const message = (error: unknown): string =>
  error instanceof Error ? error.message : "Request failed";

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  featuredProducts: [],
  newProducts: [],
  saleProducts: [],
  cartItems: initialCart(),
  wishlistItems: initialWishlist(),
  isLoading: false,
  error: null,
  cartWarning: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ data: Product[] }>("/products");
      set({ products: response.data.data || [] });
    } catch (error: unknown) {
      set({ error: message(error) });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchFeaturedProducts: async () => {
    try {
      const response = await api.get<{ data: Product[] }>("/products/featured");
      set({ featuredProducts: response.data.data || [] });
    } catch {}
  },
  fetchNewProducts: async () => {
    try {
      const response = await api.get<{ data: Product[] }>("/products/new");
      set({ newProducts: response.data.data || [] });
    } catch {}
  },
  fetchSaleProducts: async () => {
    try {
      const response = await api.get<{ data: Product[] }>("/products/sale");
      set({ saleProducts: response.data.data || [] });
    } catch {}
  },
  migratePersistedCart: async () => {
    const raw = readUnknown(CART_KEY);
    if (!Array.isArray(raw)) {
      write(CART_KEY, []);
      set({ cartItems: [] });
      return;
    }
    const migrated: VariantAwareCartItem[] = [];
    let removed = false;
    for (const item of raw as LegacyCartItem[]) {
      if (!validProductId(item.productId) || !validQuantity(item.quantity)) {
        removed = true;
        continue;
      }
      let variantId = validId(item.variantId) ? item.variantId : null;
      if (variantId === null) {
        try {
          const response = await api.get<ProductDetailResponse>(
            `/products/${item.productId}`,
          );
          variantId = response.data.data.display_variant?.id ?? null;
        } catch {
          variantId = null;
        }
      }
      if (!validId(variantId)) {
        removed = true;
        continue;
      }
      const existing = migrated.find(
        (candidate) =>
          candidate.productId === item.productId &&
          candidate.variantId === variantId,
      );
      if (existing) {
        const combined = existing.quantity + item.quantity;
        if (!validQuantity(combined)) {
          removed = true;
          continue;
        }
        existing.quantity = combined;
      } else
        migrated.push({
          productId: item.productId,
          variantId,
          quantity: item.quantity,
        });
    }
    write(CART_KEY, migrated);
    set({
      cartItems: migrated,
      cartWarning: removed
        ? "Một số sản phẩm cũ không còn khả dụng và đã được xóa khỏi giỏ hàng."
        : null,
    });
  },
  addToCart: (productId, variantId, quantity) => {
    if (!validProductId(productId) || !validId(variantId) || !validQuantity(quantity))
      return;
    const current = get().cartItems,
      existing = current.find(
        (item) => item.productId === productId && item.variantId === variantId,
      );
    const combined = (existing?.quantity ?? 0) + quantity;
    if (!validQuantity(combined)) return;
    const items = existing
      ? current.map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: combined }
            : item,
        )
      : [...current, { productId, variantId, quantity }];
    write(CART_KEY, items);
    set({ cartItems: items });
  },
  removeFromCart: (productId, variantId) => {
    const items = get().cartItems.filter(
      (item) => item.productId !== productId || item.variantId !== variantId,
    );
    write(CART_KEY, items);
    set({ cartItems: items });
  },
  updateCartQuantity: (productId, variantId, quantity) => {
    if (!validQuantity(quantity)) return;
    const items = get().cartItems.map((item) =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity }
        : item,
    );
    write(CART_KEY, items);
    set({ cartItems: items });
  },
  updateCartItemQuantity: (productId, variantId, quantity) =>
    get().updateCartQuantity(productId, variantId, quantity),
  clearCart: () => {
    write(CART_KEY, []);
    set({ cartItems: [] });
  },
  getCartItemCount: () =>
    get().cartItems.reduce((sum, item) => {
      const next = sum + item.quantity;
      return Number.isSafeInteger(next) ? next : Number.MAX_SAFE_INTEGER;
    }, 0),
  cartCount: () => get().getCartItemCount(),
  toggleWishlist: (productId) => {
    const items = get().wishlistItems.includes(productId)
      ? get().wishlistItems.filter((id) => id !== productId)
      : [...get().wishlistItems, productId];
    write(WISHLIST_KEY, items);
    set({ wishlistItems: items });
  },
  isInWishlist: (productId) => get().wishlistItems.includes(productId),
}));
