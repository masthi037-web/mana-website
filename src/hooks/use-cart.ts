
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useToast } from '@/hooks/use-toast';
import type { ProductWithImage } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export type CartItem = ProductWithImage & {
  quantity: number;
  selectedVariants: Record<string, string>;
};

interface CartState {
  cart: CartItem[];
  addToCart: (product: ProductWithImage, selectedVariants: Record<string, string>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getCartTotal: () => number;
}

const findMockProduct = (id: string): ProductWithImage | undefined => {
  // This is a mock function. In a real app, you'd fetch from an API.
  // For now, let's create some mock data.
  const mockProducts: ProductWithImage[] = [
    { id: 'p1', name: 'Mango Pickle', price: 150, imageId: 'product-1', description: 'Spicy and tangy mango pickle', rating: 4.8, deliveryTime: '2-3 days', imageUrl: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', imageHint: 'mango pickle', variants: [{ name: 'Weight', options: ['250gm', '500gm', '1kg'] }, { name: 'Bottle', options: ['Bottle', 'Without Bottle'] }] },
    { id: 'p4', name: 'Jhumka Earrings', price: 500, imageId: 'product-4', description: 'Traditional gold-plated jhumkas', rating: 4.8, deliveryTime: '5-7 days', imageUrl: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', imageHint: 'jhumka earrings' },
  ];
  return mockProducts.find(p => p.id === id);
}


export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [
        // Mock initial cart data
        { ...findMockProduct('p1')!, quantity: 2, selectedVariants: { 'Weight': '500gm', 'Bottle': 'Bottle' } },
        { ...findMockProduct('p4')!, quantity: 1, selectedVariants: {} },
      ],
      addToCart: (product, selectedVariants) => {
        const { toast } = useToast();
        const currentCart = get().cart;
        const existingItemIndex = currentCart.findIndex(item => item.id === product.id && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants));

        let updatedCart;
        if (existingItemIndex > -1) {
          updatedCart = [...currentCart];
          updatedCart[existingItemIndex].quantity += 1;
        } else {
          updatedCart = [...currentCart, { ...product, quantity: 1, selectedVariants }];
        }

        set({ cart: updatedCart });
        toast({
          title: "Added to cart!",
          description: `${product.name} has been added to your cart.`,
        });
      },
      removeFromCart: (productId) => {
        const { toast } = useToast();
        const product = get().cart.find(item => item.id === productId);
        set(state => ({
          cart: state.cart.filter(item => item.id !== productId),
        }));
        if (product) {
          toast({
            description: `${product.name} removed from cart.`,
          });
        }
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set(state => ({
          cart: state.cart.map(item =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

