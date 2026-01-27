export interface ProductAddon {
    productAddonId: number;
    productSizeId: number;
    addonName: string;
    addonPrice: number;
    mandatory: boolean;
    active: boolean;
}

// Renamed ProductPricing to ProductSize
export interface ProductSize {
    productSizeId: number;
    productId: number;
    productSizePrice: number;
    productSizePriceAfterDiscount: number;
    size: string;
    sizeQuantity: string;
    productAddons: ProductAddon[];
    sizeStatus: string;
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
    productQuantity: string;
    createdAt: string;
    productPrice: number;
    productPriceAfterDiscount: number;
    updatedAt: string;
    productSize: ProductSize[];
    productRatings: ProductRating[];
    famous: boolean;
    productImage?: string;
    productOffer?: string;
    multipleSetDiscount?: string;
    multipleDiscountMoreThan?: string;
    productColour?: ProductColour[];
}

export interface ProductColour {
    productColourId: number;
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
}

export interface UpdateProductRequest {
    productId: number;
    catalogueId: number;
    productName: string;
    productImage: string;
    multipleSetDiscount: string;
    multipleDiscountMoreThan: string;
    productPrice: number;
    productPriceAfterDiscount: number;
    productOffer: string;
    productIng: string;
    productBestBefore: string;
    productInst: string;
    productInfo: string;
    productPics: string;
    productStatus: string;
    productDeliveryCost: number;
    productQuantity: string;
    famous: boolean;
    createdAt?: string;
    updatedAt?: string;
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

export interface CompanyFeature {
    title: string;
    description: string;
    icon: string;
    color?: string;
    bgColor?: string;
    iconColor?: string;
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
    features?: CompanyFeature[];
    companyRegisteredAt: string;
    updatedAt: string;
    minimumOrderCost: string;
    freeDeliveryCost: string;
    socialMediaLink: string | null;
    about: string;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpay?: boolean;
    upiQrCode?: string;
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

export interface UpdateCategoryRequest {
    companyId: string;
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
    categoryImage?: string;
    createdAt: string;
}

export interface UpdateCategoryResponse {
    companyId: string;
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
    categoryStatus: string;
    categoryImage?: string;
    createdAt: string;
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

export interface UpdateCatalogueRequest {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueImage?: string;
    catalogueStatus: string;
    createdAt: string;
}

export interface UpdateCatalogueResponse {
    categoryId: number;
    catalogueId: number;
    catalogueName: string;
    catalogueDescription: string;
    catalogueStatus: string;
    catalogueImage?: string;
    createdAt: string;
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
    productQuantity: string;
    productPrice: number;
    productPriceAfterDiscount: number;
    productImage?: string;
    productOffer?: string;
    multipleSetDiscount?: string;
    multipleDiscountMoreThan?: string;
}

export interface CreateProductResponse {
    productId: number;
    catalogueId: number;
    productName: string; // ... other fields same as Product
    productStatus: string;
    productQuantity: string;
    productPrice: number;
    productPriceAfterDiscount: number;
    productImage?: string;
    productOffer?: string;
    multipleSetDiscount?: string;
    multipleDiscountMoreThan?: string;
}

export interface CreatePricingRequest {
    productId: number;
    productSizePrice?: number | null;
    productSizePriceAfterDiscount?: number | null;
    size: string;
    sizeQuantity: string;
    sizeStatus: string;
}

export interface CreatePricingResponse {
    productSizeId: number;
    productId: number;
    productSizePrice: number;
    productSizePriceAfterDiscount: number;
    size: string;
    sizeQuantity: string;
    productAddons: ProductAddon[];
    sizeStatus: string;
}

export interface UpdatePricingRequest {
    productSizeId: number;
    productId: number;
    productSizePrice?: number | null;
    productSizePriceAfterDiscount?: number | null;
    size: string;
    sizeQuantity: string;
    sizeStatus: string;
}

export interface UpdatePricingResponse {
    productSizeId: number;
    productId: number;
    productSizePrice: number;
    productSizePriceAfterDiscount: number;
    size: string;
    sizeQuantity: string;
    productAddons: ProductAddon[];
}
export interface CreateAddonRequest {
    productSizeId: number;
    addonName: string;
    addonPrice: number;
    mandatory: boolean;
    active: boolean;
}

export interface CreateAddonResponse {
    productAddonId: number;
    productSizeId: number;
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

// Validaton for checkout
export interface CheckoutValidationItem {
    productId: number;
    sizeId: number | null; // Renamed from pricingId to sizeId as per requirement
    productColourId: number | null;
    productAddonIds: string; // "id1&&&id2"
}

export interface CheckoutCheckResponse {
    multipleSetDiscount: string;
    multipleDiscountMoreThan: string;
    productOffer: string;
    productStatus: string; // Enums.Status
    productPrice: number;
    productPriceAfterDiscount: number;
    colourStatus: string; // Enums.Status
    colour: string;
    sizeStatus: string; // Enums.Status
    productSizePrice: number;
    productSizePriceAfterDiscount: number;
    productSize: string;
    productQuantityAvailable: string;
    sizeQuantity: string;
    addonAndAddonPrice: string[];
    productId: number;
    sizeId: number | null;
    productColourId: number | null;
}

export interface CheckoutValidationRequest {
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
    productPriceAfterDiscount?: number;
    addonAndAddonPrice: string[]; // ["id:price", "1:20"]
}

export interface CheckoutValidationResponse {
    productDetails: CheckoutValidationProductDetail[];
}

export interface PaymentVerificationRequest {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface PaymentVerificationResponse {
    status: string; // 'success' | 'failed'
    orderId?: string;
    message?: string;
}

export interface CreateColourRequest {
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
}

export interface CreateColourResponse {
    productColourId: number;
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
}
