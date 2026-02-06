import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant } from '@/lib/types';
import { CompanyInventory, Category as ApiCategory, Catalogue as ApiCatalogue, Product as ApiProduct, CheckoutValidationRequest, CheckoutValidationResponse, CheckoutCheckResponse, CategoryPublicResponse } from '@/lib/api-types';

import { apiClient } from './api-client';



// ... existing imports

import { mapApiCategoriesToAppCategories, mapApiProductToAppProduct } from './mappers';

// Helper to centralize products-by-category logic
async function fetchCategoryProductsAPI(categoryId: string | number, forceFresh: boolean = false): Promise<ApiCategory | null> {
    const catIdStr = String(categoryId);
    // Defensive check
    if (!catIdStr || catIdStr === 'undefined' || catIdStr === 'null') return null;


    try {
        const catData = await apiClient<ApiCategory>('/company/public/get-products-by-category/get', {
            params: { categoryId: catIdStr },
            next: { revalidate: forceFresh ? 0 : 420 }, // If forced, 0. Else Sync with Client Cache (7 mins)
            // cache: 'no-store' // Removed no-store to allow revalidation
        });
        // Log brief summary instead of full dump

        return catData;
    } catch (e) {
        console.error(`Failed to fetch category ${catIdStr}`, e);
        return null; // Return null so callers handle it
    }
}

export async function fetchCategories(companyId: string, deliveryTime?: string, fetchAllAtOnce: boolean = true): Promise<AppCategory[]> {

    if (!companyId) return [];

    try {
        if (!fetchAllAtOnce) {

            const categories = await apiClient<CategoryPublicResponse[]>('/category/public/get-all-by-company', {
                params: { companyId },
                next: { revalidate: 420, tags: ['categories'] } // Cache the category list (7 mins)
            });

            if (!categories || categories.length === 0) {

                return [];
            }

            const firstCategory = categories[0];
            let firstCategoryData: AppCategory | null = null;

            if (firstCategory && firstCategory.categoryId) {
                // Initial Load always uses Cache (forceFresh=false)
                const catData = await fetchCategoryProductsAPI(firstCategory.categoryId, false);
                if (catData) {
                    const mappedCats = mapApiCategoriesToAppCategories(Array.isArray(catData) ? catData : [catData], deliveryTime);
                    firstCategoryData = mappedCats[0];

                }
            }

            return categories.map((cat, index) => {
                if (index === 0 && firstCategoryData) {
                    return {
                        ...firstCategoryData,
                        id: String(cat.categoryId), // Ensure we use the ID from the list as anchor
                        name: firstCategoryData.name || cat.categoryName,
                        categoryImage: firstCategoryData.categoryImage || cat.categoryImage
                    };
                }
                return {
                    id: String(cat.categoryId),
                    name: cat.categoryName,
                    categoryImage: cat.categoryImage || (cat as any).image || (cat as any).category_image || '',
                    catalogs: [] // Empty catalogs implies not loaded
                };
            });

        } else {

            const data = await apiClient<CompanyInventory>('/company/public/category/catalogue/product/get', {
                params: { companyId },
                next: { revalidate: 420, tags: ['products'] } // 7 minutes cache
            });

            return mapApiCategoriesToAppCategories(data.categories || [], deliveryTime);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function fetchProductsByCategory(categoryId: string, deliveryTime?: string, forceFresh: boolean = false): Promise<AppCategory | null> {
    const catData = await fetchCategoryProductsAPI(categoryId, forceFresh);
    if (!catData) return null;

    const mappedCats = mapApiCategoriesToAppCategories(Array.isArray(catData) ? catData : [catData], deliveryTime);
    return mappedCats[0] || null;
}

export async function fetchProductDetails(productId: string): Promise<AppProduct | null> {
    try {
        // Using the company-agnostic product get endpoint if available, or finding it in catalog
        // Assuming a standard endpoint for now based on user request "call get product details API"
        // We will guess '/company/public/product/get/{productId}' or similar. 
        // Given the user gave a specific JSON, let's assume valid response.

        // Actually, to be safe and use existing patterns, checking if there is a direct ID endpoint.
        // If not, we might need to rely on the user providing the endpoint or use a standard one.
        // I will use `params` structure similar to others.

        const data = await apiClient<ApiProduct>(`/product/details/get`, {
            params: { productId },
            next: { revalidate: 0 } // No cache for checkout validation
        });

        return mapApiProductToAppProduct(data);
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}




export async function validateCheckout(payload: CheckoutValidationRequest): Promise<CheckoutCheckResponse[] | null> {
    try {

        const data = await apiClient<{ productDetails: CheckoutCheckResponse[] }>('/product/checkout/check', {
            method: 'POST',
            body: JSON.stringify(payload),
            next: { revalidate: 0 } // No cache
        });
        return data.productDetails;
    } catch (error) {
        console.error('Checkout validation failed:', error);
        return null;
    }
}

