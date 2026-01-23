import { create } from 'zustand';
import { Product } from '@/lib/types';

interface ProductState {
    products: Product[];
    selectedProduct: Product | null;
    setProducts: (products: Product[]) => void;
    setSelectedProduct: (product: Product | null) => void;
}

export const useProduct = create<ProductState>((set) => ({
    products: [],
    selectedProduct: null,
    setProducts: (products) => set({ products }),
    setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
}));
