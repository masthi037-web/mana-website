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
    productImage?: string;
}

export interface Catalogue {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueStatus: string; // 'ACTIVE' etc.
    createdAt: string;
    products: Product[];
    catalogueImage?: string;
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
    razorpayKeyId: string;
    razorpayKeySecret: string;
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
    categoryImage?: string;
}

// ... existing interfaces ...

// --- Create Request Interfaces ---

export interface CreateCategoryRequest {
    companyId: string;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
    categoryImage?: string;
}

export interface CreateCategoryResponse {
    companyId: string;
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
    categoryImage?: string;
    createdAt: string;
    catalogues: null | Catalogue[];
}

export interface CreateCatalogueRequest {
    categoryId: string; // or number? User prompt showed "1" (string) but response has 1 (number). create request says "1".
    catalogueName: string;
    catalogueDescription: string;
    catalogueImage?: string;
}

export interface CreateCatalogueResponse {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueStatus: string;
    catalogueImage?: string;
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
    productImage?: string;
}

export interface CreateProductResponse {
    productId: number;
    catalogueId: number;
    productName: string; // ... other fields same as Product
    productStatus: string;
    productImage?: string;
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

export interface CustomerAddress {
    customerAddressId: number;
    addressName: string;
    customerDrNum: string;
    customerRoad: string;
    customerCity: string;
    customerState: string;
    customerCountry: string;
    customerPin: string;
    customerId?: number;
}

export interface CustomerDetails {
    customerId: number;
    companyId: string;
    customerName: string;
    customerMobileNumber: string;
    customerStatus: string;
    customerEmailId: string;
    createdAt: string;
    customerAddress: CustomerAddress[];
    customerImage?: string;
}

export interface UpdateCustomerRequest {
    customerId: number;
    companyId: string;
    customerName: string;
    customerMobileNumber: string;
    customerStatus: string;
    customerEmailId: string;
    createdAt: string;
    customerImage?: string;
}

export interface CheckoutValidationItem {
    productId: number;
    pricingId: number | null;
    productAddonIds: string; // "id1&&&id2"
}

export interface CheckoutValidationRequest {
    customerName: string;
    phoneNumber: string;
    domainName: string;
    items: CheckoutValidationItem[];
}

// --- Order & Payment Interfaces ---

export interface PaymentInitializationItem {
    productId: number;
    pricingId: number | null;
    productAddonIds: string;
    quantity: number;
}

export interface PaymentInitializationRequest {
    customerName: string;
    customerPhoneNumber: string;
    customerEmailId: string;
    domainName: string;
    customerAddress: string;
    customerCity: string;
    customerState: string;
    customerCountry: string;
    addressName: string;
    shipmentAmount: number;
    discount: string;
    discountName: string;
    discountAmount: number;
    totalCost: number;
    paymentMethod: string;
    customerNote: string;
    items: PaymentInitializationItem[];
}

export interface PaymentInitializationResponse {
    razorpayOrderId: string;
    razorpayKeyId: string;
    grandTotal: number;
    amountInPaise: number;
    currency: string;
    receiptId: string;
}

export interface CheckoutValidationProductDetail {
    productStatus: string; // 'ACTIVE' | 'INACTIVE'
    productPrice: number;
    addonAndAddonPrice: string[]; // ["id:price", "1:20"]
}

export interface CheckoutValidationResponse {
    productDetails: CheckoutValidationProductDetail[];
}
