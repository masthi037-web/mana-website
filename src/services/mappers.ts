import { Category as AppCategory, Catalog as AppCatalog, Product as AppProduct, ProductVariant, Review } from '@/lib/types';
import { Product as ApiProductType, Category as ApiCategory } from '@/lib/api-types';

// Re-export specific ApiProduct Type if needed or import directly
type ApiProduct = ApiProductType;


export function mapApiCategoriesToAppCategories(apiCategories: any[], deliveryTime?: string): AppCategory[] {
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
        const productsAtCategoryLevel = item.products || item.productList || item.product_list || [];

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
        // 3. Handle Products Directly under Category
        else if (productsAtCategoryLevel.length > 0) {
            appCat.catalogs.push({
                id: `default-${catId}`,
                name: 'All Products',
                catalogueImage: item.categoryImage || item.image || '',
                products: productsAtCategoryLevel.map((p: any) => mapApiProductToAppProduct(p, deliveryTime))
            });
        }
    });

    return Array.from(categoryMap.values());
}

export function mapApiCatalogueToAppCatalog(apiCat: any, deliveryTime?: string): AppCatalog {
    const catalogId = String(apiCat.catalogueId || apiCat.id || apiCat.catalogue_id || '');
    const products = apiCat.products || apiCat.productList || apiCat.product_list || [];

    return {
        id: catalogId,
        name: apiCat.catalogueName || apiCat.name || '',
        products: products.map((p: any) => mapApiProductToAppProduct(p, deliveryTime)),
        catalogueImage: apiCat.catalogueImage || apiCat.image || ''
    };
}

export function mapApiProductToAppProduct(apiProd: ApiProduct, deliveryTime?: string): AppProduct {
    // Logic to determine price: use the first pricing option or default to 0
    const firstPricing = apiProd.productSize && apiProd.productSize.length > 0
        ? apiProd.productSize[0]
        : null;

    // Logic to map variants from pricing if available
    const variants: ProductVariant[] = [];

    // Image handling: parse &&& separated URLs
    const rawImageField = apiProd.productImage || (apiProd as any).product_image || apiProd.productPics;
    let images: string[] = [];
    if (rawImageField) {
        images = String(rawImageField).split('&&&').filter((s: string) => s.trim().length > 0 && s !== "https://cdn.example.com/products/default.jpg");
    }

    // Default main image (Take 1st ONE only, NO PICSUM FALLBACK)
    // If empty, it stays empty.
    const mainImage = images.length > 0 ? images[0] : '';

    // Calculate rating
    const rating = apiProd.productRatings && apiProd.productRatings.length > 0
        ? apiProd.productRatings.reduce((acc, curr) => acc + curr.productRating, 0) / apiProd.productRatings.length
        : 0; // Default to 0 or 4.5 based on preference, using 0 for now as 'no ratings'.

    // Map Reviews
    const reviews: Review[] = apiProd.productRatings?.map(r => ({
        id: String(r.productRatingId),
        author: "Verified User",
        rating: r.productRating,
        text: r.productReview,
        date: new Date(r.createdAt).toLocaleDateString()
    })) || [];

    // Pricing Options
    const pricingOptions = apiProd.productSize?.map(p => ({
        id: String(p.productSizeId),
        price: p.productSizePrice || apiProd.productPrice || 0,
        priceAfterDiscount: p.productSizePriceAfterDiscount,
        quantity: p.size || '', // 'quantity' in AppProduct pricing is string (e.g. "1kg")
        sizeQuantity: Number(p.sizeQuantity) || 0,
        sizeStatus: p.sizeStatus,
        sizeColours: p.productSizeColours?.map(a => ({
            id: String(a.productSizeColourId),
            name: a.colourName,
            price: a.colourPrice,
            productPics: a.productPics,
            productSizeColourQuantity: Number(a.productSizeColourQuantity) || 0,
            status: a.sizeColourStatus,
            sizeColourStatus: a.sizeColourStatus
        }))
    })) || [];

    return {
        id: String(apiProd.productId),
        name: apiProd.productName,
        description: apiProd.productInfo || '',
        price: firstPricing ? Number(firstPricing.productSizePrice) : (Number(apiProd.productPrice) || 0),
        priceAfterDiscount: apiProd.productPriceAfterDiscount,
        rating: rating,
        reviews: reviews, // AppProduct definition for reviews is Review[] | undefined? types.ts says Review[]

        imageId: String(apiProd.productId),
        imageUrl: mainImage,
        images: images,

        famous: apiProd.famous || false,
        deliveryTime: deliveryTime || '2-3 Days',
        deliveryCost: Number(apiProd.productDeliveryCost) || 0,

        pricing: pricingOptions,
        variants: variants,
        productOffer: apiProd.productOffer || undefined,
        productPrice: Number(apiProd.productPrice) || 0,

        // Fields mapped from API specific fields
        productStatus: (apiProd as any).productStatus, // using any if strict check fails or just direct if interface matches
        productType: apiProd.productType,
        ingredients: apiProd.productIng,
        bestBefore: apiProd.productBestBefore,
        instructions: apiProd.productInst,
        createdAt: apiProd.createdAt,
        updatedAt: apiProd.updatedAt,

        productQuantity: apiProd.productQuantity,
        multipleSetDiscount: apiProd.multipleSetDiscount,
        multipleDiscountMoreThan: apiProd.multipleDiscountMoreThan,

        colors: apiProd.productColour?.map(c => ({
            id: String(c.productColourId),
            name: c.colour,
            image: c.productPics,
            status: c.colourStatus,
            colourStatus: c.colourStatus
        }))
    };
}
