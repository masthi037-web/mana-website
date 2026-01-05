
"use client";

import Image from 'next/image';
import { Heart, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import type { ProductWithImage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AddToCartSheet } from '../cart/AddToCartSheet';
import Link from 'next/link';

interface ProductCardProps {
  product: ProductWithImage;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id, product.name);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={product.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/80 text-muted-foreground backdrop-blur-sm hover:bg-white"
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-all duration-300',
                isWishlisted
                  ? 'fill-primary text-primary'
                  : 'fill-transparent'
              )}
              strokeWidth={isWishlisted ? 2 : 1.5}
            />
          </Button>
          <Badge variant="outline" className="absolute top-3 left-3 flex items-center gap-1 border-green-600 bg-green-50 text-green-700 font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base leading-tight text-foreground truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground truncate mt-1">{product.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Starts from</p>
              <p className="text-lg font-bold text-foreground">
                ₹{product.price.toFixed(0)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{product.deliveryTime}</span>
            </div>
          </div>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <AddToCartSheet product={product}>
              <Button className="w-full">Add to Cart</Button>
            </AddToCartSheet>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
