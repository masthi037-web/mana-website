import { apiClient } from './api-client';
import {
    CreateCategoryRequest, CreateCategoryResponse,
    CreateCatalogueRequest, CreateCatalogueResponse,
    CreateProductRequest, CreateProductResponse,
    CreatePricingRequest, CreatePricingResponse,
    CreateAddonRequest, CreateAddonResponse,
    UpdateCategoryRequest, UpdateCategoryResponse,
    UpdateCatalogueRequest, UpdateCatalogueResponse
} from '@/lib/api-types';

export const adminService = {
    createCategory: async (data: CreateCategoryRequest) => {
        return apiClient<CreateCategoryResponse>('/category/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateCategory: async (data: UpdateCategoryRequest) => {
        return apiClient<UpdateCategoryResponse>('/category/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createCatalogue: async (data: CreateCatalogueRequest) => {
        return apiClient<CreateCatalogueResponse>('/catalogue/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateCatalogue: async (data: UpdateCatalogueRequest) => {
        return apiClient<UpdateCatalogueResponse>('/catalogue/update', {
            method: 'PUT',
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
            params: { companyId },
            next: { revalidate: 300 } // 5 minutes cache
        });
    },

    getCataloguesByCategory: async (categoryId: string) => {
        return apiClient<any[]>(`/catalogue/get-all-by-category/${categoryId}`, {
            next: { revalidate: 300 }
        });
    },

    getProductsByCatalogue: async (catalogueId: string) => {
        return apiClient<any[]>('/product/catalogue/all', {
            params: { catalogueId },
            next: { revalidate: 300 }
        });
    },

    getProductPricing: async (productId: string) => {
        return apiClient<any[]>('/product/pricing/get', {
            params: { productId },
            next: { revalidate: 300 }
        });
    },

    getProductAddons: async (productPricingId: string | number) => {
        return apiClient<any[]>('/product/addon/get', {
            params: { productPricingId: String(productPricingId) },
            next: { revalidate: 300 }
        });
    },

    getSignedUploadUrl: async (companyDomain: string, fileName: string, contentType: string) => {
        return apiClient<{ signedUrl: string; filePath: string }>('/company/get-signed-url', {
            method: 'POST',
            params: { companyDomain, fileName, contentType }
        });
    }
};
