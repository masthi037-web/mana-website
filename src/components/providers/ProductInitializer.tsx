"use client";

import { useProduct } from "@/hooks/use-product";
import { Category, Product } from "@/lib/types";
import { useRef } from "react";

export function ProductInitializer({ categories }: { categories: Category[] }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        const allProducts = categories.flatMap(cat => cat.catalogs.flatMap(c => c.products));
        useProduct.setState({ products: allProducts });

        // Sync Cart and Wishlist with latest server data
        // We use the raw store getState() to avoid needing Hook rules inside this conditional or causing re-renders
        import('@/hooks/use-cart').then(({ useCart }) => {
            useCart.getState().syncWithServer(allProducts);
        });
        import('@/hooks/use-wishlist').then(({ useWishlist }) => {
            useWishlist.getState().syncWithServer(allProducts);
        });

        initialized.current = true;
    }

    return null;
}
