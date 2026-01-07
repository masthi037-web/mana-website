
import { Confetti } from '@/components/ui/confetti';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
    SheetFooter
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    ArrowRight,
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// import { Confetti } from '@/components/ui/confetti'; // Assuming Confetti is ready to be used

export function CartSheet({ children }: { children: React.ReactNode }) {
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, isCartOpen, setCartOpen, companyDetails, lastAddedItemId } = useCart();
    const { toast } = useToast();

    const subtotal = getCartTotal();
    const cartItemCount = getCartItemsCount();

    // Config Logic
    const minOrder = companyDetails?.minimumOrderCost ? parseFloat(companyDetails.minimumOrderCost) : 0;
    const freeDeliveryThreshold = companyDetails?.freeDeliveryCost ? parseFloat(companyDetails.freeDeliveryCost) : 0;

    // Status Logic
    const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
    const shipping = isFreeDelivery ? 0 : 50; // Fallback standard shipping
    const total = subtotal + shipping;
    const canCheckout = subtotal >= minOrder;
    const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-2xl">
                {/* Confetti Explosion on Open if we have items */}
                {isCartOpen && cartItemCount > 0 && <Confetti />}

                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-20">
                    <SheetTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                        <div className="relative group/icon">
                            <ShoppingCart className="w-5 h-5 text-primary group-hover/icon:scale-110 transition-transform duration-300" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
                        </div>
                        My Cart
                        {cartItemCount > 0 && (
                            <span className="ml-auto mr-12 text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-primary">
                                {cartItemCount} items
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative mb-2">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center relative backdrop-blur-sm border border-white/10">
                                <ShoppingCart className="w-10 h-10 text-muted-foreground/60" />
                            </div>
                        </div>
                        <div className="space-y-2 max-w-[250px]">
                            <h3 className="font-bold text-xl tracking-tight">Your cart is empty</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Looks like you haven't added anything yet. Discover our best sellers!
                            </p>
                        </div>
                        <SheetClose asChild>
                            <Button className="rounded-full w-full max-w-[200px] h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all">
                                Start Shopping
                            </Button>
                        </SheetClose>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-6">
                            <ul className="py-6 space-y-6">
                                {cart.map((item, index) => {
                                    const isNew = lastAddedItemId === item.cartItemId;
                                    return (
                                        <li
                                            key={item.cartItemId}
                                            className={cn(
                                                "group relative flex gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500",
                                                isNew && "ring-2 ring-primary/20 rounded-2xl p-2 -m-2 bg-primary/5 shadow-[0_0_30px_rgba(50,200,180,0.15)] transition-all duration-1000"
                                            )}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {isNew && (
                                                <div className="absolute inset-0 rounded-2xl animate-shimmer-highlight pointer-events-none" />
                                            )}

                                            {/* Premium Image Card */}
                                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    data-ai-hint={item.imageHint}
                                                />
                                            </div>

                                            <div className="flex flex-1 flex-col justify-between min-h-[6rem] py-0.5 z-10">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <Link href={`/product/${item.id}`} className="font-bold text-base leading-snug hover:text-primary transition-colors line-clamp-2">
                                                            {item.name}
                                                        </Link>
                                                        <p className="font-bold text-base text-primary whitespace-nowrap">
                                                            ₹{((item.price + (item.selectedAddons?.reduce((acc, a) => acc + a.price, 0) || 0)) * item.quantity).toFixed(0)}
                                                        </p>
                                                    </div>

                                                    {/* Variants & Addons Pills */}
                                                    {(item.selectedVariants || item.selectedAddons) && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Object.values(item.selectedVariants || {}).map((value, i) => (
                                                                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 text-foreground/80 border border-transparent">
                                                                    {value}
                                                                </span>
                                                            ))}
                                                            {item.selectedAddons?.map((addon) => (
                                                                <span key={addon.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                                                    + {addon.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    {/* Modern Quantity Selector */}
                                                    <div className="flex items-center gap-1 bg-secondary/40 rounded-full p-1 border border-border/50">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-full hover:bg-white hover:shadow-sm hover:text-destructive transition-all"
                                                            onClick={() => updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-full hover:bg-white hover:shadow-sm hover:text-primary transition-all"
                                                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                        onClick={() => {
                                                            removeFromCart(item.cartItemId);
                                                            toast({ description: "Item removed" });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20">
                            {/* Free Delivery Nudge */}
                            {amountForFreeDelivery > 0 && freeDeliveryThreshold > 0 && (
                                <div className="mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm">
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

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Shipping</span>
                                    <span className={cn(isFreeDelivery ? "text-green-600 font-medium" : "")}>
                                        {isFreeDelivery ? "FREE" : `₹${shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-primary tracking-tight">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {!canCheckout && (
                                <p className="text-xs text-destructive text-center mb-2 font-medium bg-destructive/10 py-1 px-2 rounded-lg">
                                    Minimum order amount is ₹{minOrder.toFixed(0)}
                                </p>
                            )}

                            <SheetClose asChild disabled={!canCheckout}>
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-full text-base font-bold shadow-lg transition-all duration-300",
                                        canCheckout
                                            ? "shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary/90"
                                            : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
                                    )}
                                    asChild={canCheckout}
                                    disabled={!canCheckout}
                                >
                                    {canCheckout ? (
                                        <Link href="/cart">
                                            Checkout securely <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <span>Checkout Disabled</span>
                                    )}
                                </Button>
                            </SheetClose>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
