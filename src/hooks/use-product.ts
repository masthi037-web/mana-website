import { create } from 'zustand';
import { Category, Product } from '@/lib/types';

interface ProductState {
    products: Product[];
    categories: Category[];
    selectedProduct: Product | null;
    setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
    setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
    setSelectedProduct: (product: Product | null) => void;
    syncProductGlobally: (product: Product) => void;
}

export const useProduct = create<ProductState>((set, get) => ({
    products: [],
    categories: [],
    selectedProduct: null,
    setProducts: (products) => set((state) => ({
        products: typeof products === 'function' ? products(state.products) : products
    })),
    setCategories: (categories) => set((state) => ({
        categories: typeof categories === 'function' ? categories(state.categories) : categories
    })),
    setSelectedProduct: (selectedProduct: Product | null) => set({ selectedProduct }),
    syncProductGlobally: (freshProd: Product) => {
        const { products, categories } = get();

        // 1. Sync in flat list
        const updatedProducts = products.map((p: Product) => p.id === freshProd.id ? freshProd : p);

        // 2. Sync in deep categories structure
        const updatedCategories = categories.map((cat: Category) => ({
            ...cat,
            catalogs: cat.catalogs.map((catalog: any) => ({
                ...catalog,
                products: catalog.products.map((p: Product) => p.id === freshProd.id ? freshProd : p)
            }))
        }));

        set({ products: updatedProducts, categories: updatedCategories });
    }
}));
