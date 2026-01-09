import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Gift,
    X,
    AlertTriangle,
    RefreshCw,
    Tag
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { fetchProductDetails } from '@/services/product.service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { useTenant } from '@/components/providers/TenantContext';

export function CartSheet({ children }: { children: React.ReactNode }) {
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, isCartOpen, setCartOpen, companyDetails, lastAddedItemId } = useCart();
    const { toast } = useToast();
    const { text } = useTenant();
    const router = useRouter();
    const [celebrated, setCelebrated] = useState(false);
    const [showFreeDeliveryPopup, setShowFreeDeliveryPopup] = useState(false);
    const [showCouponPopup, setShowCouponPopup] = useState(false);

    // Track initial render to prevent confetti on reload
    const isFirstRender = useRef(true);

    // Validation State
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showValidationPopup, setShowValidationPopup] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    const subtotal = getCartTotal();
    const cartItemCount = getCartItemsCount();

    // Config Logic
    const minOrder = companyDetails?.minimumOrderCost ? parseFloat(companyDetails.minimumOrderCost) : 0;
    const freeDeliveryThreshold = companyDetails?.freeDeliveryCost ? parseFloat(companyDetails.freeDeliveryCost) : 0;

    // Status Logic
    const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
    const shipping = isFreeDelivery ? 0 : 0; // Calculated at checkout
    const total = subtotal + shipping;
    const canCheckout = subtotal >= minOrder;
    const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

    // Initial Mount Tracker
    useEffect(() => {
        // Small timeout to allow state calculations to settle before un-flagging
        const timer = setTimeout(() => {
            isFirstRender.current = false;
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Auto-Apply Best Coupon
    useEffect(() => {
        if (!companyDetails?.companyCoupon) return;

        const couponList = companyDetails.companyCoupon.split(',').map(cStr => {
            const [code, discountStr, minOrderStr] = cStr.split('&&&');
            return {
                code,
                discount: parseFloat(discountStr || '0'),
                minOrder: parseFloat(minOrderStr || '0')
            };
        });

        // Find eligible coupons
        const eligibleCoupons = couponList.filter(c => subtotal >= c.minOrder);

        // Sort by discount descending
        eligibleCoupons.sort((a, b) => b.discount - a.discount);

        const bestCoupon = eligibleCoupons[0];

        if (bestCoupon) {
            // Only apply if it's different (avoids loops)
            if (couponCode !== bestCoupon.code) {
                setCouponCode(bestCoupon.code);

                // Trigger Celebration logic
                if (!isFirstRender.current) {
                    // Small delay to ensure UI is ready
                    setTimeout(() => {
                        const end = Date.now() + 1500;
                        const colors = ['#8b5cf6', '#d946ef', '#f43f5e', '#ec4899']; // Pink/Purple theme

                        (function frame() {
                            confetti({
                                particleCount: 2,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0 },
                                colors: colors,
                                zIndex: 9999
                            });
                            confetti({
                                particleCount: 2,
                                angle: 120,
                                spread: 55,
                                origin: { x: 1 },
                                colors: colors,
                                zIndex: 9999
                            });

                            if (Date.now() < end) {
                                requestAnimationFrame(frame);
                            }
                        }());
                        setShowCouponPopup(true);
                        setTimeout(() => setShowCouponPopup(false), 3000);
                    }, 500);
                }
            }
        } else {
            // If strictly enforced (no manual override allowed below threshold), clear it
            if (couponCode) {
                setCouponCode('');
            }
        }
    }, [subtotal, companyDetails?.companyCoupon, couponCode]);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const latestProducts = await Promise.all(
                cart.map(async (item) => {
                    const details = await fetchProductDetails(item.id);
                    return details;
                })
            );

            const validProducts = latestProducts.filter((p): p is NonNullable<typeof p> => p !== null);

            // Sync with server (updates prices, removes deleted)
            // We need to re-add syncWithServer to useCart, or implement it here locally.
            // Since we reverted it, I will implement a local check + store update.
            // Actually, best practice is to call the store action, but I removed it.
            // I will manually update the store if needed.

            let hasChanges = false;
            const changes: string[] = [];
            const newCart = cart.filter(item => {
                const fresh = validProducts.find(p => p.id === item.id);
                if (!fresh) {
                    hasChanges = true;
                    changes.push(`"${item.name}" is no longer available.`);
                    return false; // Remove
                }

                // Compare Price
                if (fresh.price !== item.price) {
                    hasChanges = true;
                    changes.push(`Price of "${item.name}" changed from ₹${item.price} to ₹${fresh.price}.`);
                    // We will update the item in the store in the next step
                }

                // Compare Status
                // Assuming existence implies status OK for now, or check fresh.status

                return true;
            });

            // Check for potential price updates to existing items
            const finalCart = newCart.map(item => {
                const fresh = validProducts.find(p => p.id === item.id);
                if (fresh && fresh.price !== item.price) {
                    return { ...item, price: fresh.price, name: fresh.name, imageUrl: fresh.imageUrl || item.imageUrl };
                }
                return item;
            });

            if (hasChanges) {
                // Update Store Manually (hacky since we removed the action, but works)
                useCart.setState({ cart: finalCart });
                setValidationErrors(changes);
                setShowValidationPopup(true);
            } else {
                // All Good
                setCartOpen(false);
                router.push('/cart');
            }
        } catch (error) {
            console.error("Checkout validation failed", error);
            toast({ variant: "destructive", description: "Something went wrong. Please try again." });
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Free Delivery Celebration
    useEffect(() => {
        // If already eligible on first render, mark as celebrated silently
        if (isFreeDelivery && isFirstRender.current) {
            setCelebrated(true);
            return;
        }

        if (isFreeDelivery && !celebrated && isCartOpen && !isFirstRender.current) {
            const end = Date.now() + 1500;
            const colors = ['#10B981', '#34D399', '#6EE7B7', '#FFD700'];

            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors,
                    zIndex: 9999
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors,
                    zIndex: 9999
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
            setCelebrated(true);
            setShowFreeDeliveryPopup(true);
            setTimeout(() => setShowFreeDeliveryPopup(false), 3000);
        } else if (!isFreeDelivery && celebrated) {
            setCelebrated(false);
        }
    }, [isFreeDelivery, celebrated, isCartOpen]);

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-2xl">

                {/* Coupon Unlocked Popup Overlay */}
                {showCouponPopup && (
                    <div className="absolute inset-x-4 top-1/4 z-[100] animate-in zoom-in-95 fade-in slide-in-from-bottom-10 duration-500 pointer-events-none">
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-white/20 pointer-events-auto">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm shadow-inner">
                                    <Tag className="w-7 h-7 text-white animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-bold mb-1 tracking-tight">Coupon Applied!</h3>
                                <p className="text-white/90 text-sm font-medium">You saved money with <span className="font-bold underline decoration-wavy decoration-white/50 underline-offset-4">{couponCode}</span></p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                                onClick={() => setShowCouponPopup(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Free Delivery Popup Overlay */}
                {showFreeDeliveryPopup && (
                    <div className="absolute inset-x-4 top-1/4 z-[100] animate-in zoom-in-95 fade-in slide-in-from-bottom-10 duration-500 pointer-events-none">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-white/20 pointer-events-auto">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm shadow-inner">
                                    <Gift className="w-7 h-7 text-white animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-bold mb-1 tracking-tight">Free Shipment!</h3>
                                <p className="text-white/90 text-sm font-medium">You've unlocked free delivery for this order.</p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                                onClick={() => setShowFreeDeliveryPopup(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Validation Popup */}
                {showValidationPopup && (
                    <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 slide-in-from-bottom-5">
                            <div className="bg-amber-500/10 p-6 flex flex-col items-center text-center border-b border-amber-500/20">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-3 text-amber-600 dark:text-amber-500">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Cart Updated</h3>
                                <p className="text-sm text-muted-foreground mt-1">Some items have changed since you added them.</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <ul className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="text-sm border-l-2 border-amber-500 pl-3 py-0.5 text-muted-foreground">
                                            {err}
                                        </li>
                                    ))}
                                </ul>

                                <Button className="w-full" onClick={() => setShowValidationPopup(false)}>
                                    <RefreshCw className="mr-2 w-4 h-4" />
                                    Review & Continue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

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
                            {/* Smart Reward Progress Bar (Combined) */}
                            {(() => {
                                const milestones = [];

                                // Add Free Delivery Milestone
                                if (freeDeliveryThreshold > 0) {
                                    milestones.push({
                                        type: 'delivery',
                                        value: freeDeliveryThreshold,
                                        label: 'Free Delivery',
                                        icon: Gift
                                    });
                                }

                                // Add Coupon Milestones
                                if (companyDetails?.companyCoupon) {
                                    companyDetails.companyCoupon.split(',').forEach(c => {
                                        const [code, , minStr] = c.split('&&&');
                                        const min = parseInt(minStr || '0');
                                        if (code && min > 0) {
                                            milestones.push({
                                                type: 'coupon',
                                                value: min,
                                                label: `Unlock ${code}`,
                                                icon: Tag
                                            });
                                        }
                                    });
                                }

                                // Sort by value
                                milestones.sort((a, b) => a.value - b.value);

                                // Find first unreached milestone
                                const nextMilestone = milestones.find(m => subtotal < m.value);

                                // If all unlocked (or no milestones), show generic success or nothing
                                // If some unlocked but all detailed milestones passed, maybe show "All Rewards Unlocked"
                                if (!nextMilestone) {
                                    if (milestones.length > 0 && subtotal >= milestones[milestones.length - 1].value) {
                                        return (
                                            <div className="mb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
                                                <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                                                    <Gift className="w-3.5 h-3.5 fill-emerald-700" />
                                                    Awesome! All rewards unlocked on this order.
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }

                                const amountNeeded = nextMilestone.value - subtotal;
                                const progress = (subtotal / nextMilestone.value) * 100;

                                return (
                                    <div className="mb-6 bg-secondary/30 p-3 rounded-xl border border-border/60 shadow-sm relative overflow-hidden group">
                                        {/* Background Shimmer */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                        <div className="flex justify-between items-center mb-2 relative z-10">
                                            <p className="text-xs font-bold text-foreground/80 flex items-center gap-2">
                                                <div className="bg-primary/10 p-1 rounded-full text-primary">
                                                    <nextMilestone.icon className="w-3 h-3" />
                                                </div>
                                                Add <span className="text-primary text-sm font-extrabold">₹{amountNeeded.toFixed(0)}</span> for <span className="uppercase">{nextMilestone.label}</span>
                                            </p>
                                            <span className="text-[10px] font-medium text-muted-foreground">{Math.round(progress)}%</span>
                                        </div>

                                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50 relative z-10">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-700 ease-out",
                                                    nextMilestone.type === 'delivery' ? "bg-emerald-500" : "bg-primary"
                                                )}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Coupon Section */}
                            <div className="mb-6 space-y-3">


                                {/* Available Coupons List (Simple Version) */}
                                {companyDetails?.companyCoupon && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {(() => {
                                            const coupons = companyDetails.companyCoupon.split(',').map((cStr, idx) => {
                                                const [code, discountStr, minOrderStr] = cStr.split('&&&');
                                                // Handle potential parsing errors safely
                                                const discount = parseFloat(discountStr || '0');
                                                const minOrder = parseFloat(minOrderStr || '0');
                                                // Ensure valid parsing
                                                if (!code) return null;

                                                return {
                                                    code,
                                                    discount,
                                                    minOrder,
                                                    isEligible: subtotal >= minOrder,
                                                    idx
                                                };
                                            }).filter((c): c is NonNullable<typeof c> => c !== null);

                                            // Sort: Lowest Discount First (Progression Ladder)
                                            coupons.sort((a, b) => a.discount - b.discount);

                                            return coupons.map((coupon) => (
                                                <button
                                                    key={coupon.idx}
                                                    onClick={() => coupon.isEligible && setCouponCode(coupon.code)}
                                                    disabled={!coupon.isEligible}
                                                    className={cn(
                                                        "group relative flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all duration-300 overflow-hidden",
                                                        coupon.isEligible
                                                            ? "bg-white border-primary/30 shadow-sm hover:border-primary hover:shadow-md cursor-pointer"
                                                            : "bg-slate-50 border-slate-200 cursor-not-allowed"
                                                    )}
                                                >
                                                    {/* Selection Glow */}
                                                    {couponCode === coupon.code && coupon.isEligible && (
                                                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                                    )}

                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-sm font-black tracking-wide font-mono leading-none",
                                                            coupon.isEligible ? "text-foreground" : "text-slate-400"
                                                        )}>{coupon.code}</span>
                                                        <span className="text-[10px] font-medium text-muted-foreground leading-none mt-1">
                                                            {coupon.isEligible ? `Get ${coupon.discount}% OFF` : `${coupon.discount}% OFF • Orders above ₹${coupon.minOrder}`}
                                                        </span>
                                                    </div>

                                                    {/* Selection Checkmark */}
                                                    {couponCode === coupon.code && coupon.isEligible ? (
                                                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                                            <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                                        </div>
                                                    ) : (
                                                        coupon.isEligible && (
                                                            <div className="h-4 w-4 rounded-full border border-primary/30 group-hover:border-primary transition-colors" />
                                                        )
                                                    )}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Shipping</span>
                                    <span className={cn(isFreeDelivery ? "text-green-600 font-medium" : "")}>
                                        {isFreeDelivery ? "FREE" : "Calculated at checkout"}
                                    </span>
                                </div>
                                {(() => {
                                    if (!couponCode || !companyDetails?.companyCoupon) return null;
                                    const couponData = companyDetails.companyCoupon.split(',').find(c => c.startsWith(couponCode + '&&&'));
                                    if (!couponData) return null;
                                    const [, discountStr, minOrderStr] = couponData.split('&&&');
                                    const discountPercent = parseFloat(discountStr || '0');
                                    const minOrder = parseFloat(minOrderStr || '0');

                                    if (subtotal < minOrder) return null;

                                    const discountAmount = (subtotal * discountPercent) / 100;

                                    return (
                                        <div className="flex justify-between text-sm text-emerald-600 font-medium animate-in slide-in-from-left-2">
                                            <span>Coupon ({couponCode})</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    );
                                })()}
                                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-primary tracking-tight">₹{(() => {
                                        let finalTotal = subtotal + shipping;
                                        if (couponCode && companyDetails?.companyCoupon) {
                                            const couponData = companyDetails.companyCoupon.split(',').find(c => c.startsWith(couponCode + '&&&'));
                                            if (couponData) {
                                                const [, discountStr, minOrderStr] = couponData.split('&&&');
                                                const discountPercent = parseFloat(discountStr || '0');
                                                const minOrder = parseFloat(minOrderStr || '0');
                                                if (subtotal >= minOrder) {
                                                    const discountAmount = (subtotal * discountPercent) / 100;
                                                    finalTotal -= discountAmount;
                                                }
                                            }
                                        }
                                        return Math.max(0, finalTotal).toFixed(2);
                                    })()}</span>
                                </div>
                            </div>

                            {!canCheckout && (
                                <p className="text-xs text-destructive text-center mb-2 font-medium bg-destructive/10 py-1 px-2 rounded-lg">
                                    Minimum order amount is ₹{minOrder.toFixed(0)}
                                </p>
                            )}

                            <Button
                                className={cn(
                                    "w-full h-12 rounded-full text-base font-bold shadow-lg transition-all duration-300",
                                    canCheckout
                                        ? "shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary/90"
                                        : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
                                )}
                                disabled={!canCheckout || isCheckingOut}
                                onClick={canCheckout ? handleCheckout : undefined}
                            >
                                {canCheckout ? (
                                    <div className="flex items-center w-full justify-center">
                                        {isCheckingOut ? (
                                            <>Validating <RefreshCw className="ml-2 w-4 h-4 animate-spin" /></>
                                        ) : (
                                            <> {text.checkoutButton || "Checkout securely"} <ArrowRight className="ml-2 w-4 h-4" /></>
                                        )}
                                    </div>
                                ) : (
                                    <span>Checkout Disabled</span>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent >
        </Sheet >
    );
}
