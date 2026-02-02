"use client";

import { useProduct } from "@/hooks/use-product";
import { useCart } from "@/hooks/use-cart";
import { Category, Product } from "@/lib/types";
import { CompanyDetails } from "@/lib/api-types";
import { useRef } from "react";

interface ProductInitializerProps {
    categories: Category[];
    companyDetails: CompanyDetails | null;
}

export function ProductInitializer({ categories, companyDetails }: ProductInitializerProps) {
    const initialized = useRef(false);

    if (!initialized.current) {
        // 1. Manually Hydrate from LocalStorage (to restore lazily fetched categories)
        useProduct.persist.rehydrate();

        // 1b. Check Expiration
        useProduct.getState().checkExpiration();

        const state = useProduct.getState();
        const existingCategories = state.categories || [];
        const existingProducts = state.products || [];

        // 2. Merge Initial Categories (Server Data) with Existing (Cache)
        // We prioritize Server Data for the categories passed in props
        const mergedCategories = [...existingCategories];

        categories.forEach(serverCat => {
            const index = mergedCategories.findIndex(c => c.id === serverCat.id);
            if (index !== -1) {
                // Smart Merge: Only overwrite if serverCat has data OR existing is empty.
                // If existing has catalogs but serverCat is empty (lazy load placeholder), keep existing.
                const existing = mergedCategories[index];
                if (existing.catalogs.length > 0 && serverCat.catalogs.length === 0) {
                    // Keep existing data, maybe update non-data fields if needed? 
                    // For now, assume existing is better.
                    // We can update name/image if we want, but usually existing is fine.
                    mergedCategories[index] = {
                        ...serverCat,
                        catalogs: existing.catalogs
                    };
                } else {
                    mergedCategories[index] = serverCat;
                }
            } else {
                mergedCategories.push(serverCat); // Add new
            }
        });

        // 3. Re-derive Flat Product List
        const allProducts = mergedCategories.flatMap(cat => cat.catalogs.flatMap(c => c.products)).map(p => ({
            ...p,
            imageHint: "",
            imageUrl: p.productImage || ""
        }));

        useProduct.setState({ products: allProducts, categories: mergedCategories });
        if (companyDetails) {
            useCart.setState({ companyDetails });
        }

        // Sync Cart and Wishlist with latest server data
        // We use the raw store getState() to avoid needing Hook rules inside this conditional or causing re-renders

        import('@/hooks/use-wishlist').then(({ useWishlist }) => {
            useWishlist.getState().syncWithServer(allProducts);
        });

        initialized.current = true;
    }

    return null;
}
