
import { ProductCard } from './ProductCard';
import type { ProductWithImage } from '@/lib/types';

interface ProductGridProps {
  products: ProductWithImage[];
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
