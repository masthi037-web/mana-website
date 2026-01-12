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

  // Hoist Pricing Logic
  const prices = product.pricing?.map(p => p.price) || [];
  const hasPricing = prices.length > 0;
  const minPrice = hasPricing ? Math.min(...prices) : (product.price || 0);
  const maxPrice = hasPricing ? Math.max(...prices) : (product.price || 0);
  // Show "Starts from" only if there are multiple pricing options AND they vary in price
  const showStartsFrom = hasPricing && minPrice !== maxPrice;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <Card
        className="card-root w-full h-full overflow-hidden transition-all duration-500 hover:shadow-xl border-transparent"
        style={{
          backgroundColor: 'var(--card-bg-custom, hsl(var(--card)))',
          borderRadius: 'var(--card-radius-custom, 1.5rem)',
          boxShadow: 'var(--card-shadow-custom, 0 1px 2px 0 rgb(0 0 0 / 0.05))',
          border: 'var(--card-border-custom, 1px solid hsl(var(--border) / 0.5))',
          transitionDuration: 'var(--motion-duration, 300ms)',
          transitionTimingFunction: 'var(--motion-easing, cubic-bezier(0.4, 0, 0.2, 1))',
        }}
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
            style={{
              transitionDuration: 'var(--motion-duration, 500ms)', // Slower for image
              transitionTimingFunction: 'var(--motion-easing, cubic-bezier(0.4, 0, 0.2, 1))',
            }}
            data-ai-hint={product.imageHint}
          />


          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 pointer-events-none">
            {/* Quick Add Button - Pointer events re-enabled for button */}
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
            <h3
              className="text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight w-full"
              title={product.name}
              style={{
                fontWeight: 'var(--type-product-weight, 500)',
                letterSpacing: 'var(--type-product-spacing, -0.01em)',
              }}
            >
              {product.name}
            </h3>
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
              {showStartsFrom && (
                <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{text.startsFrom || "Starts from"}</span>
              )}
              <span
                className="text-lg text-primary leading-none mt-0.5"
                style={{
                  fontWeight: 'var(--type-price-weight, 600)',
                  letterSpacing: 'var(--type-price-tracking, tight)',
                }}
              >
                ₹{minPrice.toFixed(0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Dynamic Hover Style Injection */}
      <style jsx global>{`
        .group:hover .card-root {
            transform: var(--motion-card-hover, translateY(-5px));
        }
      `}</style>
    </Link>
  );
};
