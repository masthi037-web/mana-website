export interface ProductAddon {
    productAddonId: number;
    productPricingId: number;
    addonName: string;
    addonPrice: number;
    mandatory: boolean;
    active: boolean;
}

export interface ProductPricing {
    productPricingId: number;
    productId: number;
    productPrice: number;
    productQuantity: string;
    productAddons: ProductAddon[];
}

export interface ProductRating {
    productRatingId: number;
    productId: number;
    customerId: number;
    productRating: number;
    productReview: string;
    createdAt: string;
}

export interface Product {
    productId: number;
    catalogueId: number;
    productName: string;
    productIng: string;
    productBestBefore: string;
    productInst: string;
    productInfo: string;
    productPics: string;
    productStatus: string; // 'ACTIVE' | 'INACTIVE' etc.
    productDeliveryCost: number;
    createdAt: string;
    productPricing: ProductPricing[];
    productRatings: ProductRating[];
}

export interface Catalogue {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueStatus: string; // 'ACTIVE' etc.
    createdAt: string;
    products: Product[];
}

export interface Category {
    companyId: string;
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string; // 'ACTIVE' etc.
    createdAt: string;
    catalogues: Catalogue[];
}

export interface CompanyInventory {
    companyId: string;
    categories: Category[];
}
