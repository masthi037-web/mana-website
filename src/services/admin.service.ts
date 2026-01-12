import { apiClient } from './api-client';
import {
    CreateCategoryRequest, CreateCategoryResponse,
    CreateCatalogueRequest, CreateCatalogueResponse,
    CreateProductRequest, CreateProductResponse,
    CreatePricingRequest, CreatePricingResponse,
    CreateAddonRequest, CreateAddonResponse
} from '@/lib/api-types';

export const adminService = {
    createCategory: async (data: CreateCategoryRequest) => {
        return apiClient<CreateCategoryResponse>('/category/create', {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
        });
    },

    createCatalogue: async (data: CreateCatalogueRequest) => {
        return apiClient<CreateCatalogueResponse>('/catalogue/create', {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
        });
    },

    createProduct: async (data: CreateProductRequest) => {
        return apiClient<CreateProductResponse>('/product/create', {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
        });
    },

    createPricing: async (data: CreatePricingRequest) => {
        return apiClient<CreatePricingResponse>('/product/pricing/create', {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
        });
    },

    createAddon: async (data: CreateAddonRequest) => {
        return apiClient<CreateAddonResponse>('/product/addon/create', {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
        });
    },

    getAllCategories: async (companyId: string) => {
        return apiClient<any[]>('/category/get-all-by-company', {
            params: { companyId },
            credentials: 'include',
        });
    },

    getCataloguesByCategory: async (categoryId: string) => {
        return apiClient<any[]>(`/catalogue/get-all-by-category/${categoryId}`, {
            credentials: 'include',
        });
    },

    getProductsByCatalogue: async (catalogueId: string) => {
        return apiClient<any[]>('/product/catalogue/all', {
            params: { catalogueId },
            credentials: 'include',
        });
    },

    getProductPricing: async (productId: string) => {
        return apiClient<any[]>('/product/pricing/get', {
            params: { productId },
            credentials: 'include',
        });
    },

    getProductAddons: async (productPricingId: string | number) => {
        return apiClient<any[]>('/product/addon/get', {
            params: { productPricingId: String(productPricingId) },
            credentials: 'include',
        });
    }
};
