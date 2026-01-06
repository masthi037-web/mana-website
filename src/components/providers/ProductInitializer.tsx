"use client";

import { useProduct } from "@/hooks/use-product";
import { Category, Product } from "@/lib/types";
import { useRef } from "react";

export function ProductInitializer({ categories }: { categories: Category[] }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        const allProducts = categories.flatMap(cat => cat.catalogs.flatMap(c => c.products));
        useProduct.setState({ products: allProducts });
        initialized.current = true;
    }

    return null;
}
