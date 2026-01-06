'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ProductWithImage, ProductVariant, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, Heart, Minus, Plus, ArrowLeft, Loader2, Search } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Recommendations from '@/components/products/Recommendations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
// Import mock categories as fallback ONLY
import { categories as mockCategories } from '@/data/products';
import { fetchCategories } from '@/services/product.service';

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
  const { addToCart, setCartOpen, companyDetails } = useCart();
  const { toast } = useToast();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductWithImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  // We keep 'selectedVariants' for backward compatibility if backend returns 'variants' array separately,
  // but for pricing options, we primarily use selectedPricingId.
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) return;

      setLoading(true);
      let foundProduct: ProductWithImage | undefined;

      // 1. Try fetching from API if companyDetails exists
      if (companyDetails?.companyId) {
        try {
          // Optimization: Check if we have products in global store first? 
          // For now, fetch transparently or use cache. 
          // Ideally fetchCategories is cached or we rely on client-side store if hydrated.
          const fetchedCategories = await fetchCategories(companyDetails.companyId);
          const allApiProducts = fetchedCategories.flatMap(c => c.catalogs.flatMap(ca => ca.products));
          const apiProduct = allApiProducts.find(p => String(p.id) === String(id));

          if (apiProduct) {
            const image = PlaceHolderImages.find(img => img.id === apiProduct.imageId)
              || PlaceHolderImages.find(img => img.id === 'product-1');

            foundProduct = {
              ...apiProduct,
              id: String(apiProduct.id),
              imageUrl: image?.imageUrl || '',
              imageHint: image?.imageHint || 'product image',
            };
          }
        } catch (error) {
          console.error("Failed to fetch product from API", error);
        }
      }

      // 2. Fallback to Mock Data
      if (!foundProduct) {
        const allMockProducts = mockCategories.flatMap(c => c.catalogs.flatMap(ca => ca.products));
        const mockData = allMockProducts.find(p => String(p.id) === String(id));

        if (mockData) {
          const image = PlaceHolderImages.find(img => img.id === mockData.imageId);
          foundProduct = {
            ...mockData,
            imageUrl: image?.imageUrl || '',
            imageHint: image?.imageHint || 'product image',
          };
        }
      }

      if (isMounted) {
        setProduct(foundProduct || null);

        // Initialize pricing selection
        if (foundProduct && foundProduct.pricing && foundProduct.pricing.length > 0) {
          // Default to first option
          setSelectedPricingId(foundProduct.pricing[0].id);
        }

        // Initialize legacy variants
        if (foundProduct?.variants) {
          const initialState: Record<string, string> = {};
          foundProduct.variants.forEach((variant) => {
            initialState[variant.name] = variant.options[0];
          });
          setSelectedVariants(initialState);
        }

        setLoading(false);
      }
    }

    loadProduct();

    return () => { isMounted = false; };
  }, [id, companyDetails]);


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto mb-24">
          <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
            <div className="relative">
              <Search size={40} className="text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <div className="w-4 h-4 rounded-full bg-destructive/80" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Product Not Found
            </h1>
            <p className="text-muted-foreground text-lg">
              We couldn't locate the product you're looking for. It might have been moved or doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            <Button onClick={() => router.push('/')} size="lg" className="rounded-full px-8 gap-2">
              <ArrowLeft size={16} /> Back to Home
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-full px-8">
              Go Back
            </Button>
          </div>
        </div>

        <Separator className="mb-12" />

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Explore Popular Items</h2>
            <p className="text-muted-foreground">You might find something else you love</p>
          </div>
          <Recommendations />
        </div>
      </div>
    );
  }

  // Derived state for current pricing option
  const currentPricingOption = product.pricing?.find(p => p.id === selectedPricingId) || (product.pricing?.[0]);
  // Effective price: base price (from pricing option) + active addons
  // Note: Addons price usually adds ON TOP of the variant price.

  // Get addons available for current pricing option
  const availableAddons = currentPricingOption?.addons || [];

  // Calculate total price
  const basePrice = currentPricingOption ? currentPricingOption.price : product.price;
  const addonsPrice = availableAddons
    .filter(a => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const finalPrice = basePrice + addonsPrice;

  const handleAddToCart = () => {
    // Construct the product to add to cart
    // We override the price with the basePrice of the selected variant
    // Addons are passed separately to be handled by useCart logic (which sums them up for total display)

    // Logic: 
    // 1. `product.price` in cart item should reflect the base variant price.
    // 2. `selectedVariants` should include the "Quantity" if using pricing options.

    const variantInfo = { ...selectedVariants };
    if (currentPricingOption) {
      variantInfo['Quantity'] = currentPricingOption.quantity;
    }

    const addonObjects = availableAddons.filter(a => selectedAddons.includes(a.id));

    addToCart(
      { ...product, price: basePrice },
      variantInfo,
      addonObjects
    );
    setCartOpen(true);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-secondary/10 border border-border/50 shadow-sm md:aspect-auto md:h-[550px]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
            data-ai-hint={product.imageHint}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30 fill-muted-foreground/30')} />
                ))}
              </div>
              <span className="text-muted-foreground text-sm font-medium ml-1">{product.rating.toFixed(1)} <span className="text-muted-foreground/50 mx-1">•</span> {reviews.length} reviews</span>
            </div>

            <p className="mt-4 text-muted-foreground leading-relaxed text-base">{product.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
            {product.ingredients && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingredients</span>
                <p className="text-sm font-medium">{product.ingredients}</p>
              </div>
            )}
            {product.bestBefore && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Shelf Life</span>
                <p className="text-sm font-medium">{product.bestBefore}</p>
              </div>
            )}
          </div>

          {product.instructions && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 block">Storage Instructions</span>
              <p className="text-sm text-amber-900">{product.instructions}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Pricing Options (Quantity) */}
            {product.pricing && product.pricing.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Select Quantity</label>
                <div className="flex flex-wrap gap-3">
                  {product.pricing.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedPricingId(option.id);
                        // Reset addons when changing variant if needed, or keep? Usually Keep is weird if addons differ. 
                        // For simplicity, we keep selected addons but filter valid ones in render logic.
                        setSelectedAddons([]);
                      }}
                      className={cn(
                        "relative px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 min-w-[100px]",
                        selectedPricingId === option.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <span className="block text-base">{option.quantity}</span>
                      <span className="block text-xs opacity-80">₹{option.price}</span>
                      {selectedPricingId === option.id && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons for selected pricing */}
            {availableAddons.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium text-foreground">Add-ons</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableAddons.map(addon => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => {
                          if (addon.mandatory) return; // Prevent toggling if mandatory? Or logic handled elsewhere? assuming optional for now.
                          setSelectedAddons(prev =>
                            prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                          );
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-border hover:border-emerald-200"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isSelected ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground")}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm font-medium">{addon.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700">+₹{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/60" />

          {/* Price & Actions */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold font-headline text-primary">₹{finalPrice.toFixed(0)}</h2>
                  {product.deliveryCost === 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Free Delivery
                    </span>
                  )}
                </div>
              </div>
              {product.deliveryCost > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <p className="font-semibold text-sm">+ ₹{product.deliveryCost}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex items-center justify-between border-2 border-border/60 rounded-full px-4 py-2 min-w-[140px]">
                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="rounded-full h-8 w-8 hover:bg-secondary">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg w-8 text-center tabular-nums">{quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="rounded-full h-8 w-8 hover:bg-secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleAddToCart} size="lg" className="flex-1 h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5">
                Add to Cart • ₹{(finalPrice * quantity).toFixed(0)}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={cn("h-14 w-14 rounded-full border-2", isWishlisted ? 'border-primary/20 bg-primary/5' : '')}
                onClick={() => toggleWishlist(product.id, product.name)}
              >
                <Heart className={cn("h-6 w-6 transition-all", isWishlisted ? 'fill-primary text-primary scale-110' : 'text-muted-foreground')} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="font-headline text-3xl md:text-3xl font-bold mb-8 text-foreground/80">
          Customer Reviews
        </h2>
        {/* ... reviews section stays same or simplified ... */}
        <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
          {/* ... existing review UI ... */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col items-center justify-center bg-secondary/30 rounded-2xl p-6 border border-border/50">
              <p className="text-5xl font-bold text-foreground">{product.rating.toFixed(1)}</p>
              <div className="flex items-center gap-1 text-primary mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-6 w-6", i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'fill-muted-foreground/20 text-muted-foreground/20')} />
                ))}
              </div>
              <p className="text-muted-foreground text-sm mt-2">Based on {reviews.length} reviews</p>
            </div>
          </div>
          {/* ... keeping existing review list simplified for brevity in this replace ... */}
          <div className="md:col-span-3">
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="flex gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/40">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={review.avatar} alt={review.author} />
                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{review.author}</p>
                      <div className="flex items-center gap-0.5 text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? 'fill-primary text-primary' : 'fill-muted-foreground/20 text-muted-foreground/20')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{review.date}</p>
                    <p className="mt-3 text-foreground/90 text-sm leading-relaxed">{review.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-24 mb-12">
        <h2 className="font-headline text-3xl md:text-3xl font-bold mb-8 text-foreground/80">
          You Might Also Like
        </h2>
        <Recommendations />
      </div>

    </div>
  );
}
