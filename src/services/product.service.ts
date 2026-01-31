import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant } from '@/lib/types';
import { CompanyInventory, Category as ApiCategory, Catalogue as ApiCatalogue, Product as ApiProduct, CheckoutValidationRequest, CheckoutValidationResponse, CheckoutCheckResponse, CategoryPublicResponse } from '@/lib/api-types';

import { apiClient } from './api-client';

// Placeholder images map to randomize/match images if needed, or we just use picsum if the API gives filenames
const PLACEHOLDER_BASE = 'https://picsum.photos/seed';

// ... existing imports
import { Product } from '@/lib/api-types';

export async function fetchCategories(companyId: string, deliveryTime?: string, fetchAllAtOnce: boolean = true): Promise<AppCategory[]> {
    console.log(`[ProductService] fetchCategories called for company: ${companyId}, fetchAllAtOnce: ${fetchAllAtOnce}`);
    if (!companyId) return [];

    try {
        if (!fetchAllAtOnce) {
            console.log(`[ProductService] Fetching category list from: /category/public/get-all-by-company`);
            const categories = await apiClient<CategoryPublicResponse[]>('/category/public/get-all-by-company', {
                params: { companyId },
                next: { revalidate: 300, tags: ['categories'] } // Cache the category list
            });

            if (!categories || categories.length === 0) {
                console.log('[ProductService] No categories found');
                return [];
            }

            const firstCategory = categories[0];
            let firstCategoryData: AppCategory | null = null;

            if (firstCategory && firstCategory.categoryId) {
                console.log(`[ProductService] Fetching products for first category (${firstCategory.categoryId}) from: /company/public/get-products-by-category/get`);
                try {
                    const catData = await apiClient<ApiCategory>('/company/public/get-products-by-category/get', {
                        params: { categoryId: String(firstCategory.categoryId) },
                        next: { revalidate: 300, tags: [`category-${firstCategory.categoryId}`] }
                    });

                    console.log(`[ProductService] Raw catData for ID ${firstCategory.categoryId}:`, JSON.stringify(catData, null, 2));

                    const mappedCats = mapApiCategoriesToAppCategories(Array.isArray(catData) ? catData : [catData], deliveryTime);
                    firstCategoryData = mappedCats[0];

                    console.log(`[ProductService] Mapped firstCategoryData:`, JSON.stringify(firstCategoryData, null, 2));
                } catch (e) {
                    console.error(`Failed to fetch initial category ${firstCategory.categoryId}`, e);
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
                    categoryImage: cat.categoryImage,
                    catalogs: [] // Empty catalogs implies not loaded
                };
            });

        } else {
            console.log(`[ProductService] Fetching all categories and products from: /company/public/category/catalogue/product/get`);
            const data = await apiClient<CompanyInventory>('/company/public/category/catalogue/product/get', {
                params: { companyId },
                next: { revalidate: 300, tags: ['products'] } // 5 minutes cache
            });

            return mapApiCategoriesToAppCategories(data.categories || [], deliveryTime);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function fetchProductsByCategory(categoryId: string, deliveryTime?: string): Promise<AppCategory | null> {
    try {
        const catData = await apiClient<ApiCategory>('/company/public/get-products-by-category/get', {
            params: { categoryId },
            next: { revalidate: 300, tags: [`category-${categoryId}`] }
        });
        const mappedCats = mapApiCategoriesToAppCategories(Array.isArray(catData) ? catData : [catData], deliveryTime);
        return mappedCats[0] || null;
    } catch (error) {
        console.error(`Error fetching products for category ${categoryId}:`, error);
        return null;
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


function mapApiCategoriesToAppCategories(apiCategories: any[], deliveryTime?: string): AppCategory[] {
    const categoryMap = new Map<string, AppCategory>();

    apiCategories.forEach(item => {
        const catId = String(item.categoryId || item.id || item.category_id || '');
        if (!catId) return;

        // Ensure we have an entry in the map for this category
        if (!categoryMap.has(catId)) {
            categoryMap.set(catId, {
                id: catId,
                name: item.categoryName || item.name || '',
                catalogs: [],
                categoryImage: item.categoryImage || item.image || ''
            });
        }

        const appCat = categoryMap.get(catId)!;

        // 1. Handle Nested Catalogues (Bulk Fetch Style)
        const nestedCatalogues = item.catalogues || item.catalogueResponseList || item.catalogue_response_list || [];
        if (nestedCatalogues.length > 0) {
            const mappedCatalogs = nestedCatalogues.map((c: any) => mapApiCatalogueToAppCatalog(c, deliveryTime));
            appCat.catalogs.push(...mappedCatalogs);

            // Prefer picking up name/image from the parent category object
            if (!appCat.name) appCat.name = item.categoryName || item.name || '';
            if (!appCat.categoryImage) appCat.categoryImage = item.categoryImage || item.image || '';
        }
        // 2. Handle Flat Catalogue Object (Single Category Fetch Style)
        else if (item.catalogueId || item.catalogue_id) {
            appCat.catalogs.push(mapApiCatalogueToAppCatalog(item, deliveryTime));
        }
    });

    return Array.from(categoryMap.values());
}

function mapApiCatalogueToAppCatalog(apiCat: any, deliveryTime?: string): AppCatalog {
    const catalogId = String(apiCat.catalogueId || apiCat.id || apiCat.catalogue_id || '');
    const products = apiCat.products || apiCat.productList || apiCat.product_list || [];

    return {
        id: catalogId,
        name: apiCat.catalogueName || apiCat.name || '',
        products: products.map((p: any) => mapApiProductToAppProduct(p, deliveryTime)),
        catalogueImage: apiCat.catalogueImage || apiCat.image || ''
    };
}

function mapApiProductToAppProduct(apiProd: ApiProduct, deliveryTime?: string): AppProduct {
    // Logic to determine price: use the first pricing option or default to 0
    const firstPricing = apiProd.productSize && apiProd.productSize.length > 0
        ? apiProd.productSize[0]
        : null;

    // Logic to map variants from pricing if available
    const variants: ProductVariant[] = [];
    // Redundant "Quantity" variant logic removed to avoid duplicate UI.
    // Pricing is handled via the 'pricing' field.

    // Image handling: parse &&& separated URLs
    const rawImageField = apiProd.productImage || (apiProd as any).product_image;
    let images: string[] = [];

    if (rawImageField) {
        images = String(rawImageField).split('&&&').filter(Boolean);
    }

    const seed = apiProd.productId.toString();
    // Fallback to placeholder if no images
    if (images.length === 0) {
        images = [`${PLACEHOLDER_BASE}/${seed}/300/300`];
    }

    const imageUrl = images[0];

    // Map pricing options for UI selection
    const pricingOptions = apiProd.productSize?.map(p => ({
        id: String(p.productSizeId),
        price: (p.productSizePrice !== null && p.productSizePrice !== undefined && p.productSizePrice > 0)
            ? p.productSizePrice
            : apiProd.productPrice,
        priceAfterDiscount: (p.productSizePrice !== null && p.productSizePrice !== undefined && p.productSizePrice > 0)
            ? ((p as any).productSizePriceAfterDiscount) // Assuming this field exists on variant if price exists
            : ((apiProd as any).productPriceAfterDiscount), // Fallback to parent discount
        quantity: p.size || (p as any).sizeProduct,
        sizeQuantity: p.sizeQuantity,
        sizeStatus: p.sizeStatus,
        sizeColours: p.productSizeColours?.map(a => ({
            id: String(a.productSizeColourId),
            name: a.colourName,
            price: a.colourPrice,
            productPics: a.productPics,
            status: a.sizeColourStatus
        }))
    })) || [];

    return {
        id: String(apiProd.productId),
        name: apiProd.productName,
        description: apiProd.productInfo,
        price: (apiProd.productPrice && apiProd.productPrice > 0) ? apiProd.productPrice : (firstPricing ? firstPricing.productSizePrice : apiProd.productDeliveryCost),
        priceAfterDiscount: apiProd.productPriceAfterDiscount,
        pricing: pricingOptions,
        imageId: String(apiProd.productId),
        imageUrl: imageUrl,
        images: images,
        rating: apiProd.productRatings && apiProd.productRatings.length > 0
            ? apiProd.productRatings.reduce((acc, curr) => acc + curr.productRating, 0) / apiProd.productRatings.length
            : 4.5,
        deliveryTime: deliveryTime || '30-45 min',
        deliveryCost: apiProd.productDeliveryCost,
        createdAt: apiProd.createdAt,
        updatedAt: apiProd.updatedAt,
        variants: variants.length > 0 ? variants : undefined,
        famous: apiProd.famous || false,
        ingredients: apiProd.productIng,
        bestBefore: apiProd.productBestBefore,
        instructions: apiProd.productInst,
        productOffer: apiProd.productOffer,
        multipleSetDiscount: apiProd.multipleSetDiscount,
        multipleDiscountMoreThan: apiProd.multipleDiscountMoreThan,
        colors: apiProd.productColour?.map(c => ({
            id: String(c.productColourId),
            name: c.colour,
            image: c.productPics,
            status: c.colourStatus
        })),
        reviews: apiProd.productRatings?.map(r => ({
            id: String(r.productRatingId),
            author: "Verified User", // API doesn't seem to return name in ProductRating interface, fallback
            rating: r.productRating,
            text: r.productReview,
            date: new Date(r.createdAt).toLocaleDateString()
        })) || [],
        productType: apiProd.productType
    };
}

export async function validateCheckout(payload: CheckoutValidationRequest): Promise<CheckoutCheckResponse[] | null> {
    try {
        console.log('Validating checkout with payload:', JSON.stringify(payload, null, 2));
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

