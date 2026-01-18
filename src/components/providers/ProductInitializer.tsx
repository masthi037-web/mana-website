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
        const allProducts = categories.flatMap(cat => cat.catalogs.flatMap(c => c.products)).map(p => ({
            ...p,
            imageHint: "", // Default value as API doesn't provide it yet
            imageUrl: p.productImage || "" // Map API field
        }));
        useProduct.setState({ products: allProducts });
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
