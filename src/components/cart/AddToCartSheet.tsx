
"use client";

import * as React from "react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductWithImage, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface AddToCartSheetProps {
  product: ProductWithImage;
  children: React.ReactNode;
}

const VariantSelector = ({
  variant,
  selectedOption,
  onOptionChange,
}: {
  variant: ProductVariant;
  selectedOption: string;
  onOptionChange: (option: string) => void;
}) => (
  <div className="space-y-3">
    <h4 className="font-medium text-foreground">{variant.name}</h4>
    <div className="flex flex-wrap gap-2">
      {variant.options.map((option) => (
        <Button
          key={option}
          variant={selectedOption === option ? "default" : "outline"}
          onClick={() => onOptionChange(option)}
          className={cn(
            "rounded-full",
            selectedOption === option
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground"
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);

const AddToCartContent = ({
  product,
  close,
}: {
  product: ProductWithImage;
  close: () => void;
}) => {
  const { addToCart } = useCart();
  const [selectedVariants, setSelectedVariants] = React.useState<
    Record<string, string>
  >(() => {
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
    addToCart(product, selectedVariants);
    close();
  };

  const hasVariants = product.variants && product.variants.length > 0;

  const variantSelectionContent = (
    <div className="space-y-6">
       {hasVariants ? (
        <div className="space-y-6">
          {product.variants!.map((variant) => (
            <VariantSelector
              key={variant.name}
              variant={variant}
              selectedOption={selectedVariants[variant.name]}
              onOptionChange={(option) =>
                handleVariantChange(variant.name, option)
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          This product has no additional options.
        </p>
      )}
    </div>
  );

    return (
      <div className="flex flex-col h-full">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-2xl font-bold">{product.name}</SheetTitle>
        </SheetHeader>
        <div className="border-b -mx-6 my-4"/>
        <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">
          <div className="text-left">
            <p className="text-2xl font-bold">₹{product.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              Taxes included. Free shipping on orders over ₹500/-
            </p>
          </div>
          {variantSelectionContent}
        </div>
        <SheetFooter className="px-6 pb-6 pt-4 mt-auto">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Add to Cart
          </Button>
        </SheetFooter>
      </div>
    );
};

const AddToCartContentDesktop = ({
  product,
  close,
}: {
  product: ProductWithImage;
  close: () => void;
}) => {
  const { addToCart } = useCart();
  const [selectedVariants, setSelectedVariants] = React.useState<
    Record<string, string>
  >(() => {
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
    addToCart(product, selectedVariants);
    close();
  };

  const hasVariants = product.variants && product.variants.length > 0;

  const variantSelectionContent = (
    <div className="space-y-6">
       {hasVariants ? (
        <div className="space-y-6">
          {product.variants!.map((variant) => (
            <VariantSelector
              key={variant.name}
              variant={variant}
              selectedOption={selectedVariants[variant.name]}
              onOptionChange={(option) =>
                handleVariantChange(variant.name, option)
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          This product has no additional options.
        </p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="relative aspect-square w-full rounded-md overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
        </div>

        <div className="flex flex-col">
          <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        </div>

        <div className="col-span-2 border-t pt-4">
          {variantSelectionContent}
        </div>

        <div className="col-span-2 flex items-center justify-between">
           <div className="text-left">
             <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
           </div>
           <Button onClick={handleAddToCart} className="bg-primary text-primary-foreground hover:bg-primary/90">
             Add to Cart
           </Button>
        </div>
      </div>
  );
};


export function AddToCartSheet({ product, children }: AddToCartSheetProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { addToCart } = useCart();
  const hasVariants = product.variants && product.variants.length > 0;

  const handleSimpleAddToCart = (e: React.MouseEvent) => {
    if (hasVariants) return;
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, {});
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  if (!hasVariants) {
    return <div onClick={handleSimpleAddToCart}>{children}</div>;
  }
  
  const trigger = React.cloneElement(children as React.ReactElement, { onClick: handleTriggerClick });


  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-lg p-0">
            <AddToCartContent product={product} close={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-96 p-4">
        <AddToCartContentDesktop product={product} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
