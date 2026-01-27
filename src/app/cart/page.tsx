'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Heart,
  Tag,
  ArrowRight,
  X,
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

import { useTenant } from '@/components/providers/TenantContext';
import { CheckoutSheet } from '@/components/checkout/CheckoutSheet';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, companyDetails } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const { text } = useTenant();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center space-y-6 max-w-md animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShoppingCart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Your cart is empty</h2>
          <p className="text-muted-foreground text-lg">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all">
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shipping = 50;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Page Header */}
        <div className="relative text-center mb-12 space-y-2">
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
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Shopping Cart
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your items and proceed to checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <ul className="divide-y divide-border">
                {cart.map((item) => (
                  <li key={item.cartItemId} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-card rounded-2xl border hover:shadow-md transition-shadow duration-200">
                    {/* Product Image */}
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl border bg-gray-50">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint={item.imageHint}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col w-full min-h-[7rem] justify-between">

                      {/* Top Row: Title + Variants | Price */}
                      <div className="flex justify-between items-start w-full">
                        <div className="space-y-2">
                          <Link href={`/product/${item.id}`} className="font-bold text-xl text-foreground hover:text-primary transition-colors line-clamp-1 block mr-4">
                            {item.name}
                          </Link>

                          <div className="flex flex-wrap gap-2 items-center">
                            {/* Variant Pills (Gray) */}
                            {Object.entries(item.selectedVariants || {}).map(([key, value]) => (
                              <span key={key} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium">
                                {value}
                              </span>
                            ))}
                            {/* Size Colour Pills (Teal/Green) */}
                            {item.selectedSizeColours && item.selectedSizeColours.map((sc) => (
                              <span key={sc.id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium border border-emerald-100">
                                + {sc.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="font-extrabold text-xl tabular-nums whitespace-nowrap">
                          ₹{((item.price + (item.selectedSizeColours?.reduce((acc, sc) => acc + sc.price, 0) || 0)) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Bottom Row: Quantity | Actions */}
                      <div className="flex items-end justify-between mt-4">
                        {/* Quantity Selector - Styled Pill */}
                        <div className="flex items-center bg-gray-50 rounded-xl border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-l-xl hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
                            onClick={() => updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-r-xl hover:bg-white hover:text-primary hover:shadow-sm transition-all"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("rounded-full h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors", wishlist.some(i => i.id === item.id) && "text-red-500 bg-red-50")}
                            onClick={() => toggleWishlist(item)}
                          >
                            <Heart className={cn("h-5 w-5", wishlist.some(i => i.id === item.id) && "fill-current")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-10 w-10 text-gray-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              removeFromCart(item.cartItemId);
                              toast({ description: `${item.name} removed from cart.` });
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-sm border border-border/50 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {/* Free Delivery Logic */}
              {(() => {
                const minOrder = Number(companyDetails?.minimumOrderCost || 0);
                const freeDeliveryThreshold = Number(companyDetails?.freeDeliveryCost || 0);
                const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
                const shipping = 0; // Calculated later or Free
                const total = subtotal + shipping;
                const canCheckout = subtotal >= minOrder;
                const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

                return (
                  <>
                    {/* Free Delivery Nudge */}
                    {amountForFreeDelivery > 0 && freeDeliveryThreshold > 0 && (
                      <div className="mb-6 bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm">
                        <p className="text-xs text-emerald-800 font-bold mb-2 flex items-center gap-2">
                          <span className="bg-emerald-500 text-white rounded-full p-0.5"><Plus className="w-3 h-3" /></span>
                          Add <span className="font-extrabold text-base">₹{amountForFreeDelivery.toFixed(0)}</span> more for free delivery
                        </p>
                        <div className="h-1.5 w-full bg-emerald-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span className={cn(isFreeDelivery ? "text-green-600 font-medium" : "")}>
                          {isFreeDelivery ? "FREE" : "Calculated at checkout"}
                        </span>
                      </div>

                      <Separator className="my-2" />

                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Tag className="w-4 h-4" />
                        <span>Apply Coupon</span>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Enter code" className="bg-background/50 h-10 border-dashed focus-visible:ring-primary/20" />
                        <Button variant="secondary" className="h-10 px-4 font-semibold">Apply</Button>
                      </div>
                    </div>

                    {!canCheckout && (
                      <p className="mt-4 text-xs text-destructive text-center font-medium bg-destructive/10 py-2 px-3 rounded-lg border border-destructive/20">
                        Minimum order amount is ₹{minOrder.toFixed(0)}
                      </p>
                    )}

                    {/* Checkout Button */}
                    <CheckoutSheet>
                      <Button
                        size="lg"
                        disabled={!canCheckout}
                        className={cn(
                          "w-full mt-4 h-12 text-base font-bold rounded-xl shadow-lg transition-all",
                          canCheckout
                            ? "shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                            : "bg-muted text-muted-foreground shadow-none opacity-70"
                        )}
                      >
                        {canCheckout ? (
                          <>
                            {text.checkoutButton || "Checkout securely"}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        ) : (
                          "Checkout Disabled"
                        )}
                      </Button>
                    </CheckoutSheet>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded">Secure Checkout</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </div >
    </div >
  );
}
