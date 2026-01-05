export type ProductVariant = {
  name: string;
  options: string[];
};

export type Product = {
  id: string;
  name: string;
  price: number;
  imageId: string;
  description: string;
  rating: number;
  deliveryTime: string;
  variants?: ProductVariant[];
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
