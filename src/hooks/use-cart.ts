
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ProductWithImage, ProductAddonOption } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CompanyDetails } from '@/lib/api-types';

export type CartItem = ProductWithImage & {
  cartItemId: string;
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedAddons?: ProductAddonOption[];
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
  timestamp: number;
  lastAddedItemId: string | null;
}

const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const findMockProduct = (id: string): ProductWithImage | undefined => {
  // This is a mock function. In a real app, you'd fetch from an API.
  // For now, let's create some mock data.
  const mockProducts: ProductWithImage[] = [
    { id: 'p1', name: 'Mango Pickle', price: 150, imageId: 'product-1', description: 'Spicy and tangy mango pickle', rating: 4.8, deliveryTime: '2-3 days', imageUrl: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', imageHint: 'mango pickle', pricing: [], variants: [{ name: 'Weight', options: ['250gm', '500gm', '1kg'] }, { name: 'Bottle', options: ['Bottle', 'Without Bottle'] }], deliveryCost: 50, createdAt: '2024-01-01T00:00:00Z' },
    { id: 'p4', name: 'Jhumka Earrings', price: 500, imageId: 'product-4', description: 'Traditional gold-plated jhumkas', rating: 4.8, deliveryTime: '5-7 days', imageUrl: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', imageHint: 'jhumka earrings', pricing: [], deliveryCost: 50, createdAt: '2024-01-01T00:00:00Z' },
  ];
  return mockProducts.find(p => p.id === id);
}


export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [
        // Mock initial cart data
        { ...findMockProduct('p1')!, cartItemId: 'mock-1', quantity: 2, selectedVariants: { 'Weight': '500gm', 'Bottle': 'Bottle' } as Record<string, string> },
        { ...findMockProduct('p4')!, cartItemId: 'mock-2', quantity: 1, selectedVariants: {} },
      ],
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
          return total + (item.price + addonsPrice) * item.quantity;
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
      }
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

