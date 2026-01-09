"use client";

import { useWishlist } from '@/hooks/use-wishlist';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Heart, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative text-center mb-12">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 md:hidden"
        >
          <Link href="/">
            <X className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
          My Wishlist
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your curated collection of favorite items.
        </p>
      </div>
      {wishlist.length > 0 ? (
        <ProductGrid products={wishlist} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 text-center mt-16 bg-secondary/50 p-8 md:p-12 rounded-xl">
          <div className="bg-primary/10 p-4 rounded-full">
            <Heart className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl md:text-3xl font-bold">Your wishlist is waiting</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Looks like you haven't added anything yet. Start exploring and save your favorites to see them here!
            </p>
          </div>
          <Button asChild size="lg" className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
