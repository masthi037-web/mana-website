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
    Tag,
    Lock,
    Trash,
    MapPin,
    Loader2,
    Home,
    Building2,
    Check,
    CreditCard,
    Info,
    User
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { customerService } from '@/services/customer.service';
import { orderService } from '@/services/order.service';
import { CustomerDetails, CustomerAddress, PaymentInitializationRequest } from '@/lib/api-types';
import { Label } from '@/components/ui/label';

import { useTenant } from '@/components/providers/TenantContext';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';

export function CartSheet({ children }: { children: React.ReactNode }) {
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, isCartOpen, setCartOpen, companyDetails, lastAddedItemId } = useCart();

    // Handle back button on mobile
    useSheetBackHandler(isCartOpen, setCartOpen);

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
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Checkout / Address State
    // Views: 'cart' -> 'list' (Select Address) -> 'add' (New Address) -> 'payment' (Select Payment)
    const [view, setView] = useState<'cart' | 'list' | 'add' | 'payment'>('cart');
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ONLINE'>('ONLINE');
    const [isInitializingPayment, setIsInitializingPayment] = useState(false);

    // Address Form State
    const [newAddress, setNewAddress] = useState<Partial<CustomerAddress>>({
        addressName: 'Home',
        customerRoad: '',
        customerCity: '',
        customerState: '',
        customerPin: '',
        customerDrNum: '',
        customerCountry: 'India'
    });
    const [savingAddress, setSavingAddress] = useState(false);

    const subtotal = getCartTotal();
    const cartItemCount = getCartItemsCount();

    // Config Logic
    const minOrder = companyDetails?.minimumOrderCost ? parseFloat(companyDetails.minimumOrderCost) : 0;
    const freeDeliveryThreshold = companyDetails?.freeDeliveryCost ? parseFloat(companyDetails.freeDeliveryCost) : 0;

    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    const checkAuth = () => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        }
    };

    useEffect(() => {
        checkAuth();
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth-change', checkAuth);
        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    // Status Logic
    const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
    const shipping = isFreeDelivery ? 0 : 0; // Calculated at checkout
    const total = subtotal + shipping;
    const canCheckout = subtotal >= minOrder;
    const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

    // Centralized Bill Calculation
    let discountAmount = 0;
    if (couponCode && companyDetails?.companyCoupon) {
        const couponData = companyDetails.companyCoupon.split(',').find(c => c.startsWith(couponCode + '&&&'));
        if (couponData) {
            const [, discountStr, minOrderStr] = couponData.split('&&&');
            const discountPercent = parseFloat(discountStr || '0');
            const minCouponOrder = parseFloat(minOrderStr || '0');
            if (subtotal >= minCouponOrder) {
                discountAmount = (subtotal * discountPercent) / 100;
            }
        }
    }
    const finalTotal = Math.max(0, total - discountAmount);

    // Contact Info State
    const [contactInfo, setContactInfo] = useState({
        name: '',
        email: '',
        mobile: ''
    });

    // Initial Mount Tracker
    useEffect(() => {
        // Small timeout to allow state calculations to settle before un-flagging
        const timer = setTimeout(() => {
            isFirstRender.current = false;
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Initial Load
    useEffect(() => {
        if (isCartOpen) {
            loadCustomerData();
        }
    }, [isCartOpen]);

    const loadCustomerData = async () => {
        setLoadingAddresses(true);
        try {
            const data = await customerService.getCustomerDetails(false); // use cache if available
            if (data) {
                setCustomer(data);
                setContactInfo({
                    name: data.customerName || '',
                    email: data.customerEmailId || '',
                    mobile: data.customerMobileNumber || ''
                });
                setAddresses(data.customerAddress || []);
                // Auto-select first address if none selected
                if (!selectedAddressId && data.customerAddress?.length > 0) {
                    setSelectedAddressId(data.customerAddress[0].customerAddressId);
                }
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Failed to load addresses." });
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleSaveAddress = async () => {
        if (!newAddress.customerRoad || !newAddress.customerCity || !newAddress.customerPin) {
            toast({ variant: "destructive", description: "Please fill in all required fields." });
            return;
        }

        setSavingAddress(true);
        try {
            // Must have customerId to create address linked to user
            if (!customer?.customerId) {
                toast({ variant: "destructive", description: "User ID missing. Try logging in again." });
                return;
            }

            await customerService.createAddress({
                ...newAddress,
                customerId: customer.customerId
            });

            toast({ description: "Address added successfully" });
            await loadCustomerData(); // Reload list
            setView('list'); // Go back
            // Reset form
            setNewAddress({
                addressName: 'Home',
                customerRoad: '',
                customerCity: '',
                customerState: '',
                customerPin: '',
                customerDrNum: '',
                customerCountry: 'India'
            });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", description: "Failed to save address." });
        } finally {
            setSavingAddress(false);
        }
    };

    const handlePaymentInitialize = async () => {
        if (!selectedAddressId || !customer) {
            toast({ variant: "destructive", description: "Please select an address first." });
            return;
        }

        if (!contactInfo.name || !contactInfo.mobile || !contactInfo.email) {
            toast({ variant: "destructive", description: "Please fill in all contact details (Name, Phone, Email)." });
            return;
        }

        const selectedAddress = addresses.find(a => a.customerAddressId === selectedAddressId);
        if (!selectedAddress) {
            toast({ variant: "destructive", description: "Invalid address selected." });
            return;
        }

        setIsInitializingPayment(true);
        try {
            // Calculate Costs
            const subtotal = getCartTotal();
            const minOrder = parseFloat(companyDetails?.minimumOrderCost || '0');
            const freeDeliveryThreshold = parseFloat(companyDetails?.freeDeliveryCost || '0');
            const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
            const shipping = isFreeDelivery ? 0 : (companyDetails?.deliveryBetween ? parseFloat(companyDetails.deliveryBetween) : 40); // Fallback to 40 if not set, or parse from string
            const discountAmount = 0; // Logic for coupon discount to be added later if needed
            const totalCost = subtotal + shipping - discountAmount;

            // Construct Payload
            const payload: PaymentInitializationRequest = {
                customerName: contactInfo.name,
                customerPhoneNumber: contactInfo.mobile,
                customerEmailId: contactInfo.email,
                domainName: companyDetails?.companyDomain || window.location.hostname,
                customerAddress: `${selectedAddress.customerDrNum}, ${selectedAddress.customerRoad}`,
                customerCity: selectedAddress.customerCity,
                customerState: selectedAddress.customerState,
                customerCountry: selectedAddress.customerCountry,
                addressName: selectedAddress.addressName,
                shipmentAmount: shipping,
                discount: "PERCENTAGE", // Placeholder as per requirement example
                discountName: "NEWUSER10", // Placeholder
                discountAmount: 25.00, // Placeholder
                totalCost: totalCost,
                paymentMethod: selectedPaymentMethod,
                customerNote: "Call before delivery", // Placeholder
                items: cart.map(item => {
                    // Logic to find the correct pricing ID based on selected variants (Quantity)
                    let pricingId: number | null = null;
                    if (item.pricing && item.pricing.length > 0) {
                        const quantityVariant = item.selectedVariants['Quantity'];
                        if (quantityVariant) {
                            const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                            if (matchedPricing) {
                                pricingId = parseInt(matchedPricing.id);
                            }
                        }
                        if (!pricingId && item.pricing.length > 0) {
                            pricingId = parseInt(item.pricing[0].id);
                        }
                    }

                    return {
                        productId: parseInt(item.id),
                        pricingId: pricingId,
                        productAddonIds: item.selectedAddons && item.selectedAddons.length > 0
                            ? item.selectedAddons.map(a => a.id).join('&&&')
                            : "",
                        quantity: item.quantity
                    };
                })
            };

            const response = await orderService.initializePayment(
                payload,
                companyDetails?.razorpayKeyId || '',
                companyDetails?.razorpayKeySecret || ''
            );
            console.log("PAYMENT INIT RESPONSE:", response);

            if (response && response.razorpayOrderId) {
                toast({
                    title: "Order Initialized",
                    description: `Order ID: ${response.razorpayOrderId}`,
                    duration: 5000
                });
                // Logic to open Razorpay modal will go here
            }

        } catch (error) {
            console.error("Payment Init Error:", error);
            toast({ variant: "destructive", description: "Failed to initialize payment." });
        } finally {
            setIsInitializingPayment(false);
        }
    };
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
                        setTimeout(() => setShowCouponPopup(false), 1500);
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
        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }

        setIsCheckingOut(true);
        console.log("Starting checkout validation process...");
        try {
            // 1. Get Customer Details (Phone, Name)
            // We need these for the validation payload
            // Assuming customerService has a method to get cached details or we fetch fresh
            const { customerService } = await import('@/services/customer.service');
            const customerData = await customerService.getCustomerDetails();

            if (!customerData) {
                toast({ variant: "destructive", description: "Could not fetch user details. Please try again." });
                return;
            }

            // 2. Construct Payload
            const { validateCheckout } = await import('@/services/product.service');
            const payload: any = {
                customerName: customerData.customerName,
                phoneNumber: customerData.customerMobileNumber,
                domainName: companyDetails?.companyDomain || window.location.hostname,
                items: cart.map(item => {
                    // Logic to find the correct pricing ID based on selected variants (Quantity)
                    let pricingId: number | null = null;
                    if (item.pricing && item.pricing.length > 0) {
                        const quantityVariant = item.selectedVariants['Quantity'];
                        if (quantityVariant) {
                            const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                            if (matchedPricing) {
                                pricingId = parseInt(matchedPricing.id);
                            }
                        }
                        // Fallback to first pricing option if no variant match found (e.g. legacy or single option)
                        if (!pricingId && item.pricing.length > 0) {
                            pricingId = parseInt(item.pricing[0].id);
                        }
                    }

                    return {
                        productId: parseInt(item.id),
                        pricingId: pricingId,
                        productAddonIds: item.selectedAddons && item.selectedAddons.length > 0
                            ? item.selectedAddons.map(a => a.id).join('&&&')
                            : ""
                    };
                })
            };

            // 3. Call Validation API
            const response = await validateCheckout(payload);

            if (!response || !response.productDetails) {
                toast({ variant: "destructive", description: "Validation failed. Please try again." });
                return;
            }

            // 4. Compare and Validate
            let hasChanges = false;
            const changes: string[] = [];
            const newCart = [...cart];

            // We iterate through response items. Order is preserved? Yes, usually.
            // But let's verify by index or ID if possible. The API response lacks ID, so we assume index matching.

            response.productDetails.forEach((detail, index) => {
                const item = newCart[index];
                if (!item) return;

                // Check Status
                if (detail.productStatus !== 'ACTIVE') {
                    hasChanges = true;
                    changes.push(`"${item.name}" is currently unavailable/inactive.`);
                    // We will remove it later or mark it. For now, let's remove it from the cart to be safe?
                    item.cartItemId = 'REMOVE_ME'; // Mark for removal
                }

                // Check Product Price
                if (detail.productPrice !== item.price) {
                    hasChanges = true;
                    changes.push(`Price of "${item.name}" updated from ₹${item.price} to ₹${detail.productPrice}.`);
                    item.price = detail.productPrice;
                }

                // Check Addon Prices
                if (item.selectedAddons && item.selectedAddons.length > 0 && detail.addonAndAddonPrice) {
                    // detail.addonAndAddonPrice is ["id:price", ...]
                    detail.addonAndAddonPrice.forEach(str => {
                        const [idStr, priceStr] = str.split(':');
                        const addonIndex = item.selectedAddons!.findIndex(a => a.id === idStr);
                        if (addonIndex > -1) {
                            const newPrice = parseFloat(priceStr);
                            if (item.selectedAddons![addonIndex].price !== newPrice) {
                                hasChanges = true;
                                changes.push(`Addon price for "${item.name}" updated.`);
                                item.selectedAddons![addonIndex].price = newPrice;
                            }
                        }
                    });
                }
            });

            const finalCart = newCart.filter(item => item.cartItemId !== 'REMOVE_ME');

            if (hasChanges) {
                // Update Store
                useCart.setState({ cart: finalCart });
                setValidationErrors(changes);
                setShowValidationPopup(true);
            } else {
                // All Good -> Switch to Address Selection
                loadCustomerData();
                setView('list');
            }

        } catch (error) {
            console.error("Checkout validation failed", error);
            toast({ variant: "destructive", description: "Something went wrong. Please try again.", duration: 2000 });
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
            setTimeout(() => setShowFreeDeliveryPopup(false), 1500);
        } else if (!isFreeDelivery && celebrated) {
            setCelebrated(false);
        }
    }, [isFreeDelivery, celebrated, isCartOpen]);

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md h-[100dvh] flex flex-col p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-2xl">

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

                {/* Delete Confirmation Popup */}
                <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                    <AlertDialogContent className="w-[90%] sm:max-w-[400px] border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-3xl p-6 gap-0">
                        <div className="flex flex-col items-center text-center space-y-4 pt-2">
                            {/* Animated Icon */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full animate-pulse" />
                                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center relative border border-destructive/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                    <Trash className="w-7 h-7 text-destructive animate-bounce" />
                                </div>
                            </div>

                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold tracking-tight">Remove Item?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[260px] mx-auto">
                                    Are you sure you want to remove this item from your cart? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                        </div>
                        <AlertDialogFooter className="grid grid-cols-2 gap-3 mt-8">
                            <AlertDialogCancel className="rounded-xl h-11 border-border/50 bg-secondary/50 hover:bg-secondary hover:text-foreground font-semibold transition-all duration-200 mt-0">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (itemToDelete) {
                                        removeFromCart(itemToDelete);
                                        setItemToDelete(null);
                                        toast({
                                            description: "Item removed from cart",
                                            className: "bg-background border-border"
                                        });
                                    }
                                }}
                                className="rounded-xl h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20 transition-all duration-200 hover:shadow-destructive/40 hover:-translate-y-0.5"
                            >
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Premium Login Required Popup */}
                {showLoginPopup && (
                    <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-background w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 slide-in-from-bottom-5 relative">
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-secondary"
                                onClick={() => setShowLoginPopup(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Animated Lock Icon */}
                                <div className="relative mb-6 group">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center relative border border-primary/20 shadow-inner">
                                        <Lock className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                                    </div>
                                    <div className="absolute top-0 right-0 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-sm border border-border z-10">
                                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold tracking-tight mb-2">Login Required</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm mb-8">
                                    Please log in to your account to verify your identity and secure your order.
                                </p>

                                <Button
                                    className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-primary to-primary/90"
                                    onClick={() => {
                                        setShowLoginPopup(false); // Clear popup
                                        setCartOpen(false); // Close Cart Sidebar
                                        // Small timeout to allow cart close animation to start/finish
                                        setTimeout(() => {
                                            window.dispatchEvent(new Event('open-profile-sidebar'));
                                        }, 300);
                                    }}
                                >
                                    Log In / Sign Up
                                </Button>

                                <p className="text-xs text-muted-foreground mt-6">
                                    Don't have an account? No problem, we'll create one for you instantly using your phone number.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-20">
                    {view === 'cart' ? (
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
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 h-8 w-8 rounded-full"
                                onClick={() => {
                                    if (view === 'add') setView('list');
                                    else if (view === 'payment') setView('list');
                                    else setView('cart');
                                }}
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </Button>
                            <SheetTitle className="text-xl font-bold font-headline flex items-center gap-2">
                                {view === 'add' ? 'Add New Address' : view === 'payment' ? 'Select Payment Method' : 'Select Delivery Address'}
                            </SheetTitle>
                        </div>
                    )}
                </SheetHeader>

                {view === 'cart' ? (
                    cart.length === 0 ? (
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
                                                        src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl}
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
                                                            onClick={() => setItemToDelete(item.cartItemId)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Summary Content Moved to ScrollArea */}
                                <div className="pb-6">
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
                                                        const discount = parseFloat(discountStr || '0');
                                                        const minOrder = parseFloat(minOrderStr || '0');
                                                        if (!code) return null;

                                                        return {
                                                            code,
                                                            discount,
                                                            minOrder,
                                                            isEligible: subtotal >= minOrder,
                                                            idx
                                                        };
                                                    }).filter((c): c is NonNullable<typeof c> => c !== null);

                                                    coupons.sort((a, b) => a.discount - b.discount);
                                                    const selectedCouponData = coupons.find(c => c.code === couponCode);
                                                    const hasActiveCoupon = !!selectedCouponData;

                                                    return coupons.map((coupon) => {
                                                        const isBlocked = hasActiveCoupon && coupon.code !== couponCode;
                                                        const isDisabled = !coupon.isEligible || isBlocked;

                                                        return (
                                                            <button
                                                                key={coupon.idx}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        setCouponCode(coupon.code);
                                                                    }
                                                                }}
                                                                disabled={isDisabled}
                                                                className={cn(
                                                                    "group relative flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all duration-300 overflow-hidden",
                                                                    !isDisabled
                                                                        ? "bg-white border-primary/30 shadow-sm hover:border-primary hover:shadow-md cursor-pointer"
                                                                        : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                                                                )}
                                                            >
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
                                                        );
                                                    });
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
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600 font-medium animate-in slide-in-from-left-2">
                                                <span>Coupon ({couponCode})</span>
                                                <span>-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Minimal Footer */}
                            <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20">
                                <div className="flex justify-between items-baseline mb-4">
                                    <span className="font-semibold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-primary tracking-tight">₹{finalTotal.toFixed(2)}</span>
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
                    )) : (
                    <>
                        <ScrollArea className="flex-1 bg-secondary/10">
                            <div className="p-6 space-y-8">
                                {/* Address List View */}
                                {view === 'list' && (
                                    <>
                                        {/* Contact Details */}
                                        <div className="space-y-4 mb-6">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Contact Details</h3>
                                            <div className="bg-background p-5 rounded-2xl border shadow-sm space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cName">Full Name</Label>
                                                    <Input
                                                        id="cName"
                                                        placeholder="John Doe"
                                                        value={contactInfo.name}
                                                        onChange={e => setContactInfo({ ...contactInfo, name: e.target.value })}
                                                        className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cPhone">Phone Number</Label>
                                                    <Input
                                                        id="cPhone"
                                                        placeholder="9876543210"
                                                        value={contactInfo.mobile}
                                                        readOnly
                                                        className="bg-secondary/10 border-transparent text-muted-foreground focus-visible:ring-0 cursor-not-allowed rounded-xl opacity-90 font-medium"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cEmail">Email Address</Label>
                                                    <Input
                                                        id="cEmail"
                                                        placeholder="john@example.com"
                                                        value={contactInfo.email}
                                                        onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                                        className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                    />
                                                    <div className="flex items-center gap-2 mt-2 px-1 opacity-80">
                                                        <Info className="w-3 h-3 text-primary animate-pulse" />
                                                        <p className="text-[10px] text-muted-foreground font-medium">
                                                            Please enter correctly for order confirmation.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Saved Addresses */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Saved Addresses</h3>

                                            {loadingAddresses ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                    <p className="text-xs font-medium">Loading addresses...</p>
                                                </div>
                                            ) : addresses.length === 0 ? (
                                                <div className="text-center py-10 px-4 bg-background rounded-3xl border border-dashed border-border/60">
                                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <MapPin className="w-6 h-6" />
                                                    </div>
                                                    <p className="font-semibold text-foreground">No addresses found</p>
                                                    <Button onClick={() => setView('add')} variant="secondary" className="mt-4 rounded-full">
                                                        Add First Address
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {addresses.map((addr) => {
                                                        const isSelected = selectedAddressId === addr.customerAddressId;
                                                        return (
                                                            <div
                                                                key={addr.customerAddressId}
                                                                onClick={() => setSelectedAddressId(addr.customerAddressId)}
                                                                className={cn(
                                                                    "relative group cursor-pointer p-4 rounded-2xl border transition-all duration-300",
                                                                    isSelected
                                                                        ? "bg-primary/5 border-primary shadow-sm"
                                                                        : "bg-background border-border hover:border-primary/30 hover:shadow-md"
                                                                )}
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                                                                    )}>
                                                                        <Home className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className={cn(
                                                                                "font-bold text-base truncate",
                                                                                isSelected ? "text-primary" : "text-foreground"
                                                                            )}>
                                                                                {addr.addressName}
                                                                            </span>
                                                                            {isSelected && (
                                                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0 text-center rounded-full flex items-center gap-1">
                                                                                    <Check className="w-3 h-3" /> Selected
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                                            {addr.customerDrNum}, {addr.customerRoad}, {addr.customerCity} - {addr.customerPin}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setView('add')}
                                                        className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-semibold text-sm text-muted-foreground group-hover:text-primary">Add New Address</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Add Address View */}
                                {view === 'add' && (
                                    <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
                                        <div className="space-y-4 bg-background p-6 rounded-3xl border shadow-sm">
                                            <div className="grid gap-2">
                                                <Label>Address Label</Label>
                                                <div className="flex gap-3">
                                                    {['Home', 'Work', 'Other'].map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setNewAddress({ ...newAddress, addressName: tag })}
                                                            className={cn(
                                                                "flex-1 py-2 text-sm font-semibold rounded-xl border transition-all",
                                                                newAddress.addressName === tag
                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                    : "bg-secondary/30 hover:bg-secondary border-transparent"
                                                            )}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="drNum">Door / Flat No.</Label>
                                                    <Input
                                                        id="drNum"
                                                        placeholder="e.g. 402, Green Apartments"
                                                        value={newAddress.customerDrNum}
                                                        onChange={e => setNewAddress({ ...newAddress, customerDrNum: e.target.value })}
                                                        className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="road">Road / Area</Label>
                                                    <Input
                                                        id="road"
                                                        placeholder="e.g. MG Road, Indiranagar"
                                                        value={newAddress.customerRoad}
                                                        onChange={e => setNewAddress({ ...newAddress, customerRoad: e.target.value })}
                                                        className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="city">City</Label>
                                                        <Input
                                                            id="city"
                                                            placeholder="City"
                                                            value={newAddress.customerCity}
                                                            onChange={e => setNewAddress({ ...newAddress, customerCity: e.target.value })}
                                                            className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="pincode">Pincode</Label>
                                                        <Input
                                                            id="pincode"
                                                            placeholder="560001"
                                                            value={newAddress.customerPin}
                                                            onChange={e => setNewAddress({ ...newAddress, customerPin: e.target.value })}
                                                            className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="state">State</Label>
                                                    <Input
                                                        id="state"
                                                        placeholder="State"
                                                        value={newAddress.customerState}
                                                        onChange={e => setNewAddress({ ...newAddress, customerState: e.target.value })}
                                                        className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                    />
                                                </div>

                                            </div>
                                        </div>

                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-xs font-medium leading-relaxed border border-blue-100 flex gap-3">
                                            <div className="bg-blue-100 p-1.5 rounded-full h-fit">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <p>Ensure your address details are accurate to avoid delivery delays. Pincode is crucial for serviceability checks.</p>
                                        </div>

                                        <Button
                                            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                                            onClick={handleSaveAddress}
                                            disabled={savingAddress}
                                        >
                                            {savingAddress ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                                </>
                                            ) : (
                                                "Save Address"
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* View: Payment Method */}
                                {view === 'payment' && (
                                    <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-8">

                                        {/* Order Summary */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Order Summary</h3>
                                            <div className="bg-background rounded-3xl border shadow-sm overflow-hidden">
                                                <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
                                                    {cart.map((item) => (
                                                        <div key={item.cartItemId} className="flex gap-4 p-4 rounded-2xl border border-transparent hover:border-border/50 hover:bg-white hover:shadow-sm transition-all group/item">
                                                            {/* Image */}
                                                            <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/50 bg-white relative">
                                                                {item.images && item.images.length > 0 ? (
                                                                    <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                                                ) : item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-[10px]">No Img</div>
                                                                )}
                                                            </div>
                                                            {/* Details */}
                                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                                <div>
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <h4 className="font-bold text-sm leading-tight text-foreground/90 line-clamp-2">{item.name}</h4>
                                                                        <span className="font-bold text-sm whitespace-nowrap">₹{((item.price + (item.selectedAddons?.reduce((acc, a) => acc + a.price, 0) || 0)) * item.quantity).toFixed(0)}</span>
                                                                    </div>

                                                                    {/* Variants & Addons Chips */}
                                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                                        {Object.entries(item.selectedVariants || {}).map(([k, v]) => (
                                                                            <span key={k} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50">
                                                                                {v}
                                                                            </span>
                                                                        ))}
                                                                        {item.selectedAddons?.map((addon) => (
                                                                            <span key={addon.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                                                                <Plus className="w-2 h-2" /> {addon.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[10px] font-semibold bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                                                                        Qty: {item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bill Details */}
                                                <div className="bg-secondary/10 p-5 space-y-3.5 text-sm border-t border-dashed border-border">
                                                    <div className="flex justify-between text-muted-foreground">
                                                        <span>Item Total</span>
                                                        <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
                                                    </div>

                                                    {discountAmount > 0 && (
                                                        <div className="flex justify-between text-emerald-600 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Tag className="w-3.5 h-3.5" />
                                                                <span>Coupon ({couponCode})</span>
                                                            </div>
                                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between text-muted-foreground">
                                                        <span>Delivery Charge</span>
                                                        <span className={isFreeDelivery ? "text-emerald-600 font-medium" : "text-foreground"}>
                                                            {isFreeDelivery ? "FREE" : "₹" + shipping.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="h-px bg-border my-1" />

                                                    <div className="flex justify-between items-end">
                                                        <span className="font-bold text-base">Grand Total</span>
                                                        <span className="font-bold text-xl text-primary leading-none">
                                                            ₹{finalTotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Details */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Delivery To</h3>
                                            <div className="bg-background p-5 rounded-3xl border shadow-sm space-y-5 relative overflow-hidden">
                                                {/* Contact Info */}
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-sm truncate">{contactInfo.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{contactInfo.mobile}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{contactInfo.email}</p>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-border/60 w-full" />

                                                {/* Address */}
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                                        <MapPin className="w-5 h-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        {(() => {
                                                            const addr = addresses.find(a => a.customerAddressId === selectedAddressId);
                                                            return addr ? (
                                                                <>
                                                                    <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded text-foreground/70 mb-1 inline-block uppercase tracking-wider">
                                                                        {addr.addressName || 'Home'}
                                                                    </span>
                                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                                        {addr.customerDrNum}, {addr.customerRoad}, {addr.customerCity} - {addr.customerPin}
                                                                    </p>
                                                                </>
                                                            ) : <p className="text-sm text-destructive">No address selected</p>;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Payment Method</h3>

                                            {/* Online Payment Option */}
                                            <div
                                                onClick={() => setSelectedPaymentMethod('ONLINE')}
                                                className={cn(
                                                    "relative overflow-hidden cursor-pointer p-5 rounded-3xl border-2 transition-all duration-300",
                                                    selectedPaymentMethod === 'ONLINE'
                                                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/10"
                                                        : "bg-background border-border hover:border-primary/30"
                                                )}
                                            >
                                                <div className="flex items-start gap-4 z-10 relative">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                        selectedPaymentMethod === 'ONLINE' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                                    )}>
                                                        <CreditCard className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={cn(
                                                                "font-bold text-lg",
                                                                selectedPaymentMethod === 'ONLINE' ? "text-primary" : "text-foreground"
                                                            )}>
                                                                Online Payment
                                                            </span>
                                                            {selectedPaymentMethod === 'ONLINE' && (
                                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Check className="w-3 h-3" /> SELECTED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            Securely pay via UPI, Credit/Debit Cards, or Netbanking.
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-md text-muted-foreground">Powered by Razorpay</span>
                                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">100% Secure</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Background Glow */}
                                                {selectedPaymentMethod === 'ONLINE' && (
                                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Footer for Address View (Select Address) */}
                        {view === 'list' && (
                            <div className="p-6 bg-background pt-4 border-t border-border/50 backdrop-blur-md">
                                <Button
                                    size="lg"
                                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    onClick={() => {
                                        if (selectedAddressId) setView('payment');
                                    }}
                                    disabled={!selectedAddressId}
                                >
                                    {!selectedAddressId ? (
                                        "Select an Address"
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Proceed to Pay <ArrowRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium">
                                    Secure Encrypted Transaction • 100% Purchase Protection
                                </p>
                            </div>
                        )}

                        {/* Footer for Payment View */}
                        {view === 'payment' && (
                            <div className="p-6 bg-background pt-4 border-t border-border/50 backdrop-blur-md">
                                <Button
                                    size="lg"
                                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    onClick={handlePaymentInitialize}
                                    disabled={isInitializingPayment}
                                >
                                    {isInitializingPayment ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Pay & Place Order <ArrowRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                                <div className="flex items-center justify-center gap-2 mt-3 opacity-60">
                                    <CreditCard className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">Safe & Secure Payment</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet >
    );
}
