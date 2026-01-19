
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ProductWithImage, ProductAddonOption } from '@/lib/types';

import { CompanyDetails } from '@/lib/api-types';

export type CartItem = ProductWithImage & {
  cartItemId: string;
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedAddons?: ProductAddonOption[];
  priceAfterDiscount?: number;
};

interface CartState {
  cart: CartItem[];
  companyDetails: CompanyDetails | null;
  addToCart: (product: ProductWithImage, selectedVariants: Record<string, string>, selectedAddons?: ProductAddonOption[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  setCompanyDetails: (details: CompanyDetails) => void;
  checkExpiration: () => void;
  clearCart: () => void;
  timestamp: number;
  lastAddedItemId: string | null;
}

const EXPIRATION_TIME = 10 * 60 * 60 * 1000; // 10 hours in milliseconds




export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      companyDetails: null,
      timestamp: Date.now(),
      lastAddedItemId: null,
      addToCart: (product, selectedVariants, selectedAddons = []) => {
        const currentCart = get().cart;

        // Helper to stringify variants consistently (sorted by keys)
        const stringifyVariants = (v: Record<string, string>) =>
          JSON.stringify(Object.keys(v).sort().reduce((obj: any, key) => {
            obj[key] = v[key];
            return obj;
          }, {}));

        const newVariantString = stringifyVariants(selectedVariants);
        // We sort addons by ID to ensure order doesn't matter for comparison
        const newAddonIds = selectedAddons.map(a => a.id).sort().join(',');

        const existingItemIndex = currentCart.findIndex(item => {
          const itemAddonIds = (item.selectedAddons || []).map(a => a.id).sort().join(',');
          const itemVariantString = stringifyVariants(item.selectedVariants);

          return item.id === product.id &&
            itemVariantString === newVariantString &&
            itemAddonIds === newAddonIds;
        });

        let updatedCart;
        let newCartItemId;

        if (existingItemIndex > -1) {
          updatedCart = [...currentCart];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            // Refresh details in case they changed (e.g. image, name, price)
            name: product.name,
            price: product.price,
            priceAfterDiscount: product.priceAfterDiscount,
            imageUrl: product.imageUrl,
            images: product.images,
            description: product.description,
            quantity: updatedCart[existingItemIndex].quantity + 1
          };
          newCartItemId = updatedCart[existingItemIndex].cartItemId;
        } else {
          newCartItemId = crypto.randomUUID();
          updatedCart = [...currentCart, {
            ...product,
            cartItemId: newCartItemId,
            quantity: 1,
            selectedVariants,
            selectedAddons
          }];
        }

        set({ cart: updatedCart, timestamp: Date.now(), lastAddedItemId: newCartItemId });
        // Clear highlight after 3 seconds
        setTimeout(() => set({ lastAddedItemId: null }), 3000);
      },
      removeFromCart: (cartItemId) => {
        set(state => ({
          cart: state.cart.filter(item => item.cartItemId !== cartItemId),
          timestamp: Date.now()
        }));
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity < 1) return;
        set(state => ({
          cart: state.cart.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          ),
          timestamp: Date.now()
        }));
      },
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          const addonsPrice = (item.selectedAddons || []).reduce((acc, addon) => acc + addon.price, 0);
          const itemPrice = item.priceAfterDiscount !== undefined ? item.priceAfterDiscount : item.price;
          return total + (itemPrice + addonsPrice) * item.quantity;
        }, 0);
      },
      getCartItemsCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
      isCartOpen: false,
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setCompanyDetails: (details) => set({ companyDetails: details }),
      checkExpiration: () => {
        const { timestamp } = get();
        const now = Date.now();
        if (now - timestamp > EXPIRATION_TIME) {
          // Expired, clear cart
          set({ cart: [], timestamp: now });
        }
      },
      clearCart: () => set({ cart: [], timestamp: Date.now() })
    }),
    {
      name: 'cart-storage',
      // Ensure storage is only accessed on client side
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : sessionStorage)),
      onRehydrateStorage: () => (state) => {
        state?.checkExpiration();
      }
    }
  )
);

