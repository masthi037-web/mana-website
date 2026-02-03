import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Category, Product } from '@/lib/types';

interface ProductState {
    products: Product[];
    categories: Category[];
    selectedProduct: Product | null;
    setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
    setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
    setSelectedProduct: (product: Product | null) => void;
    syncProductGlobally: (product: Product) => void;
    categoryTimestamps: Record<string, number>;
    markCategoryAsFetched: (categoryId: string) => void;
    isCategoryExpired: (categoryId: string) => boolean;
}

const EXPIRATION_TIME = 1 * 60 * 1000; // 1 minute for debugging (was 7)

export const useProduct = create<ProductState>()(
    persist(
        (set, get) => ({
            products: [],
            categories: [],
            selectedProduct: null,
            categoryTimestamps: {},
            setProducts: (products) => set((state) => ({
                products: typeof products === 'function' ? products(state.products) : products,
            })),
            setCategories: (categories) => set((state) => ({
                categories: typeof categories === 'function' ? categories(state.categories) : categories,
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
            },
            markCategoryAsFetched: (categoryId: string) => set((state) => ({
                categoryTimestamps: { ...(state.categoryTimestamps || {}), [categoryId]: Date.now() }
            })),
            isCategoryExpired: (categoryId: string) => {
                const { categoryTimestamps } = get();
                // Handle missing map (migration from old state)
                if (!categoryTimestamps) return true;

                const timestamp = categoryTimestamps[categoryId];
                if (!timestamp) return true; // Never fetched = Expired

                const elapsed = Date.now() - timestamp;
                const isExpired = elapsed > EXPIRATION_TIME;
                console.log(`[useProduct] Checking Expired Cat ${categoryId}: Now=${Date.now()}, Ts=${timestamp}, Elapsed=${elapsed}, LIMIT=${EXPIRATION_TIME}, Result=${isExpired}`);
                return isExpired;
            },
            checkExpiration: () => {
                // Deprecated or can be used to clean up map, but for now logic moves to usage sites
            }
        }),
        {
            name: 'product-storage', // name of the item in the storage (must be unique)
            version: 2, // Bump version to force reset
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            skipHydration: true, // We will manually hydrate or let it happen, but avoiding mismatch issues during SSR
        }
    )
);
