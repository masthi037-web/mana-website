"use client";

import { useProduct } from "@/hooks/use-product";
import { useCart } from "@/hooks/use-cart";
import { Category, Product } from "@/lib/types";
import { CompanyDetails } from "@/lib/api-types";
import { useRef, useEffect } from "react";

interface ProductInitializerProps {
    categories: Category[];
    companyDetails: CompanyDetails | null;
}

export function ProductInitializer({ categories, companyDetails }: ProductInitializerProps) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            // 1. Manually Hydrate from LocalStorage (to restore lazily fetched categories)
            useProduct.persist.rehydrate();

            const state = useProduct.getState();
            const existingCategories = state.categories || [];

            // 2. Merge Initial Categories (Server Data) with Existing (Cache)
            const mergedCategories = [...existingCategories];
            const newTimestamps = { ...state.categoryTimestamps };

            categories.forEach(serverCat => {
                const index = mergedCategories.findIndex(c => c.id === serverCat.id);
                const isExpired = state.isCategoryExpired ? state.isCategoryExpired(serverCat.id) : false;

                if (index !== -1) {
                    const existing = mergedCategories[index];

                    // Case 1: Server has Data (Catalogs > 0) -> ALWAYS Update (server authority)
                    if (serverCat.catalogs && serverCat.catalogs.length > 0) {
                        mergedCategories[index] = serverCat;
                        // Mark as fresh since it came from Server
                        newTimestamps[serverCat.id] = Date.now();
                    }
                    // Case 2: Server is Skeleton (Lazy Load placeholder)
                    else {
                        // Case 2a: Expired? -> Treat as empty, so we accept skeleton to trigger fetch later
                        if (isExpired) {
                            mergedCategories[index] = serverCat; // Reset to skeleton (clears stale data)
                        }
                        // Case 2b: Existing has Data -> Keep Existing (prevent overwrite)
                        else if (existing.catalogs && existing.catalogs.length > 0) {
                            // Update metadata (name/image) but keep catalogs
                            mergedCategories[index] = {
                                ...serverCat,
                                catalogs: existing.catalogs
                            };
                        }
                        // Case 2c: Existing is also empty -> Update with Server (accept skeleton)
                        else {
                            mergedCategories[index] = serverCat;
                        }
                    }
                } else {
                    mergedCategories.push(serverCat); // Add new
                    if (serverCat.catalogs && serverCat.catalogs.length > 0) {
                        newTimestamps[serverCat.id] = Date.now();
                    }
                }
            });

            // 3. Re-derive Flat Product List
            const allProducts = mergedCategories.flatMap(cat => cat.catalogs.flatMap(c => c.products)).map(p => ({
                ...p,
                imageHint: "",
                imageUrl: p.productImage || ""
            }));

            useProduct.setState({
                products: allProducts,
                categories: mergedCategories,
                categoryTimestamps: newTimestamps
            });

            if (companyDetails) {
                useCart.setState({ companyDetails });
            }

            // Sync Cart and Wishlist with latest server data
            import('@/hooks/use-wishlist').then(({ useWishlist }) => {
                useWishlist.getState().syncWithServer(allProducts);
            });

            initialized.current = true;
        }
    }, [categories, companyDetails]);

    return null;
}
