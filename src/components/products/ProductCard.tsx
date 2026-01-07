
"use client";

import Image from 'next/image';
import { Heart, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
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
    toggleWishlist(product);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <Card className="w-full h-full overflow-hidden rounded-3xl border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/20">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            data-ai-hint={product.imageHint}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
            {/* Quick Add Button - Pointer events re-enabled for button */}
            <div className="w-full pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCartSheet product={product}>
                <Button size="sm" className="w-full rounded-full font-semibold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  Quick Add
                </Button>
              </AddToCartSheet>
            </div>
          </div>

          {/* New Tag (Mock logic or check createdAt if available in product type later) */}
          {/* For now keeping Rating/Wishlist as they are valuable */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 text-muted-foreground backdrop-blur-sm hover:bg-white transition-colors"
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-all duration-300',
                isWishlisted
                  ? 'fill-primary text-primary'
                  : 'fill-transparent'
              )}
              strokeWidth={isWishlisted ? 2 : 1.5}
            />
          </Button>

          <Badge variant="secondary" className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-md text-foreground font-bold shadow-sm px-2 py-1 h-auto text-[10px] uppercase tracking-wider rounded-full">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span>{product.rating.toFixed(1)}</span>
          </Badge>
        </div>

        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2 gap-2">
            {/* <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight" title={product.name}>{product.name}</h3> */}
            {/* Keeping title, removing price from top right as requested to move it to bottom */}
            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight w-full" title={product.name}>{product.name}</h3>
            {/* <span className="font-bold text-lg whitespace-nowrap">₹{product.price.toFixed(0)}</span> */}
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10 leading-relaxed">{product.description}</p>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
            {/* Delivery Time Pill */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-full border border-border/50 backdrop-blur-sm">
              <Clock className="w-3 h-3" />
              <span>{product.deliveryTime}</span>
            </div>

            {/* Price Block */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Starts from</span>
              <span className="text-lg font-bold font-headline text-primary leading-none mt-0.5">
                {product.pricing && product.pricing.length > 0
                  ? `₹${Math.min(...product.pricing.map(p => p.price)).toFixed(0)}`
                  : (product.price ? `₹${product.price.toFixed(0)}` : 'NA')
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
