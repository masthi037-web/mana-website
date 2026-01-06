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
  quantity: string;
  addons?: ProductAddonOption[];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  pricing: ProductPriceOption[]; // For quantity-based pricing
  imageId: string;
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryCost: number;
  createdAt: string;
  variants?: ProductVariant[];
  famous?: boolean;
  ingredients?: string;
  bestBefore?: string;
  instructions?: string;
};

export type ProductWithImage = Product & {
  imageUrl: string;
  imageHint: string;
};

export type Catalog = {
  id: string;
  name: string;
  products: Product[];
};

export type Category = {
  id: string;
  name: string;
  catalogs: Catalog[];
};
