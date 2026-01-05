"use client";

import { useEffect, useState } from 'react';
import { getRecommendationsAction } from '@/app/actions';
import { ProductGrid } from './ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductWithImage } from '@/lib/types';

const RecommendationSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
    ))}
  </div>
);

export default function Recommendations() {
  const [recommendedProducts, setRecommendedProducts] = useState<ProductWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      const products = await getRecommendationsAction();
      setRecommendedProducts(products);
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return <RecommendationSkeleton />;
  }

  if (recommendedProducts.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No recommendations available at the moment.
      </div>
    );
  }

  return <ProductGrid products={recommendedProducts} />;
}
