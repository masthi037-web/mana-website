import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant } from '@/lib/types';
import { CompanyInventory, Category as ApiCategory, Catalogue as ApiCatalogue, Product as ApiProduct } from '@/lib/api-types';

import { apiClient } from './api-client';

// Placeholder images map to randomize/match images if needed, or we just use picsum if the API gives filenames
const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

export async function fetchCategories(companyId: string): Promise<AppCategory[]> {
    try {
        const data = await apiClient<CompanyInventory>('/company/category/catalogue/product/get', {
            params: { companyId },
            next: { revalidate: 900, tags: ['products'] } // 15 minutes cache
        });

        // The API returns a robust structure, we need to map it to our App's simpler types
        // Accessing the first item in the array if it's an array, or the object itself.
        // The user's JSON showed the root as an object, but sometimes these APIs return arrays. 
        // Types say CompanyInventory has 'categories', so we assume 'data' IS CompanyInventory.

        return mapApiCategoriesToAppCategories(data.categories || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

function mapApiCategoriesToAppCategories(apiCategories: ApiCategory[]): AppCategory[] {
    return apiCategories.map(cat => ({
        id: String(cat.categoryId),
        name: cat.categoryName,
        catalogs: cat.catalogues.map(mapApiCatalogueToAppCatalog)
    }));
}

function mapApiCatalogueToAppCatalog(apiCat: ApiCatalogue): AppCatalog {
    return {
        id: String(apiCat.catalogueId),
        name: apiCat.catalogueName,
        products: apiCat.products.map(mapApiProductToAppProduct)
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

    // Image handling: The API sends filenames like "mysorepak.jpg". 
    // We need a real URL. For now, we will use a generated placeholder based on the ID 
    // to ensure images always load, as we don't have the static file server base URL yet.
    const seed = apiProd.productId.toString();
    const imageUrl = `${PLACEHOLDER_BASE}/${seed}/300/300`;

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
