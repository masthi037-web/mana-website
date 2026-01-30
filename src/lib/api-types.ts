export interface ProductSizeColour {
    productSizeColourId: number;
    productSizeId: number;
    colourName: string;
    colourPrice: number;
    productSizeColourQuantity: string;
    productPics?: string;
    sizeColourStatus: string;
}

// Renamed ProductPricing to ProductSize
export interface ProductSize {
    productSizeId: number;
    productId: number;
    productSizePrice: number;
    productSizePriceAfterDiscount: number;
    size: string;
    sizeQuantity: string;
    productSizeColours: ProductSizeColour[];
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
    productType?: string;
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
    productType?: string;
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
    productType?: string;
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
    productType?: string;
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
    productSizeColours: ProductSizeColour[];
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
    productSizeColours: ProductSizeColour[];
}
export interface CreateSizeColourRequest {
    productSizeId: number;
    colourName: string;
    colourPrice: number;
    productSizeColourQuantity: string;
    productPics?: string;
    sizeColourStatus: string;
}

export interface CreateSizeColourResponse {
    productSizeColourId: number;
    productSizeId: number;
    colourName: string;
    colourPrice: number;
    productSizeColourQuantity: string;
    productPics?: string;
    sizeColourStatus: string;
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
    productSizeColourId: number | null;
}

export interface CheckoutCheckResponse {
    multipleSetDiscount: string | null;
    multipleDiscountMoreThan: string | null;
    productOffer: string | null;
    productStatus: string;
    productPrice: number;
    productPriceAfterDiscount: number;
    colourStatus: string | null;
    colour: string | null;
    colourQuantityAvailable: string | null;
    sizeStatus: string | null;
    productSizePrice: number | null;
    productSizePriceAfterDiscount: number;
    productSize: string | null;
    productQuantityAvailable: string;
    sizeQuantity: string;

    // New fields requested
    sizeColourName: string | null;
    colourExtraPrice: number;
    productSizeColourQuantity: string | null;
    sizeColourStatus: string | null;
    productSizeColourId: number | null;

    // Existing but maybe deprecated or still used? Keeping for safety unless removal requested.
    sizeColourAndPrice?: string[];

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
    productSizeColourId: number | null;
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
    sizeColourAndPrice: string[]; // ["id:price", "1:20"]
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
    productColourQuantity: string;
}

export interface CreateColourResponse {
    productColourId: number;
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
    productColourQuantity: string;
}

export interface UpdateColourRequest {
    productColourId: number;
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
    productColourQuantity: string;
}

export interface UpdateColourResponse {
    productColourId: number;
    productId: number;
    productPics: string;
    colourStatus: string;
    colour: string;
    productColourQuantity: string;
}

export interface SaveOrderItem {
    productId: number;
    productName: string;
    productImage?: string | null;
    productPriceAfterDiscount?: number | null;
    quantity: number;
    totalCost: number;
    // Optional Variant Fields
    productColourId?: number | null;
    productColour?: string;
    productColourImage?: string;
    productSizeId?: number | null;
    productSizeName?: string;
    productSizePriceAfterDiscount?: number | null;
    productSizeColourId?: number | null;
    productSizeColourName?: string;
    productSizeColourImage?: string;
    productSizeColourExtraPrice?: number | null;
}

export interface SaveOrderRequest {
    orderId?: number; // Optional, likely generated by server but included in type for safety
    orderNumber?: string;
    companyId: string;
    companyDomain: string;
    customerId: number;
    customerName: string;
    customerPhone: string;
    deliveryRoad: string; // Address Line
    deliveryPin: string;
    deliveryCity: string;
    deliveryState: string;
    orderStatus: string; // 'CREATED'
    subTotal: number;
    allDiscount: number;
    finalTotalAmount: number;
    paymentPic?: string | null;
    createdAt?: string; // Optional
    updatedAt?: string; // Optional
    items: SaveOrderItem[];
}
