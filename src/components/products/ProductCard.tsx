"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Clock, ShoppingBag } from 'lucide-react';
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

  // Logic to determine price
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
        className="card-root relative w-full h-full overflow-hidden border-transparent bg-card transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        style={{
          borderRadius: '1.25rem', // Premium Rounded corners
        }}
      >
        {/* Image Container - Classic 4:3 Ratio */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/10">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            data-ai-hint={product.imageHint}
          />

          {/* Gradient Overlay for Text Contrast/Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {/* Rating Badge - Glassmorphism */}
            {product.rating > 0 && (
              <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md px-2 py-1 rounded-full text-[11px] font-bold text-foreground shadow-sm">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Wishlist Button - Floating Glassmorphism */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground transition-all duration-300 shadow-sm"
            onClick={handleWishlistClick}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isWishlisted ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Quick Add Overlay - Static on Mobile, Slide-up on Desktop */}
          <div className="absolute inset-x-0 bottom-0 p-4 z-20 transition-transform duration-500 ease-out translate-y-0 md:translate-y-full md:group-hover:translate-y-0">
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCartSheet product={product}>
                <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg font-semibold h-11">
                  {text.quickAddButton || "Quick Add"}
                </Button>
              </AddToCartSheet>
            </div>
          </div>
        </div>

        {/* Content - Classic Layout with Premium Typography */}
        <CardContent className="p-4 md:p-5 flex flex-col gap-3">
          {/* Header Row: Title & Price side-by-side (Classic) */}
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-headline font-bold text-base md:text-lg text-foreground leading-snug line-clamp-2" title={product.name}>
              {product.name}
            </h3>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline font-bold text-base md:text-lg text-primary tracking-tight">
                ₹{activePrice.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Rating Row (Classic positioning in body) */}
          <div className="flex items-center gap-1 -mt-1">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("w-3.5 h-3.5 fill-current", i >= Math.floor(product.rating) && "text-muted-foreground/20 fill-muted-foreground/20")} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium ml-1">({product.rating.toFixed(1)})</span>
          </div>

          <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 h-8 md:h-10 leading-relaxed opacity-80 font-medium">
            {product.description}
          </p>

          {/* Footer Row: Delivery (Modern Styling) */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="p-1 px-2 rounded-full bg-secondary/40 text-foreground/70 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                <span>{product.deliveryTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-primary">
              <ShoppingBag className="w-3 h-3" />
              <span>Free Delivery</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
