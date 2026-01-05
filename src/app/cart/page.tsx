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
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useWishlist } from '@/context/WishlistContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-6 text-center mt-16 bg-secondary/50 p-8 md:p-12 rounded-xl">
          <div className="bg-primary/10 p-4 rounded-full">
            <ShoppingCart
              className="h-16 w-16 text-primary"
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl md:text-3xl font-bold">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Looks like you haven't added anything to your cart yet. Explore our
              products and find something you love!
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shipping = 50;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
          Shopping Cart
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Review your items and proceed to checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-sm">
          <ul role="list" className="divide-y divide-border">
            {cart.map((item) => (
              <li key={item.id} className="flex py-6">
                <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover object-center"
                    data-ai-hint={item.imageHint}
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-foreground">
                      <h3>
                        <Link href={`/product/${item.id}`}>{item.name}</Link>
                      </h3>
                      <p className="ml-4">₹{item.price.toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Object.values(item.selectedVariants || {}).join(', ')}
                    </p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm mt-4">
                    <div className="flex items-center gap-2 border rounded-full px-2 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="rounded-full h-6 w-6"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold w-5 text-center text-base">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-full h-6 w-6"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground h-8 w-8"
                        onClick={() => toggleWishlist(item.id, item.name)}
                      >
                        <Heart
                          className={`h-5 w-5 ${wishlist.includes(item.id)
                            ? 'fill-primary text-primary'
                            : ''
                            }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground h-8 w-8"
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

        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xl font-bold font-headline text-foreground">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium">₹{shipping.toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-sm space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Apply Coupon
            </h3>
            <div className="flex gap-2">
              <Input placeholder="Enter coupon code" className="flex-1" />
              <Button variant="outline">Apply</Button>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full text-lg h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
