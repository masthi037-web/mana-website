
'use client';

import { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { categories } from '@/data/products';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ProductWithImage, ProductVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, Heart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';
import Recommendations from '@/components/products/Recommendations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const VariantSelector = ({
  variant,
  selectedOption,
  onOptionChange,
}: {
  variant: ProductVariant;
  selectedOption: string;
  onOptionChange: (option: string) => void;
}) => (
  <div>
    <h3 className="text-sm font-medium text-foreground">{variant.name}</h3>
    <div className="flex flex-wrap gap-2 mt-2">
      {variant.options.map((option) => (
        <Button
          key={option}
          variant={selectedOption === option ? 'default' : 'outline'}
          onClick={() => onOptionChange(option)}
          className={cn(
            'rounded-full',
            selectedOption === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground'
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);

const reviews = [
  {
    id: 1,
    author: 'Priya S.',
    avatar: 'https://picsum.photos/seed/review1/40/40',
    rating: 5,
    date: '2 weeks ago',
    text: "Absolutely delicious! The perfect blend of spices. Tastes just like homemade. Will definitely be buying again.",
  },
  {
    id: 2,
    author: 'Raj K.',
    avatar: 'https://picsum.photos/seed/review2/40/40',
    rating: 4,
    date: '1 month ago',
    text: "Very good quality and taste. The packaging was also excellent. A bit spicier than I expected, but I still enjoyed it.",
  },
  {
    id: 3,
    author: 'Anjali M.',
    avatar: 'https://picsum.photos/seed/review3/40/40',
    rating: 5,
    date: '3 months ago',
    text: "I'm obsessed with this! I've tried many brands, but this is by far the best. Highly recommended!",
  },
];

const ratingDistribution = [
  { star: 5, percentage: 80 },
  { star: 4, percentage: 15 },
  { star: 3, percentage: 3 },
  { star: 2, percentage: 1 },
  { star: 1, percentage: 1 },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const allProducts = categories.flatMap(c => c.catalogs.flatMap(ca => ca.products));
  const productData = allProducts.find(p => p.id === id);

  if (!productData) {
    notFound();
  }

  const image = PlaceHolderImages.find(img => img.id === productData.imageId);
  const product: ProductWithImage = {
    ...productData,
    imageUrl: image?.imageUrl || '',
    imageHint: image?.imageHint || 'product image',
  };

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((variant) => {
        initialState[variant.name] = variant.options[0];
      });
    }
    return initialState;
  });

  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: option }));
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity }, selectedVariants);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to products
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden shadow-lg md:aspect-auto md:h-[550px]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-5 w-5", i < Math.floor(product.rating) ? 'fill-current' : 'fill-muted stroke-muted-foreground')} />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">({product.rating.toFixed(1)} from {reviews.length} reviews)</span>
            </div>
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground">Starts from</p>
            <p className="text-4xl font-bold text-foreground">
              ₹{product.price.toFixed(2)}
            </p>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <VariantSelector
                  key={variant.name}
                  variant={variant}
                  selectedOption={selectedVariants[variant.name]}
                  onOptionChange={(option) => handleVariantChange(variant.name, option)}
                />
              ))}
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4 border rounded-full p-2">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="rounded-full h-8 w-8">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-6 text-center">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="rounded-full h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 shrink-0"
              onClick={() => toggleWishlist(product.id, product.name)}
            >
              <Heart className={cn("h-6 w-6", isWishlisted ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">
          Customer Reviews
        </h2>
        <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col items-center justify-center bg-secondary rounded-lg p-6">
              <p className="text-5xl font-bold text-foreground">{product.rating.toFixed(1)}</p>
              <div className="flex items-center gap-1 text-yellow-500 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-6 w-6", i < Math.floor(product.rating) ? 'fill-current' : 'fill-muted stroke-muted-foreground')} />
                ))}
              </div>
              <p className="text-muted-foreground text-sm mt-2">Based on {reviews.length} reviews</p>
            </div>
            <div className="space-y-2">
              {ratingDistribution.map(({ star, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">{star} <Star className="w-4 h-4 text-yellow-500 fill-current" /></span>
                  <Progress value={percentage} className="h-2 w-full" />
                  <span className="text-sm text-muted-foreground w-8 text-right">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.avatar} alt={review.author} />
                  <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{review.author}</p>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? 'fill-current' : 'fill-muted stroke-muted-foreground')} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.date}</p>
                  <p className="mt-2 text-foreground">{review.text}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">Load More Reviews</Button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">
          You Might Also Like
        </h2>
        <Recommendations />
      </div>

    </div>
  );
}
