import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant } from '@/lib/types';
import { CompanyInventory, Category as ApiCategory, Catalogue as ApiCatalogue, Product as ApiProduct } from '@/lib/api-types';

const API_BASE_URL = 'http://localhost:8080/api/v1/rurify-services';
// Placeholder images map to randomize/match images if needed, or we just use picsum if the API gives filenames
const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

export async function fetchCategories(companyName?: string): Promise<AppCategory[]> {
    try {
        const url = new URL(`${API_BASE_URL}/product/catalogue/category/get`);
        if (companyName) {
            url.searchParams.append('companyName', companyName);
        }

        const res = await fetch(url.toString(), {
            cache: 'no-store', // Ensure fresh data for now
        });

        if (!res.ok) {
            console.error('Failed to fetch categories:', res.status, res.statusText);
            return [];
        }

        const data: CompanyInventory = await res.json();

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
    if (apiProd.productPricing && apiProd.productPricing.length > 0) {
        // Example: Create a "Size" or "Quantity" variant based on pricing
        const quantityOptions = apiProd.productPricing.map(p => p.productQuantity).filter(Boolean);
        if (quantityOptions.length > 0) {
            variants.push({
                name: "Quantity",
                options: quantityOptions
            });
        }
    }

    // Image handling: The API sends filenames like "mysorepak.jpg". 
    // We need a real URL. For now, we will use a generated placeholder based on the ID 
    // to ensure images always load, as we don't have the static file server base URL yet.
    const seed = apiProd.productId.toString();
    const imageUrl = `${PLACEHOLDER_BASE}/${seed}/300/300`;

    return {
        id: String(apiProd.productId),
        name: apiProd.productName,
        description: apiProd.productInfo,
        price: firstPricing ? firstPricing.productPrice : apiProd.productDeliveryCost, // Fallback to delivery cost or 0 if no price
        imageId: String(apiProd.productId), // Used for internal mapping if needed
        rating: apiProd.productRatings && apiProd.productRatings.length > 0
            ? apiProd.productRatings.reduce((acc, curr) => acc + curr.productRating, 0) / apiProd.productRatings.length
            : 4.5, // Default rating if none
        deliveryTime: '30-45 min', // Hardcoded for now as it's not in API
        variants: variants.length > 0 ? variants : undefined
    };
}
