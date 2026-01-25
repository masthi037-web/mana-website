"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import confetti from "canvas-confetti";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductWithImage, ProductVariant, ProductAddonOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useSheetBackHandler } from "@/hooks/use-sheet-back-handler";

interface AddToCartSheetProps {
  product: ProductWithImage;
  children: React.ReactNode;
}

// --- styled components for the modern look ---

const OptionCard = ({
  label,
  subLabel,
  isSelected,
  onClick,
}: {
  label: string;
  subLabel?: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-out",
      "hover:border-primary/30 hover:bg-secondary/30",
      isSelected
        ? "border-primary bg-primary/5 shadow-md ring-0 scale-[1.02]"
        : "border-transparent bg-secondary/30 text-muted-foreground"
    )}
  >
    {isSelected && (
      <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
        <Check className="w-2.5 h-2.5" strokeWidth={3} />
      </div>
    )}
    <span className={cn("text-sm font-bold tracking-tight", isSelected ? "text-primary" : "text-foreground")}>
      {label}
    </span>
    {subLabel && (
      <div className={cn("mt-0.5", isSelected ? "text-primary/80" : "text-muted-foreground")}>
        {subLabel}
      </div>
    )}
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

const AddonRow = ({
  addon,
  isSelected,
  onToggle,
}: {
  addon: ProductAddonOption;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    className={cn(
      "group flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent",
      "hover:bg-secondary/40",
      isSelected
        ? "bg-primary/5 border-primary/10 shadow-sm"
        : "bg-transparent"
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300",
          isSelected ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 group-hover:border-primary/50"
        )}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium leading-none transition-colors", isSelected ? "text-foreground font-semibold" : "text-foreground/80")}>
          {addon.name}
        </span>
        {addon.mandatory && <span className="text-[9px] text-destructive uppercase tracking-wider font-bold mt-1.5">Required</span>}
      </div>
    </div>
    <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-primary" : "text-muted-foreground")}>
      +₹{addon.price}
    </span>
  </div>
);


const AddToCartContent = ({
  product,
  close,
  onAddToCart,
}: {
  product: ProductWithImage;
  close: () => void;
  onAddToCart?: () => void;
}) => {
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();

  console.log('AddToCartContent Product:', product);
  console.log('Colors:', product.colors);

  // -- State Logic --
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((variant) => {
        initialState[variant.name] = variant.options[0];
      });
    }
    return initialState;
  });

  const [selectedPricingId, setSelectedPricingId] = React.useState<string>(
    product.pricing && product.pricing.length > 0 ? product.pricing[0].id : ""
  );

  const [selectedAddonIds, setSelectedAddonIds] = React.useState<Set<string>>(new Set());

  const [selectedColourId, setSelectedColourId] = React.useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0].id : ""
  );

  const selectedPricingOption = product.pricing?.find(p => p.id === selectedPricingId);
  const availableAddons = selectedPricingOption?.addons || [];

  React.useEffect(() => {
    setSelectedAddonIds(new Set());
  }, [selectedPricingId]);

  const basePrice = selectedPricingOption ? selectedPricingOption.price : product.price;
  const addonsPrice = availableAddons
    .filter(addon => selectedAddonIds.has(addon.id))
    .reduce((acc, addon) => acc + addon.price, 0);

  const currentPrice = basePrice + addonsPrice;

  // -- Handlers --
  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: option }));
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddonIds(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const handleAddToCart = () => {
    const variantsToAdd = { ...selectedVariants };
    if (selectedPricingOption) {
      variantsToAdd['Quantity'] = selectedPricingOption.quantity;
    }
    const selectedAddonsList = availableAddons.filter(a => selectedAddonIds.has(a.id));

    // Calculate effective price (use explicit priceAfterDiscount if available, else fallback if base price matches)
    const effectiveBasePrice = selectedPricingOption
      ? ((selectedPricingOption.priceAfterDiscount && selectedPricingOption.priceAfterDiscount > 0)
        ? selectedPricingOption.priceAfterDiscount
        : (selectedPricingOption.price === product.price && product.priceAfterDiscount ? product.priceAfterDiscount : selectedPricingOption.price))
      : ((product.priceAfterDiscount && product.priceAfterDiscount > 0) ? product.priceAfterDiscount : product.price);




    // Resolve selected colour object
    const selectedColour = product.colors?.find(c => c.id === selectedColourId);
    const colourToAdd = selectedColour ? {
      id: selectedColour.id,
      name: selectedColour.name,
      image: selectedColour.image || ''
    } : undefined;

    addToCart(
      { ...product, price: effectiveBasePrice, productSizeId: selectedPricingId },
      variantsToAdd,
      selectedAddonsList,
      colourToAdd
    );

    // Trigger success confetti
    const triggerConfetti = () => {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#32C8B4', '#20B2AA', '#FFD700', '#FF6B6B'],
        zIndex: 9999
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    };

    triggerConfetti();

    close();

    // Small delay to ensure the AddToCartSheet closes completely before opening the CartSheet
    setTimeout(() => {
      setCartOpen(true);
      if (onAddToCart) onAddToCart();
    }, 300);
  };

  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0) || (product.colors && product.colors.length > 0);

  // -- Render Content --

  return (
    <div className="flex flex-col h-full bg-background relative group/sheet">
      {/* Header - Compact Text Only */}
      <div className="flex flex-col p-5 pb-2 shrink-0 relative border-b border-border/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{product.name}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-secondary text-muted-foreground"
            onClick={close}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 min-h-0 overflow-y-auto overscroll-contain pb-32 pt-2">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Quantity Selector */}
          {product.pricing && product.pricing.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select Size/Quantity</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Required</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(() => {
                  const prices = product.pricing.map(p => p.price);
                  // Check if all prices are the same (using a simple strict equality check against the first item)
                  const allPricesSame = prices.every(p => p === prices[0]);

                  return product.pricing.map((option) => {
                    // Logic: Use variant discount if present. If not, and variant price == product price, use product discount.
                    const finalOptionPrice = (option.priceAfterDiscount && option.priceAfterDiscount > 0)
                      ? option.priceAfterDiscount
                      : (option.price === product.price && product.priceAfterDiscount ? product.priceAfterDiscount : option.price);

                    const hasOffer = finalOptionPrice < option.price;



                    return (
                      <OptionCard
                        key={option.id}
                        label={option.quantity}
                        subLabel={
                          !allPricesSame ? (
                            <div className="flex flex-col items-center leading-none">
                              {hasOffer && (
                                <span className="text-[9px] line-through opacity-70 mb-0.5">₹{option.price}</span>
                              )}
                              <span className="text-[11px] font-bold">₹{finalOptionPrice.toFixed(0)}</span>
                            </div>
                          ) : undefined
                        }
                        isSelected={selectedPricingId === option.id}
                        onClick={() => setSelectedPricingId(option.id)}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Addons Selector */}
          {availableAddons.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Enhance It</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Optional</span>
              </div>
              <div className="space-y-2">
                {availableAddons.map(addon => (
                  <AddonRow
                    key={addon.id}
                    addon={addon}
                    isSelected={selectedAddonIds.has(addon.id)}
                    onToggle={() => handleAddonToggle(addon.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Colour Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select Colour</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Optional</span>
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

          {/* Legacy Variants */}
          {product.variants && product.variants.map((variant) => (
            <div key={variant.name} className="space-y-2.5">
              <h3 className="text-sm font-semibold">Select {variant.name}</h3>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => (
                  <Button
                    key={option}
                    variant={selectedVariants[variant.name] === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVariantChange(variant.name, option)}
                    className={cn(
                      "rounded-full px-3 h-7 text-xs",
                      selectedVariants[variant.name] === option ? "shadow-sm" : "bg-transparent"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {!hasVariants && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No customization options available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-lg border-t z-10 transition-all">
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-col min-w-[30%]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Total</span>
            {(() => {
              const effectiveBase = selectedPricingOption
                ? ((selectedPricingOption.priceAfterDiscount && selectedPricingOption.priceAfterDiscount > 0)
                  ? selectedPricingOption.priceAfterDiscount
                  : (selectedPricingOption.price === product.price && product.priceAfterDiscount ? product.priceAfterDiscount : selectedPricingOption.price))
                : ((product.priceAfterDiscount && product.priceAfterDiscount > 0) ? product.priceAfterDiscount : product.price);

              const finalPrice = effectiveBase + addonsPrice;
              const hasOffer = finalPrice < currentPrice;


              return (
                <div className="flex flex-col items-start leading-none">
                  {hasOffer && (
                    <span className="text-xs text-muted-foreground line-through font-medium">₹{currentPrice.toFixed(2)}</span>
                  )}
                  <span className="text-lg font-bold text-primary leading-tight">₹{finalPrice.toFixed(2)}</span>
                </div>
              );
            })()}
          </div>
          <Button
            onClick={handleAddToCart}
            size="default"
            className="flex-1 rounded-lg shadow-md shadow-primary/20 text-sm font-semibold h-10 transition-all duration-300"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

    </div>
  );
};

// --- Desktop Version (Popover) ---




// --- Main Component ---

interface AddToCartSheetProps {
  product: ProductWithImage;
  children: React.ReactNode;
  onAddToCart?: () => void;
}

export function AddToCartSheet({ product, children, onAddToCart }: AddToCartSheetProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();
  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0) || (product.colors && product.colors.length > 0);

  // Handle back button on mobile
  useSheetBackHandler(open, setOpen);

  const handleSimpleAddToCart = (e: React.MouseEvent) => {
    if (hasVariants) return;
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, {});

    // Trigger success confetti
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#32C8B4', '#20B2AA', '#FFD700', '#FF6B6B'],
      zIndex: 9999
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });


    // Small delay for smooth transition and ensuring state updates don't conflict
    setTimeout(() => {
      setCartOpen(true);
      // Trigger optional callback
      if (onAddToCart) onAddToCart();
    }, 100);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  if (!hasVariants) {
    return <div onClick={handleSimpleAddToCart}>{children}</div>;
  }

  const trigger = React.cloneElement(children as React.ReactElement<any>, { onClick: handleTriggerClick });

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay
              className="fixed inset-0 z-[99] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <SheetPrimitive.Content
              className={cn(
                "fixed z-[100] gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
                "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                "rounded-t-[20px] p-0 h-auto max-h-[85vh] flex flex-col overflow-hidden border-none shadow-2xl [&>button]:hidden"
              )}
            >
              <div className="h-full w-full">
                <AddToCartContent product={product} close={() => setOpen(false)} onAddToCart={onAddToCart} />
              </div>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </Sheet>
      </>
    );
  }

  // Desktop Popover - Beside the card
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="center"
        sideOffset={16}
        className="w-[340px] p-0 overflow-hidden border-none shadow-2xl shadow-black/20 rounded-2xl h-[450px] flex flex-col bg-background"
      >
        {/* Passing close prop correctly as it is used in AddToCartContent */}
        {/* AddToCartContent needs to be wrapped in a way that it fills height but respects max-height */}
        <AddToCartContent product={product} close={() => setOpen(false)} onAddToCart={onAddToCart} />
      </PopoverContent>
    </Popover>
  );
}
