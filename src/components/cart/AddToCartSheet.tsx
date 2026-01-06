"use client";

import * as React from "react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductWithImage, ProductVariant, ProductAddonOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

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
  subLabel?: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center justify-center py-2 px-3 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out",
      "hover:border-primary/50 hover:bg-primary/5",
      isSelected
        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
        : "border-border bg-card/50"
    )}
  >
    {isSelected && (
      <div className="absolute top-1.5 right-1.5 text-primary">
        <Check className="w-3 h-3" />
      </div>
    )}
    <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
      {label}
    </span>
    {subLabel && (
      <span className="text-[10px] text-muted-foreground mt-0.5">{subLabel}</span>
    )}
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
      "group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer",
      "hover:border-primary/40 hover:bg-accent/50",
      isSelected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border bg-transparent"
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
          isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary/60"
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-xs font-semibold leading-none", isSelected ? "text-foreground" : "text-foreground/90")}>
          {addon.name}
        </span>
        {addon.mandatory && <span className="text-[9px] text-destructive uppercase tracking-wide font-bold mt-1">Required</span>}
      </div>
    </div>
    <span className="text-xs font-medium text-primary">
      +₹{addon.price}
    </span>
  </div>
);


const AddToCartContent = ({
  product,
  close,
}: {
  product: ProductWithImage;
  close: () => void;
}) => {
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();

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
    addToCart({ ...product, price: basePrice }, variantsToAdd, selectedAddonsList);
    close();
    setCartOpen(true);
  };

  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0);

  // -- Render Content --

  return (
    <div className="flex flex-col h-full bg-background relative group/sheet">
      {/* Header with Image Background Effect */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover/sheet:scale-105"
        />
        {/* Gradient only at the bottom to make text readable, ensuring image is clear */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="absolute bottom-3 left-5 right-5">
          <h2 className="text-lg font-bold tracking-tight text-foreground shadow-sm">{product.name}</h2>
          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-20 pt-2">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Quantity Selector */}
          {product.pricing && product.pricing.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select Quantity</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Required</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {product.pricing.map((option) => (
                  <OptionCard
                    key={option.id}
                    label={option.quantity}
                    subLabel={`₹${option.price}`}
                    isSelected={selectedPricingId === option.id}
                    onClick={() => setSelectedPricingId(option.id)}
                  />
                ))}
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
      </ScrollArea>

      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-lg border-t z-10 transition-all">
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-col min-w-[30%]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Total</span>
            <span className="text-lg font-bold text-primary leading-tight">₹{currentPrice.toFixed(2)}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            size="default"
            className="flex-1 rounded-lg shadow-md shadow-primary/20 text-sm font-semibold h-10"
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

const AddToCartContentDesktop = ({
  product,
  close,
}: {
  product: ProductWithImage;
  close: () => void;
}) => {
  // Reuse logic (could allow minimal variation)
  return <AddToCartContent product={product} close={close} />;
};


// --- Main Component ---

export function AddToCartSheet({ product, children }: AddToCartSheetProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();
  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0);

  const handleSimpleAddToCart = (e: React.MouseEvent) => {
    if (hasVariants) return;
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, {});
    setCartOpen(true);
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
          <SheetContent side="bottom" className="rounded-t-[20px] p-0 h-[75vh] max-h-[600px] overflow-hidden border-none shadow-2xl">
            <div className="h-full w-full">
              <AddToCartContent product={product} close={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 overflow-hidden border-none shadow-xl rounded-xl" sideOffset={8}>
        <AddToCartContentDesktop product={product} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
