
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
  productSizeId?: string;
  selectedColour?: {
    id: string;
    name: string;
    image: string;
  };
};

interface CartState {
  cart: CartItem[];
  companyDetails: CompanyDetails | null;
  addToCart: (
    product: ProductWithImage & { productSizeId?: string },
    selectedVariants: Record<string, string>,
    selectedAddons?: ProductAddonOption[],
    selectedColour?: { id: string; name: string; image: string }
  ) => void;
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
      addToCart: (product, selectedVariants, selectedAddons = [], selectedColour) => {
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
        const newColourId = selectedColour?.id || '';

        const existingItemIndex = currentCart.findIndex(item => {
          const itemAddonIds = (item.selectedAddons || []).map(a => a.id).sort().join(',');
          const itemVariantString = stringifyVariants(item.selectedVariants);
          const itemColourId = item.selectedColour?.id || '';

          return item.id === product.id &&
            itemVariantString === newVariantString &&
            itemAddonIds === newAddonIds &&
            itemColourId === newColourId;
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
            productSizeId: product.productSizeId,
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
            selectedAddons,
            selectedColour
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
        const cart = get().cart;
        // 1. Group quantities by productId to check for bulk thresholds
        // 1. Group quantities by Discount Rule to support Mix & Match
        // distinct products with the same `multipleSetDiscount` rule will be pooled together.
        const ruleQuantities: Record<string, number> = {};

        cart.forEach(item => {
          if (item.multipleSetDiscount) {
            // Use the rule string itself as the key (e.g. "3-10&&&4-15")
            // normalize it just in case
            const ruleKey = item.multipleSetDiscount.trim();
            ruleQuantities[ruleKey] = (ruleQuantities[ruleKey] || 0) + item.quantity;
          } else {
            // Fallback for items with no discount (though not used for calc)
            // We'll just use ID to avoid collision
            const key = `NO_RULE_${item.id}`;
            ruleQuantities[key] = (ruleQuantities[key] || 0) + item.quantity;
          }
        });

        return cart.reduce((total, item) => {
          const addonsPrice = (item.selectedAddons || []).reduce((acc, addon) => acc + addon.price, 0);
          let itemPrice = item.priceAfterDiscount !== undefined ? item.priceAfterDiscount : item.price;

          // Check Bulk Discount
          // Ensure fields exist and valid
          // Check Bulk Discount (New Format: "3-10&&&4-15")
          if (item.multipleSetDiscount) {
            const segments = item.multipleSetDiscount.toString().split('&&&');
            const ruleKey = item.multipleSetDiscount.trim();
            const totalQty = ruleQuantities[ruleKey] || 0;

            let bestDiscount = 0;
            let bestThreshold = 0;

            segments.forEach(seg => {
              const parts = seg.split('-');
              if (parts.length === 2) {
                const t = parseFloat(parts[0]);
                const d = parseFloat(parts[1]);
                if (!isNaN(t) && !isNaN(d) && totalQty >= t) {
                  if (t > bestThreshold) {
                    bestThreshold = t;
                    bestDiscount = d;
                  }
                }
              }
            });

            if (bestDiscount > 0) {
              itemPrice = itemPrice - (itemPrice * bestDiscount / 100);
            }
          }

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

