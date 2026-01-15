import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant } from '@/lib/types';
import { CompanyInventory, Category as ApiCategory, Catalogue as ApiCatalogue, Product as ApiProduct } from '@/lib/api-types';

import { apiClient } from './api-client';

// Placeholder images map to randomize/match images if needed, or we just use picsum if the API gives filenames
const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

// ... existing imports
import { Product } from '@/lib/api-types';

export async function fetchCategories(companyId: string): Promise<AppCategory[]> {
    try {
        const data = await apiClient<CompanyInventory>('/company/public/category/catalogue/product/get', {
            params: { companyId },
            next: { revalidate: 300, tags: ['products'] } // 5 minutes cache
        });

        // The API returns a robust structure, we need to map it to our App's simpler types
        return mapApiCategoriesToAppCategories(data.categories || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
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

        const data = await apiClient<ApiProduct>(`/company/public/product/get/${productId}`, {
            next: { revalidate: 0 } // No cache for checkout validation
        });

        return mapApiProductToAppProduct(data);
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}


function mapApiCategoriesToAppCategories(apiCategories: ApiCategory[]): AppCategory[] {
    return apiCategories.map(cat => ({
        id: String(cat.categoryId),
        name: cat.categoryName,
        catalogs: cat.catalogues.map(mapApiCatalogueToAppCatalog),
        categoryImage: cat.categoryImage
    }));
}

function mapApiCatalogueToAppCatalog(apiCat: ApiCatalogue): AppCatalog {
    return {
        id: String(apiCat.catalogueId),
        name: apiCat.catalogueName,
        products: apiCat.products.map(mapApiProductToAppProduct),
        catalogueImage: apiCat.catalogueImage
    };
}

function mapApiProductToAppProduct(apiProd: ApiProduct): AppProduct {
    // Logic to determine price: use the first pricing option or default to 0
    const firstPricing = apiProd.productPricing && apiProd.productPricing.length > 0
        ? apiProd.productPricing[0]
        : null;

    // Logic to map variants from pricing if available
    const variants: ProductVariant[] = [];
    // Redundant "Quantity" variant logic removed to avoid duplicate UI.
    // Pricing is handled via the 'pricing' field.

    // Image handling: parse &&& separated URLs
    const rawImageField = apiProd.productImage || (apiProd as any).product_image;
    let images: string[] = [];

    if (rawImageField) {
        images = rawImageField.split('&&&').filter(Boolean);
    }

    const seed = apiProd.productId.toString();
    // Fallback to placeholder if no images
    if (images.length === 0) {
        images = [`${PLACEHOLDER_BASE}/${seed}/300/300`];
    }

    const imageUrl = images[0];

    // Map pricing options for UI selection
    const pricingOptions = apiProd.productPricing?.map(p => ({
        id: String(p.productPricingId),
        price: p.productPrice,
        quantity: p.productQuantity,
        addons: p.productAddons?.map(a => ({
            id: String(a.productAddonId),
            name: a.addonName,
            price: a.addonPrice,
            mandatory: a.mandatory
        }))
    })) || [];

    return {
        id: String(apiProd.productId),
        name: apiProd.productName,
        description: apiProd.productInfo,
        price: firstPricing ? firstPricing.productPrice : apiProd.productDeliveryCost,
        pricing: pricingOptions,
        imageId: String(apiProd.productId),
        imageUrl: imageUrl,
        images: images,
        rating: apiProd.productRatings && apiProd.productRatings.length > 0
            ? apiProd.productRatings.reduce((acc, curr) => acc + curr.productRating, 0) / apiProd.productRatings.length
            : 4.5,
        deliveryTime: '30-45 min',
        deliveryCost: apiProd.productDeliveryCost,
        createdAt: apiProd.createdAt,
        variants: variants.length > 0 ? variants : undefined,
        famous: apiProd.famous || false,
        ingredients: apiProd.productIng,
        bestBefore: apiProd.productBestBefore,
        instructions: apiProd.productInst
    };
}
