import { apiClient } from './api-client';
import {
    CreateCategoryRequest, CreateCategoryResponse,
    CreateCatalogueRequest, CreateCatalogueResponse,
    CreateProductRequest, CreateProductResponse,
    CreatePricingRequest, CreatePricingResponse,
    UpdatePricingRequest, UpdatePricingResponse,
    CreateColourRequest, CreateColourResponse,
    UpdateColourRequest, UpdateColourResponse,
    UpdateCategoryRequest, UpdateCategoryResponse,
    UpdateCatalogueRequest, UpdateCatalogueResponse,
    UpdateProductRequest,
    CreateSizeColourRequest, CreateSizeColourResponse,
    UpdateSizeColourRequest, UpdateSizeColourResponse,
    CompanyRegistrationRequest, CompanyDetails, UpdateCompanyRequest
} from '@/lib/api-types';

export const adminService = {
    registerCompany: async (data: CompanyRegistrationRequest) => {
        return apiClient<CompanyDetails>('/company/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAllCompanies: async () => {
        return apiClient<CompanyDetails[]>('/company/get-all-companies', {
            method: 'GET',
            next: { revalidate: 300 }
        });
    },

    updateCompany: async (data: UpdateCompanyRequest) => {
        return apiClient<CompanyDetails>('/company/details/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

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

    updateProduct: async (data: UpdateProductRequest) => {
        return apiClient<CreateProductResponse>('/product/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createPricing: async (data: CreatePricingRequest) => {
        return apiClient<CreatePricingResponse>('/product/size/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateProductSize: async (data: UpdatePricingRequest) => {
        return apiClient<UpdatePricingResponse>('/product/size/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createProductColour: async (data: CreateColourRequest) => {
        return apiClient<CreateColourResponse>('/product/colour/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateProductColour: async (data: UpdateColourRequest) => {
        return apiClient<UpdateColourResponse>('/product/colour/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createSizeColour: async (data: CreateSizeColourRequest) => {
        return apiClient<CreateSizeColourResponse>('/product/size-colour/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateSizeColour: async (data: UpdateSizeColourRequest) => {
        return apiClient<UpdateSizeColourResponse>('/product/size-colour/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteSizeColour: async (productSizeColourId: string | number) => {
        return apiClient<any>('/product/size-colour/delete', {
            method: 'DELETE',
            params: { productSizeColourId: String(productSizeColourId) }
        });
    },

    getAllCategories: async (companyId: string) => {
        return apiClient<any[]>('/category/public/get-all-by-company', {
            params: { companyId },
            next: { revalidate: 3600 } // 1 hour cache
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
        return apiClient<any[]>('/product/size/get', {
            params: { productId },
            next: { revalidate: 300 }
        });
    },

    getProductColours: async (productId: string | number) => {
        return apiClient<any[]>('/product/colour/get', {
            params: { productId: String(productId) },
            next: { revalidate: 300 }
        });
    },

    getProductSizeColours: async (productSizeId: string | number) => {
        return apiClient<any[]>('/product/size-colour/get', {
            params: { productSizeId: String(productSizeId) },
            next: { revalidate: 300 }
        });
    },

    deleteProduct: async (productId: string | number) => {
        return apiClient<any>('/product/delete', {
            method: 'DELETE',
            params: { productId: String(productId) }
        });
    },

    getSignedUploadUrl: async (companyDomain: string, fileName: string, contentType: string) => {
        return apiClient<{ signedUrl: string; filePath: string }>('/company/get-signed-url', {
            method: 'POST',
            params: { companyDomain, fileName, contentType }
        });
    }
};
