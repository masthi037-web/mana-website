
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ProductWithImage, ProductSizeColourOption } from '@/lib/types';

import { CompanyDetails } from '@/lib/api-types';

export type CartItem = ProductWithImage & {
  cartItemId: string;
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedSizeColours?: ProductSizeColourOption[];
  priceAfterDiscount?: number;
  productSizeId?: string;
  productSizeColourId?: string;
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
    selectedSizeColours?: ProductSizeColourOption[],
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
  setCart: (cart: CartItem[]) => void;
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
      addToCart: (product, selectedVariants, selectedSizeColours = [], selectedColour) => {
        const currentCart = get().cart;

        // Helper to stringify variants consistently (sorted by keys)
        const stringifyVariants = (v: Record<string, string>) =>
          JSON.stringify(Object.keys(v).sort().reduce((obj: any, key) => {
            obj[key] = v[key];
            return obj;
          }, {}));

        const newVariantString = stringifyVariants(selectedVariants);
        // We sort by ID to ensure order doesn't matter for comparison
        const newSizeColourIds = selectedSizeColours.map(a => a.id).sort().join(',');
        const newColourId = selectedColour?.id || '';

        const existingItemIndex = currentCart.findIndex(item => {
          const itemSizeColourIds = (item.selectedSizeColours || []).map(a => a.id).sort().join(',');
          const itemVariantString = stringifyVariants(item.selectedVariants);
          const itemColourId = item.selectedColour?.id || '';

          return item.id === product.id &&
            itemVariantString === newVariantString &&
            itemSizeColourIds === newSizeColourIds &&
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
            selectedSizeColours,
            productSizeColourId: (selectedSizeColours && selectedSizeColours.length > 0) ? selectedSizeColours[0].id : undefined,
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

        // 1. Calculate Total Product Quantities and Rules
        const productQuantities: Record<string, number> = {};
        const productRules: Record<string, string> = {};
        const productMoreThanRules: Record<string, string> = {};

        cart.forEach(item => {
          productQuantities[item.id] = (productQuantities[item.id] || 0) + item.quantity;
          if (item.multipleSetDiscount) {
            productRules[item.id] = item.multipleSetDiscount.trim();
          }
          if (item.multipleDiscountMoreThan) {
            productMoreThanRules[item.id] = item.multipleDiscountMoreThan.trim();
          }
        });

        // 2. Iterate and Calculate Total
        // Removed old reduce block that was returning early

        // REWRITE: Calculate totals by Product ID first

        // REWRITE: Calculate totals by Product ID first
        let grandTotal = 0;
        const processedProductIds = new Set<string>();

        cart.forEach(item => {
          const productId = item.id.toString();
          if (processedProductIds.has(productId)) return; // Already processed this product's total logic
          processedProductIds.add(productId);

          // Get all items for this product to handle variants/colour correctly
          const productItems = cart.filter(i => i.id.toString() === productId);
          const totalQty = productQuantities[productId];
          const ruleKey = productRules[productId];
          const moreThanRule = productMoreThanRules[productId];

          // 1. Calculate Base Total for this Product (including variants/sizeColours)
          // We need to apply discounts to the BASE PRICE of each specific item
          // Actually, `itemPrice` (base) is per item. 
          // We need to distribute the discount schedule [15, 15, 10, 0...] across the items.

          // Generate Distribution
          let distribution: number[] = new Array(totalQty).fill(0);
          let maxGreedyDiscount = 0;

          if (ruleKey) {
            const segments = ruleKey.split('&&&');
            const tiers: { threshold: number, percent: number }[] = [];
            segments.forEach(seg => {
              const parts = seg.split('-');
              if (parts.length === 2) {
                tiers.push({ threshold: parseFloat(parts[0]), percent: parseFloat(parts[1]) });
              }
            });
            tiers.sort((a, b) => b.threshold - a.threshold);
            if (tiers.length > 0) maxGreedyDiscount = tiers[0].percent;

            let remaining = totalQty;
            const dist = [];
            while (remaining > 0) {
              const bestTier = tiers.find(t => t.threshold <= remaining);
              if (bestTier) {
                for (let k = 0; k < bestTier.threshold; k++) dist.push(bestTier.percent);
                remaining -= bestTier.threshold;
              } else {
                for (let k = 0; k < remaining; k++) dist.push(0);
                remaining = 0;
              }
            }
            distribution = dist;
          }

          // 'More Than' Override
          if (moreThanRule) {
            const parts = moreThanRule.split('-');
            if (parts.length === 2) {
              const threshold = parseFloat(parts[0]);
              const discount = parseFloat(parts[1]);
              if (totalQty > threshold && discount > maxGreedyDiscount) {
                distribution = new Array(totalQty).fill(discount);
              }
            }
          }

          // Apply Distribution to Items
          // We must map the distribution to the items in order (to match Cart Sheet visual)
          let distributionIndex = 0;
          productItems.forEach(pItem => {
            const sizeColoursCost = (pItem.selectedSizeColours || []).reduce((acc, a) => acc + a.price, 0);
            const basePrice = pItem.priceAfterDiscount !== undefined ? pItem.priceAfterDiscount : pItem.price;
            // Note: Discount applies to (Base + SizeColours)
            // CartSheet logic: singleItemTotal = basePrice + sizeColoursCost; finalTotal = singleItemTotal * qty * (1 - discountPercent / 100);
            // So it applies to the SUM.

            const itemBaseTotal = basePrice + sizeColoursCost;

            for (let q = 0; q < pItem.quantity; q++) {
              const discountPercent = distribution[distributionIndex] || 0;
              const discountedPrice = itemBaseTotal * (1 - discountPercent / 100);
              grandTotal += discountedPrice;
              distributionIndex++;
            }
          });
        });

        return grandTotal;
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
      setCart: (newCart) => set({ cart: newCart, timestamp: Date.now() }),
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

