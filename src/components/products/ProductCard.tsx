"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import type { ProductWithImage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AddToCartSheet } from '../cart/AddToCartSheet';
import { useTenant } from '@/components/providers/TenantContext';

interface ProductCardProps {
  product: ProductWithImage;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { text } = useTenant();
  const isWishlisted = isInWishlist(product.id);

  const activePrice = product.pricing && product.pricing.length > 0
    ? Math.min(...product.pricing.map(p => p.price))
    : (product.price || 0);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <Card
        className="card-root w-full h-full overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/20"
        >
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
            <div className="w-full pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCartSheet product={product}>
                <Button size="sm" className="w-full rounded-full font-semibold shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {text.quickAddButton || "Quick Add"}
                </Button>
              </AddToCartSheet>
            </div>
          </div>

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
            />
          </Button>
        </div>

        <CardContent className="p-4 md:p-5">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">
              {product.name}
            </h3>
            <span className="font-bold text-base md:text-lg whitespace-nowrap">
              ₹{activePrice.toFixed(0)}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("w-3 h-3 md:w-3.5 md:h-3.5 fill-current", i >= Math.floor(product.rating) && "text-muted-foreground/30 fill-muted-foreground/30")} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">({product.rating.toFixed(1)})</span>
          </div>

          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-4 h-8 md:h-10 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
            <span className="bg-secondary/50 px-2 py-1 rounded-md border border-border/50 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {product.deliveryTime}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <span className="font-medium text-emerald-600/80">FREE Delivery</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
