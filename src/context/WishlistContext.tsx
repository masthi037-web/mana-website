"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast"

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string, productName: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleWishlist = useCallback((productId: string, productName: string) => {
    setWishlist(prevWishlist => {
      const isInWishlist = prevWishlist.includes(productId);
      if (isInWishlist) {
        setTimeout(() => {
            toast({
              description: `${productName} removed from wishlist.`,
            });
        }, 0);
        return prevWishlist.filter(id => id !== productId);
      } else {
        setTimeout(() => {
            toast({
                description: `${productName} added to wishlist!`,
            });
        }, 0);
        return [...prevWishlist, productId];
      }
    });
  }, [toast]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
