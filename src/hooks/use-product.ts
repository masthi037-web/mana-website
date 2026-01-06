import { create } from 'zustand';
import { Product } from '@/lib/types';

interface ProductState {
    products: Product[];
    setProducts: (products: Product[]) => void;
}

export const useProduct = create<ProductState>((set) => ({
    products: [],
    setProducts: (products) => set({ products }),
}));
