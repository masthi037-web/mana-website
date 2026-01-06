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
        });
    },

    createCatalogue: async (data: CreateCatalogueRequest) => {
        return apiClient<CreateCatalogueResponse>('/company/catalogue/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    createProduct: async (data: CreateProductRequest) => {
        return apiClient<CreateProductResponse>('/product/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    createPricing: async (data: CreatePricingRequest) => {
        return apiClient<CreatePricingResponse>('/product/pricing/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    createAddon: async (data: CreateAddonRequest) => {
        return apiClient<CreateAddonResponse>('/product/addon/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAllCategories: async (companyId: string) => {
        return apiClient<any[]>('/category/get-all-by-company', {
            params: { companyId }
        });
    },

    getCataloguesByCategory: async (categoryId: string) => {
        return apiClient<any[]>(`/company/catalogue/get/all/${categoryId}`);
    },

    getProductsByCatalogue: async (catalogueId: string) => {
        return apiClient<any[]>('/product/catalogue/all', {
            params: { catalogueId }
        });
    },

    getProductPricing: async (productId: string) => {
        return apiClient<any[]>('/product/pricing/get', {
            params: { productId }
        });
    },

    getProductAddons: async (productPricingId: string | number) => {
        return apiClient<any[]>('/product/addon/get', {
            params: { productPricingId: String(productPricingId) }
        });
    }
};
