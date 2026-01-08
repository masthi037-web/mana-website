"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProductWithImage } from '@/lib/types';

interface WishlistState {
    wishlist: ProductWithImage[];
    addToWishlist: (product: ProductWithImage) => void;
    removeFromWishlist: (productId: string) => void;
    toggleWishlist: (product: ProductWithImage) => void;
    isInWishlist: (productId: string) => boolean;
    isWishlistOpen: boolean;
    setWishlistOpen: (isOpen: boolean) => void;
    checkExpiration: () => void;
    timestamp: number;
}

const EXPIRATION_TIME = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export const useWishlist = create<WishlistState>()(
    persist(
        (set, get) => ({
            wishlist: [],
            timestamp: Date.now(),
            isWishlistOpen: false,

            addToWishlist: (product) => {
                const { wishlist } = get();
                if (!wishlist.some(item => item.id === product.id)) {
                    set({
                        wishlist: [...wishlist, product],
                        timestamp: Date.now(), // Update timestamp on modification
                        isWishlistOpen: true // Open sidebar on add
                    });
                }
            },

            removeFromWishlist: (productId) => {
                set(state => ({
                    wishlist: state.wishlist.filter(item => item.id !== productId)
                }));
            },

            toggleWishlist: (product) => {
                const { isInWishlist, addToWishlist, removeFromWishlist } = get();
                if (isInWishlist(product.id)) {
                    removeFromWishlist(product.id);
                } else {
                    addToWishlist(product);
                }
            },

            isInWishlist: (productId) => {
                return get().wishlist.some(item => item.id === productId);
            },

            setWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),

            syncWithServer: (latestProducts: ProductWithImage[]) => {
                const { wishlist } = get();
                let hasChanges = false;

                const updatedWishlist = wishlist.map(item => {
                    const fresh = latestProducts.find(p => p.id === item.id);
                    if (fresh) {
                        if (fresh.price !== item.price || fresh.name !== item.name || fresh.imageUrl !== item.imageUrl) {
                            hasChanges = true;
                            return { ...item, ...fresh };
                        }
                    }
                    return item;
                }).filter(item => {
                    const exists = latestProducts.some(p => p.id === item.id);
                    if (!exists) hasChanges = true;
                    return exists;
                });

                if (hasChanges) {
                    set({ wishlist: updatedWishlist, timestamp: Date.now() });
                }
            },

            checkExpiration: () => {
                const { timestamp } = get();
                const now = Date.now();
                if (now - timestamp > EXPIRATION_TIME) {
                    // Expired, clear wishlist
                    set({ wishlist: [], timestamp: now });
                }
            }
        }),
        {
            name: 'wishlist-storage',
            storage: createJSONStorage(() => localStorage), // Using localStorage for longer persistence
            onRehydrateStorage: () => (state) => {
                // Check for expiration immediately upon hydration
                state?.checkExpiration();
            }
        }
    )
);
