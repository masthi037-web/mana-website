
import { ProductCard } from './ProductCard';
import type { ProductWithImage } from '@/lib/types';

interface ProductGridProps {
  products: ProductWithImage[];
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
