export type ProductVariant = {
  name: string;
  options: string[];
};

export type ProductAddonOption = {
  id: string;
  name: string;
  price: number;
  mandatory: boolean;
};

export type ProductPriceOption = {
  id: string;
  price: number;
  priceAfterDiscount?: number;
  quantity: string;
  addons?: ProductAddonOption[];
  sizeStatus?: string;
};

export type ProductColor = {
  id: string;
  name: string;
  image: string;
  status: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  priceAfterDiscount?: number;
  pricing: ProductPriceOption[]; // For quantity-based pricing
  imageId: string;
  imageUrl?: string; // Kept for backward compatibility, will be first image
  images?: string[]; // New field for multiple images
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryCost: number;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  famous?: boolean;
  ingredients?: string;
  bestBefore?: string;
  instructions?: string;
  productImage?: string;
  productOffer?: string;
  multipleSetDiscount?: string;
  multipleDiscountMoreThan?: string;
  productQuantity?: string;
  colors?: ProductColor[];
  productStatus?: string;
};

export type ProductWithImage = Product & {
  imageUrl: string;
  imageHint: string;
};

export type Catalog = {
  id: string;
  name: string;
  products: Product[];
  catalogueImage?: string;
};

export type Category = {
  id: string;
  name: string;
  catalogs: Catalog[];
  categoryImage?: string;
};
