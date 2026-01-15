"use client";

import { useState, useEffect } from 'react';
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

  // Carousel Logic
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (product.images && product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % (product.images?.length || 1));
      }, 2000); // Change slide every 2 seconds
      return () => clearInterval(interval);
    }
  }, [product.images]);

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <Card
        className="card-root relative w-full h-full overflow-hidden border-transparent bg-card transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        style={{
          borderRadius: '1rem', // Compact Premium Radius
        }}
      >
        {/* Image Container - 3:2 Ratio (Shorter) */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-secondary/5">
          {/* Slider Container */}
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {(product.images && product.images.length > 0 ? product.images : [product.imageUrl]).map((imgSrc, idx) => (
              <div key={idx} className="relative w-full h-full flex-shrink-0">
                <Image
                  src={imgSrc || `https://picsum.photos/seed/${product.id}/300/300`}
                  alt={`${product.name} - ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                  className="object-cover"
                  data-ai-hint={product.imageHint}
                />
              </div>
            ))}
          </div>

          {/* Dots Indicator (visible if > 1 image) */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {product.images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {/* Rating Badge */}
            {product.rating > 0 && (
              <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-foreground shadow-sm">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground transition-all duration-300 shadow-sm z-20"
            onClick={handleWishlistClick}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isWishlisted ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Quick Add Overlay - Desktop Only */}
          <div className="absolute inset-x-0 bottom-0 p-3 transition-transform duration-500 ease-out z-20 translate-y-full group-hover:translate-y-0 hidden md:block">
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCartSheet product={product}>
                <Button className="w-full rounded-full shadow-lg shadow-primary/25 font-semibold h-10 text-sm transition-all hover:shadow-primary/40">
                  {text.quickAddButton || "Quick Add"}
                </Button>
              </AddToCartSheet>
            </div>
          </div>
        </div>

        {/* Content - Compact Spacing */}
        <CardContent className="p-4 flex flex-col gap-2">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-headline font-bold text-base text-foreground leading-snug line-clamp-1" title={product.name}>
              {product.name}
            </h3>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline font-bold text-base text-primary tracking-tight">
                ₹{activePrice.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Rating Row (Classic positioning in body) */}
          <div className="flex items-center gap-1 -mt-0.5">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("w-3 h-3 fill-current", i >= Math.floor(product.rating) && "text-muted-foreground/20 fill-muted-foreground/20")} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium ml-1">({product.rating.toFixed(1)})</span>
          </div>

          <p className="text-muted-foreground text-xs line-clamp-2 h-8 leading-relaxed opacity-80 font-medium hidden md:block">
            {product.description}
          </p>

          {/* Footer Row */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="p-1 px-2 rounded-full bg-secondary/40 text-foreground/70 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                <span>{product.deliveryTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 font-medium text-primary">
              <ShoppingBag className="w-3 h-3" />
              <span>Free Delivery</span>
            </div>
          </div>

          {/* Mobile Quick Add Button - Content Area */}
          <div className="mt-1 block md:hidden" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <AddToCartSheet product={product}>
              <Button className="w-full rounded-full shadow-lg shadow-primary/25 font-semibold h-9 text-sm transition-all hover:shadow-primary/40">
                {text.quickAddButton || "Quick Add"}
              </Button>
            </AddToCartSheet>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
