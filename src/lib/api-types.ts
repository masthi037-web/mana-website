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
    famous: boolean;
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

export interface CompanyDetails {
    companyId: string;
    companyName: string;
    companyDomain: string;
    companyPhone: string;
    companyMessage: string | null;
    companyEmail: string;
    gstNumber: string;
    logo: string;
    banner: string;
    companyCoupon: string;
    ownerName: string;
    ownerEmail: string;
    companyStatus: string;
    ownerPhone: string;
    companyAddress: string;
    companyCity: string;
    companyState: string;
    companyPinCode: string;
    companyFssAi: string;
    companyProductCategory: string;
    deliveryBetween: string;
    companyEstDate: string;
    averageRating: number;
    totalRating: number;
    noOfRatings: number;
    companyRegisteredAt: string;
    updatedAt: string;
    minimumOrderCost: string;
    freeDeliveryCost: string;
    socialMediaLink: string | null;
    about: string;
}

export interface CompanyInventory {
    companyId: number;
    categories: Category[];
}

export interface Category {
    categoryId: number;
    categoryName: string;
    catalogues: Catalogue[];
    companyId: string;
    categories: Category[];
}

// ... existing interfaces ...

// --- Create Request Interfaces ---

export interface CreateCategoryRequest {
    companyId: string;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
}

export interface CreateCategoryResponse {
    companyId: string;
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
    createdAt: string;
    catalogues: null | Catalogue[];
}

export interface CreateCatalogueRequest {
    categoryId: string; // or number? User prompt showed "1" (string) but response has 1 (number). create request says "1".
    catalogueName: string;
    catalogueDescription: string;
}

export interface CreateCatalogueResponse {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueStatus: string;
    createdAt: string;
    products: null | Product[];
}

export interface CreateProductRequest {
    catalogueId: number;
    productName: string;
    productIng: string;
    productBestBefore: string;
    productInst: string;
    productInfo: string;
    productPics: string;
    productStatus: string;
    famous: boolean;
    productDeliveryCost: number;
}

export interface CreateProductResponse {
    productId: number;
    catalogueId: number;
    productName: string; // ... other fields same as Product
    productStatus: string;
    createdAt: string;
}

export interface CreatePricingRequest {
    productId: number;
    productPrice: number;
    productQuantity: string;
}

export interface CreatePricingResponse {
    productPricingId: number;
    productId: number;
    productPrice: number;
    productQuantity: string;
    productAddons: ProductAddon[];
}

export interface CreateAddonRequest {
    productPricingId: number;
    addonName: string;
    addonPrice: number;
    mandatory: boolean;
    active: boolean;
}

export interface CreateAddonResponse {
    productAddonId: number;
    productPricingId: number;
    addonName: string;
    addonPrice: number;
    mandatory: boolean;
    active: boolean;
}
