'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ProductWithImage, ProductVariant, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, Heart, Minus, Plus, ArrowLeft, Loader2, Search, Check } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Recommendations from '@/components/products/Recommendations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useProduct } from '@/hooks/use-product';
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

const ColourCard = ({
  name,
  image,
  isSelected,
  onClick,
}: {
  name: string;
  image?: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-out h-[88px]",
      "hover:border-primary/30 hover:bg-secondary/30",
      isSelected
        ? "border-primary bg-primary/5 shadow-md ring-0 scale-[1.02]"
        : "border-transparent bg-secondary/30 text-muted-foreground"
    )}
  >
    {isSelected && (
      <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm z-10">
        <Check className="w-2.5 h-2.5" strokeWidth={3} />
      </div>
    )}
    <div className="relative w-10 h-10 mb-1.5 rounded-full overflow-hidden border border-border/50">
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground/50">
          {name.charAt(0)}
        </div>
      )}
    </div>
    <span className={cn("text-xs font-bold tracking-tight line-clamp-1 max-w-full text-center px-1", isSelected ? "text-primary" : "text-foreground")}>
      {name}
    </span>
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
  const [selectedColourId, setSelectedColourId] = useState<string>("");
  // We keep 'selectedVariants' for backward compatibility if backend returns 'variants' array separately,
  // but for pricing options, we primarily use selectedPricingId.
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) return;

      setLoading(true);
      let foundProduct: ProductWithImage | undefined;

      const globalProducts = useProduct.getState().products;
      const storeProduct = globalProducts.find(p => String(p.id) === String(id));

      if (storeProduct) {
        const image = PlaceHolderImages.find(img => img.id === storeProduct.imageId)
          || PlaceHolderImages.find(img => img.id === 'product-1');

        foundProduct = {
          ...storeProduct,
          imageUrl: image?.imageUrl || '',
          imageHint: image?.imageHint || 'product image',
        };
      }

      // 1. Try fetching from API if companyDetails exists AND not found in store
      if (!foundProduct && companyDetails?.companyId) {
        try {
          // Optimization: Check if we have products in global store first? 
          // For now, fetch transparently or use cache. 
          // Ideally fetchCategories is cached or we rely on client-side store if hydrated.
          const fetchedCategories = await fetchCategories(companyDetails.companyId, companyDetails.deliveryBetween);
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

        // Initialize colour
        if (foundProduct && foundProduct.colors && foundProduct.colors.length > 0) {
          setSelectedColourId(foundProduct.colors[0].id);
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

    // Resolve selected colour object
    const selectedColour = product.colors?.find(c => c.id === selectedColourId);
    const colourToAdd = selectedColour ? {
      id: selectedColour.id,
      name: selectedColour.name,
      image: selectedColour.image || ''
    } : undefined;

    addToCart(
      { ...product, price: basePrice },
      variantInfo,
      addonObjects,
      colourToAdd
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
            src={product?.colors?.find(c => c.id === selectedColourId)?.image || product?.imageUrl || ''}
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
            <div className="space-y-1">
              <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">{companyDetails?.companyName || 'Digi Turu'}</span>
              <h1 className="font-headline text-3xl md:text-5xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-3xl font-bold text-foreground">Rs. {finalPrice.toFixed(2)}</h2>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                className={cn("rounded-full h-10 w-10 transition-colors", isWishlisted && "text-red-500 bg-red-50 border-red-200")}
                onClick={() => toggleWishlist(product)}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Taxes included. {companyDetails?.freeDeliveryCost && `Free shipping on orders over ${companyDetails.freeDeliveryCost}/-`}
            </p>

            {/* Rating simplified */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30 fill-muted-foreground/30')} />
                ))}
              </div>
              <span className="text-muted-foreground text-sm font-medium ml-1">({reviews.length} reviews)</span>
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
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
              <p className="text-sm text-muted-foreground">{product.instructions}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Pricing Options (Select Quantity) */}
            {product.pricing && product.pricing.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-foreground">Select</label>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded">REQUIRED</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const prices = product.pricing.map(p => p.price);
                    const allPricesSame = prices.every(p => p === prices[0]);

                    return product.pricing.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedPricingId(option.id);
                          setSelectedAddons([]);
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all duration-200 h-24",
                          selectedPricingId === option.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        {selectedPricingId === option.id && (
                          <div className="absolute top-2 right-2 text-primary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <span className={cn("text-lg font-bold mb-1", selectedPricingId === option.id ? "text-primary" : "text-foreground")}>
                          {option.quantity}
                        </span>
                        {!allPricesSame && (
                          <span className="text-sm text-muted-foreground">₹{option.price}</span>
                        )}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Colour Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-foreground">Select Colour</label>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded">OPTIONAL</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.colors.map((colour) => (
                    <ColourCard
                      key={colour.id}
                      name={colour.name}
                      image={colour.image}
                      isSelected={selectedColourId === colour.id}
                      onClick={() => setSelectedColourId(colour.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Addons (Enhance It) */}
            {availableAddons.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-foreground">Enhance It</label>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded">OPTIONAL</span>
                </div>
                <div className="space-y-3">
                  {availableAddons.map(addon => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => {
                          // Toggle logic
                          if (isSelected) {
                            setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                          } else {
                            setSelectedAddons(prev => [...prev, addon.id]);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Custom Checkbox */}
                          <div className={cn(
                            "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                          )}>
                            {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-base font-semibold text-foreground">{addon.name}</span>
                        </div>
                        <span className={cn("text-base font-bold", isSelected ? "text-primary" : "text-primary")}>+₹{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/60" />

          {/* Bottom Bar Actions - Raised to accommodate BottomNavigation on mobile */}
          <div className="fixed bottom-[60px] left-0 right-0 p-4 bg-background border-t border-border z-20 md:static md:p-0 md:bg-transparent md:border-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="container mx-auto md:px-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total</p>
                  <h2 className="text-3xl font-bold font-headline text-primary">₹{(finalPrice * quantity).toFixed(2)}</h2>
                </div>
                <Button onClick={handleAddToCart} size="lg" className="flex-1 max-w-sm h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-primary/25 transition-all">
                  Add to Cart
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                    <span className="sr-only">items</span>
                    <svg className="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </span>
                </Button>
              </div>
            </div>
          </div>
          {/* Spacer for fixed bottom bar on mobile (NavHeight + ActionHeight) */}
          <div className="h-40 md:hidden"></div>
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
