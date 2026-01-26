"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
    Sparkles,
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
    User,
    Briefcase
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
import { useCart, CartItem } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { customerService } from '@/services/customer.service';
import { orderService } from '@/services/order.service';
import { CustomerDetails, CustomerAddress, PaymentInitializationRequest, CheckoutValidationItem, CheckoutValidationRequest } from '@/lib/api-types';
import { Label } from '@/components/ui/label';
import { useRazorpay } from '@/hooks/use-razorpay';
import { fetchCompanyDetails } from '@/services/company.service';
import { validateCheckout } from '@/services/product.service';

import { useTenant } from '@/components/providers/TenantContext';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';

export function CartSheet({ children }: { children: React.ReactNode }) {
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, isCartOpen, setCartOpen, companyDetails, lastAddedItemId, clearCart } = useCart();
    const { isLoaded: isRazorpayLoaded, loadRazorpay } = useRazorpay();

    // Handle back button on mobile
    useSheetBackHandler(isCartOpen, setCartOpen);

    const { toast } = useToast();
    const { text, theme } = useTenant();
    const router = useRouter();
    const [celebrated, setCelebrated] = useState(false);
    const [bulkCelebrated, setBulkCelebrated] = useState(false);
    const [showFreeDeliveryPopup, setShowFreeDeliveryPopup] = useState(false);
    const [showCouponPopup, setShowCouponPopup] = useState(false);

    // Track initial render to prevent confetti on reload
    // Track initial render to prevent confetti on reload
    const isFirstRender = useRef(true);

    // Calculate Product Quantities (ID-based) and associate Rules
    const productQuantities: Record<string, number> = {};
    const productRules: Record<string, string> = {};

    cart.forEach(item => {
        productQuantities[item.id] = (productQuantities[item.id] || 0) + item.quantity;
        if (item.multipleSetDiscount) {
            productRules[item.id] = item.multipleSetDiscount.trim();
        }
    });

    // Pre-calculate Discount Distribution Map for each Product (Scoped by Product ID)
    // Key: Product ID -> Value: Array of percentages for each unit [15, 15, 15, 15, 0]
    const productDiscounts: Record<string, number[]> = {};

    Object.keys(productQuantities).forEach(productId => {
        const totalQty = productQuantities[productId];
        const ruleKey = productRules[productId];

        // Find a representative item to check for 'More Than' rule
        const productItem = cart.find(i => i.id.toString() === productId);
        const moreThanRule = productItem?.multipleDiscountMoreThan;

        // --- Logic 1: Standard Greedy Tiers ---
        let greedyDistribution: number[] = [];
        let maxGreedyDiscount = 0;

        if (ruleKey) {
            const segments = ruleKey.split('&&&');
            const tiers: { threshold: number, percent: number }[] = [];
            segments.forEach(seg => {
                const parts = seg.split('-');
                if (parts.length === 2) {
                    const t = parseFloat(parts[0]);
                    const p = parseFloat(parts[1]);
                    if (!isNaN(t) && !isNaN(p)) {
                        tiers.push({ threshold: t, percent: p });
                    }
                }
            });

            // Sort Tiers Descending by Threshold
            tiers.sort((a, b) => b.threshold - a.threshold);
            if (tiers.length > 0) maxGreedyDiscount = tiers[0].percent; // Approx max possible

            let remaining = totalQty;
            while (remaining > 0) {
                const bestTier = tiers.find(t => t.threshold <= remaining);
                if (bestTier) {
                    for (let k = 0; k < bestTier.threshold; k++) {
                        greedyDistribution.push(bestTier.percent);
                    }
                    remaining -= bestTier.threshold;
                } else {
                    for (let k = 0; k < remaining; k++) {
                        greedyDistribution.push(0);
                    }
                    remaining = 0;
                }
            }
        } else {
            greedyDistribution = new Array(totalQty).fill(0);
        }

        // --- Logic 2: 'More Than' Override ---
        let finalDistribution = greedyDistribution;

        if (moreThanRule) {
            const parts = moreThanRule.split('-');
            if (parts.length === 2) {
                const threshold = parseFloat(parts[0]);
                const discount = parseFloat(parts[1]);

                // Condition: Quantity > Threshold AND Discount > Max Tier Discount
                // Note: User says "more then 6", so strictly `>`
                if (!isNaN(threshold) && !isNaN(discount) && totalQty > threshold) {
                    // Check if this override is better than the BEST tiered discount available
                    // Or simply if it applies. User logic implies it should supersede if better.
                    // We'll trust the user's intent: "start considering buy 6+ get 20% offer as 20% offer is more then 10, 15"

                    // Locate optimal set discount used in greedy? No, just compare max potential.
                    // Actually, let's compare against the best single tier used.

                    if (discount > maxGreedyDiscount) {
                        // Apply Flat Discount to ALL items
                        finalDistribution = new Array(totalQty).fill(discount);
                    }
                }
            }
        }

        productDiscounts[productId] = finalDistribution;
    });

    const hasBulkDiscount = Object.keys(productDiscounts).some(k => productDiscounts[k].some(p => p > 0));

    // Bulk Discount Celebration
    useEffect(() => {
        if (!isFirstRender.current && hasBulkDiscount && !bulkCelebrated && isCartOpen) {
            const end = Date.now() + 1500;
            const colors = ['#059669', '#34D399', '#A7F3D0']; // Emerald/Green theme

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
            setBulkCelebrated(true);
            toast({
                title: "Bulk Discount Unlocked! 🎉",
                description: "You've saved big with our bulk offers.",
                className: "bg-emerald-50 border-emerald-200 text-emerald-800"
            });
        }
    }, [hasBulkDiscount, bulkCelebrated, isCartOpen]);


    // Validation State
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    interface ValidationMessage {
        message: string;
        cartItemId?: string;
    }

    const [validationErrors, setValidationErrors] = useState<ValidationMessage[]>([]);
    const [showValidationPopup, setShowValidationPopup] = useState(false);

    // Stock Conflict State
    interface StockConflict {
        stockKey: string;
        productName: string;
        availableStock: number;
        items: CartItem[]; // Items involved in this conflict
        totalRequested: number;
    }
    const [stockConflicts, setStockConflicts] = useState<StockConflict[]>([]);
    const [showConflictPopup, setShowConflictPopup] = useState(false);


    // ... (inside handleCheckout) ...

    // 5. Compare and Validate
    let blockingChanges = false;
    const changes: ValidationMessage[] = [];
    const uniqueMessages = new Set<string>();

    const pushChange = (msg: string, cartItemId?: string) => {
        if (!uniqueMessages.has(msg)) {
            uniqueMessages.add(msg);
            changes.push({ message: msg, cartItemId });
        }
    };

    // ... (throughout validation logic, pass item.cartItemId where appropriate) ...

    // ... (UI Render for Validation Popup) ...

    {/* Validation Popup */ }
    {
        showValidationPopup && (
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
                        <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {validationErrors.map((err, i) => (
                                <li key={i} className="text-sm border-l-2 border-amber-500 pl-3 py-1 text-muted-foreground flex items-start justify-between gap-2 bg-amber-50/50 dark:bg-amber-950/10 rounded-r-md">
                                    <span>{err.message}</span>
                                    {err.cartItemId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-0.5 shrink-0"
                                            onClick={() => {
                                                removeFromCart(err.cartItemId!);
                                                setValidationErrors(prev => prev.filter((_, idx) => idx !== i));
                                                // If no errors left, close popup (optional, or keep open to review others)
                                                if (validationErrors.length <= 1) setShowValidationPopup(false);
                                            }}
                                            title="Remove item from cart"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
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
        )
    }
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
    const [savingAddress, setSavingAddress] = useState(false); // Moved from line 214

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
    const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
    const subtotal = getCartTotal();

    const handlePincodeChange = async (value: string) => {
        setNewAddress(prev => ({ ...prev, customerPin: value }));

        if (value.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
                const data = await response.json();

                if (data[0].Status === 'Success') {
                    const details = data[0].PostOffice[0];
                    setNewAddress(prev => ({
                        ...prev,
                        customerPin: value,
                        customerCity: details.Division,
                        customerState: details.State,
                        customerCountry: 'India'
                    }));
                    toast({ description: `Location found: ${details.Division}, ${details.State}` });
                } else {
                    toast({ variant: "destructive", description: "Invalid Pincode" });
                    setNewAddress(prev => ({ ...prev, customerCity: '', customerState: '' }));
                }
            } catch (error) {
                console.error("Pin code fetch error:", error);
            }
        }
    };

    // Helper to sync label changes
    const handleLabelChange = (label: 'Home' | 'Work' | 'Other') => {
        setAddressLabel(label);
        if (label !== 'Other') {
            setNewAddress(prev => ({ ...prev, addressName: label }));
        } else {
            setNewAddress(prev => ({ ...prev, addressName: '' })); // Clear for custom input
        }
    };

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

    // Reset view on logout
    useEffect(() => {
        if (!isLoggedIn) {
            setView('cart');
            setSelectedAddressId(null);
            setCustomer(null);
        }
    }, [isLoggedIn]);

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
    // Initial Load
    useEffect(() => {
        if (isCartOpen && isLoggedIn) {
            loadCustomerData();
        }
    }, [isCartOpen, isLoggedIn]);

    const loadCustomerData = async (forceRefresh = false) => {
        setLoadingAddresses(true);
        try {
            const data = await customerService.getCustomerDetails(forceRefresh); // use cache if available unless forced
            if (data) {
                setCustomer(data);
                setCustomer(data);

                // Only overwrite contact info if it's empty (initial load) so we don't wipe user input
                // Or if the server has data and we have nothing.
                setContactInfo(prev => ({
                    name: prev.name || data.customerName || '',
                    email: prev.email || data.customerEmailId || '',
                    mobile: prev.mobile || data.customerMobileNumber || ''
                }));
                setAddresses(data.customerAddress || []);
                // Auto-select first address if none selected and NOT saving (saving handles its own selection)
                if (!selectedAddressId && data.customerAddress?.length > 0 && !savingAddress) {
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
        // Enforce name if Other
        if (addressLabel === 'Other' && !newAddress.addressName) {
            toast({ variant: "destructive", description: "Please enter a name for this address." });
            return;
        }

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

            const createdAddress = await customerService.createAddress({
                ...newAddress,
                customerDrNum: newAddress.customerRoad, // Duplicate road to drNum for backend compatibility
                customerId: customer.customerId
            });

            toast({ description: "Address added successfully" });

            // Force refresh to get latest data from server
            await loadCustomerData(true);

            // Auto-select the newly created address
            if (createdAddress && createdAddress.customerAddressId) {
                setSelectedAddressId(createdAddress.customerAddressId);
            }

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
            // Update customer details if changed
            console.log("Checking for contact updates:", { contactInfo, customer });
            if (customer && (
                contactInfo.name !== customer.customerName ||
                contactInfo.email !== customer.customerEmailId ||
                contactInfo.mobile !== customer.customerMobileNumber
            )) {
                await customerService.updateCustomer({
                    customerId: customer.customerId,
                    companyId: customer.companyId,
                    customerName: contactInfo.name,
                    customerEmailId: contactInfo.email,
                    customerMobileNumber: contactInfo.mobile,
                    customerStatus: customer.customerStatus,
                    createdAt: customer.createdAt,
                    customerImage: customer.customerImage
                });
                // Build fresh cache so profile reflects changes
                await loadCustomerData(true);
            }

            // Calculate Costs
            const subtotal = getCartTotal();
            const minOrder = parseFloat(companyDetails?.minimumOrderCost || '0');
            const freeDeliveryThreshold = parseFloat(companyDetails?.freeDeliveryCost || '0');
            const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
            const shipping = isFreeDelivery ? 0 : (companyDetails?.deliveryBetween ? parseFloat(companyDetails.deliveryBetween) : 40);
            const discountAmount = 0;
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
                        // Try to match pricing ID from selected quantity variant
                        const quantityVariant = item.selectedVariants?.['Quantity'];
                        if (quantityVariant) {
                            const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                            if (matchedPricing) {
                                pricingId = parseInt(matchedPricing.id);
                            }
                        }
                        // Fallback to first pricing if no match or no variant
                        if (!pricingId) {
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
                const loaded = await loadRazorpay();
                if (!loaded) {
                    toast({ variant: "destructive", description: "Failed to load payment gateway. Please check your internet connection." });
                    return;
                }

                const options = {
                    key: response.razorpayKeyId,
                    amount: response.amountInPaise,
                    currency: response.currency,
                    name: companyDetails?.companyName,
                    description: "Order Payment",
                    order_id: response.razorpayOrderId,
                    handler: async function (response: any) {
                        try {
                            const verifyRes = await orderService.verifyPayment({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            });

                            if (verifyRes.status === 'success') {
                                toast({
                                    title: "Payment Successful ✅",
                                    description: `Order Confirmed! Order ID: ${verifyRes.orderId || 'N/A'}`,
                                    className: "bg-green-50 border-green-200 text-green-800",
                                    duration: 5000
                                });

                                // Clear cart and close
                                clearCart();
                                setCartOpen(false);
                                setView('cart');

                                // Reset state
                                setContactInfo({ name: '', email: '', mobile: '' });
                                setSelectedAddressId(null);

                            } else {
                                toast({
                                    variant: "destructive",
                                    title: "Verification Failed ❌",
                                    description: verifyRes.message || "Payment verification failed."
                                });
                            }
                        } catch (err) {
                            console.error("Verification Error", err);
                            toast({
                                variant: "destructive",
                                title: "Error ❌",
                                description: "Failed to verify payment."
                            });
                        }
                    },
                    prefill: {
                        name: contactInfo.name,
                        email: contactInfo.email,
                        contact: contactInfo.mobile
                    },
                    theme: {
                        color: theme?.colors?.primary || "#3399cc"
                    },
                    modal: {
                        ondismiss: function () {
                            setIsInitializingPayment(false);
                            toast({ description: "Payment cancelled" });
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
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
            const { customerService } = await import('@/services/customer.service');
            const customerData = await customerService.getCustomerDetails();

            if (!customerData) {
                toast({ variant: "destructive", description: "Could not fetch user details. Please try again." });
                return;
            }

            // 2. Validate Company Details (Frontend Validation 1)
            const freshCompanyDetails = await fetchCompanyDetails(companyDetails!.companyDomain);
            if (!freshCompanyDetails) {
                toast({ variant: "destructive", description: "Failed to validate company details. Please try again." });
                return;
            }

            // 3. Construct Payload (Direct Mapping 1-to-1)
            const validationPayload: CheckoutValidationItem[] = cart.map(item => {
                let sizeId: number | null = null;
                if (item.pricing && item.pricing.length > 0) {
                    const quantityVariant = item.selectedVariants['Quantity'];
                    if (quantityVariant) {
                        const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                        if (matchedPricing) sizeId = parseInt(matchedPricing.id);
                    }
                    if (!sizeId && item.pricing.length > 0) sizeId = parseInt(item.pricing[0].id);
                }

                const productColourId = item.selectedColour?.id;

                return {
                    productId: parseInt(item.id),
                    sizeId: sizeId,
                    productColourId: productColourId ? parseInt(productColourId) : null,
                    multipleSetDiscount: item.multipleSetDiscount,
                    multipleDiscountMoreThan: item.multipleDiscountMoreThan,
                    productOffer: item.productOffer,
                    productAddonIds: item.selectedAddons ? item.selectedAddons.map(a => a.id).join(',') : ""
                };
            });

            // 4. Call Validation API
            const response = await validateCheckout({ items: validationPayload });

            if (!response) {
                toast({ variant: "destructive", description: "Validation failed. Please try again." });
                return;
            }

            // 5. Compare and Validate
            let blockingChanges = false;
            interface ValidationMessage {
                message: string;
                cartItemId?: string;
            }
            const changes: ValidationMessage[] = [];
            const uniqueMessages = new Set<string>();

            const pushChange = (msg: string, cartItemId?: string) => {
                if (!uniqueMessages.has(msg)) {
                    uniqueMessages.add(msg);
                    changes.push({ message: msg, cartItemId });
                }
            };

            const newCart = cart.map(item => ({ ...item, selectedAddons: item.selectedAddons ? [...item.selectedAddons] : [] }));

            // Handle wrapped response (server returns { productDetails: [...] }) or direct array
            const details = Array.isArray(response) ? response : ((response as any).productDetails || []);

            // --- PHASE 0: CONFLICT DETECTION (Shared Stock) ---
            const stockGroups = new Map<string, CartItem[]>();
            const stockLimits = new Map<string, { limit: number, name: string }>();

            newCart.forEach((item, index) => {
                const detail = details[index];
                if (!detail) return;

                // Determine Variant/Stock Key
                let sizeId: number | null = null;
                if (item.pricing && item.pricing.length > 0) {
                    const quantityVariant = item.selectedVariants?.['Quantity'];
                    if (quantityVariant) {
                        const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                        if (matchedPricing) sizeId = parseInt(matchedPricing.id);
                    }
                    if (!sizeId && item.pricing.length > 0) sizeId = parseInt(item.pricing[0].id);
                }

                let availableStock = 0;
                let stockKey = "";
                if (sizeId) {
                    availableStock = parseInt(detail.sizeQuantity || '0');
                    stockKey = `${detail.productId}-size-${sizeId}`;
                } else {
                    availableStock = parseInt(detail.productQuantityAvailable || '0');
                    stockKey = `${detail.productId}-master`;
                }
                if (isNaN(availableStock)) availableStock = 0;

                stockLimits.set(stockKey, { limit: availableStock, name: item.name });

                const group = stockGroups.get(stockKey) || [];
                group.push(item);
                stockGroups.set(stockKey, group);
            });

            const currentConflicts: StockConflict[] = [];
            stockGroups.forEach((items, key) => {
                const limitInfo = stockLimits.get(key);
                if (!limitInfo) return;
                const totalRequested = items.reduce((sum, it) => sum + it.quantity, 0);

                // If total demand exceeds limit, this is a conflict the user must resolve manually
                if (totalRequested > limitInfo.limit) {
                    blockingChanges = true;
                    // Create deep copies of items so user can edit them in popup without mutating main cart yet
                    const itemCopies = items.map(i => ({ ...i }));
                    currentConflicts.push({
                        stockKey: key,
                        productName: limitInfo.name,
                        availableStock: limitInfo.limit,
                        items: itemCopies,
                        totalRequested: totalRequested
                    });
                }
            });

            if (currentConflicts.length > 0) {
                setStockConflicts(currentConflicts);
                setShowConflictPopup(true);
                setIsCheckingOut(false);
                return; // HALT VALIDATION. User must resolve conflicts first.
            }

            // --- PHASE 1: STANDARD VALIDATION (If no conflicts) ---
            // Track used stock across iterations to handle duplicate product entries sharing the same stock
            const stockUsageMap = new Map<string, number>();

            newCart.forEach((item, index) => {
                const detail = details[index];
                if (!detail) return;

                // --- 0. IDENTITY CHECK (Data Mismatch) ---
                // Re-derive keys to verify response matches request
                let sizeId: number | null = null;
                if (item.pricing && item.pricing.length > 0) {
                    const quantityVariant = item.selectedVariants?.['Quantity'];
                    if (quantityVariant) {
                        const matchedPricing = item.pricing.find(p => p.quantity === quantityVariant);
                        if (matchedPricing) sizeId = parseInt(matchedPricing.id);
                    }
                    if (!sizeId && item.pricing.length > 0) sizeId = parseInt(item.pricing[0].id);
                }
                const productColourId = item.selectedColour?.id ? parseInt(item.selectedColour.id) : null;

                // Verify IDs match (Server vs Client)
                const isIdMismatch = detail.productId !== parseInt(item.id) ||
                    (detail.sizeId !== undefined && detail.sizeId !== sizeId) ||
                    (detail.productColourId !== undefined && detail.productColourId !== productColourId);

                // Note: detail.sizeId might be null/undefined if not returned by older servers,
                // but user asked us to add it, so valid server should return it.
                // We strictly check if it IS returned.

                if (isIdMismatch) {
                    blockingChanges = true;
                    pushChange(`Critical: Data mismatch for "${item.name}". Please refresh cart.`);
                    return; // Abort further checks for this item
                }

                // Check Colour Name Mismatch (if applicable)
                if (detail.colour && item.selectedColour?.name) {
                    const serverColor = detail.colour.trim().toLowerCase();
                    const cartColor = item.selectedColour.name.trim().toLowerCase();
                    if (serverColor !== cartColor) {
                        blockingChanges = true;
                        pushChange(`Colour mismatch for "${item.name}" (Server: ${detail.colour}, Cart: ${item.selectedColour.name}). Removed.`);
                        item.cartItemId = 'REMOVE_ME';
                        return;
                    }
                }

                // Check Size Name Mismatch (if applicable)
                // item.selectedVariants['Quantity'] holds the size name usually
                if (detail.productSize && item.selectedVariants && item.selectedVariants['Quantity']) {
                    const serverSize = detail.productSize.trim().toLowerCase();
                    const cartSize = item.selectedVariants['Quantity'].trim().toLowerCase();
                    if (serverSize !== cartSize && serverSize !== "" && cartSize !== "") {
                        // Note: Sometimes server might return internal ID or different format, strict check might be risky if backend is inconsistent.
                        // But user requested "check multipleSetDiscount... productSize".
                        // Assuming strict equality is desired for data integrity.
                        blockingChanges = true;
                        pushChange(`Size label mismatch for "${item.name}" (Server: ${detail.productSize}, Cart: ${item.selectedVariants['Quantity']}). Removed.`);
                        item.cartItemId = 'REMOVE_ME';
                        return;
                    }
                }

                // --- 1. DISCOUNT MISMATCHES ---
                const normalizeDiscount = (s: string | null | undefined) => {
                    if (!s) return "";
                    return s.split('&&&').sort().join('&&&');
                };

                const cartSetDiscount = normalizeDiscount(item.multipleSetDiscount);
                const serverSetDiscount = normalizeDiscount(detail.multipleSetDiscount);

                // Helper: Check if current total quantity qualifies for any part of a rule
                const isUsingRule = (rule: string, qty: number) => {
                    if (!rule || qty <= 0) return false;
                    const segments = rule.split('&&&');
                    for (const seg of segments) {
                        const [thresholdStr] = seg.split('-');
                        const threshold = parseFloat(thresholdStr);
                        // If threshold is valid and we have enough qty (inclusive or exclusive depending on logic, usually inclusive like "Buy 3")
                        if (!isNaN(threshold) && qty >= threshold) {
                            return true;
                        }
                    }
                    return false;
                };

                const totalQty = productQuantities[item.id] || item.quantity;

                // Helper: Get description of the BEST rule currently active
                const getActiveRuleDescription = (rule: string, qty: number) => {
                    if (!rule || qty <= 0) return null;
                    const segments = rule.split('&&&');
                    let bestParams: { t: number, p: number } | null = null;

                    for (const seg of segments) {
                        const [thresholdStr, percentStr] = seg.split('-');
                        const threshold = parseFloat(thresholdStr);
                        const percent = parseFloat(percentStr);
                        if (!isNaN(threshold) && !isNaN(percent) && qty >= threshold) {
                            // We assume the one with HIGHEST threshold is the "active" one (or most relevant)
                            if (!bestParams || threshold > bestParams.t) {
                                bestParams = { t: threshold, p: percent };
                            }
                        }
                    }
                    if (bestParams) {
                        return `Buy ${bestParams.t} Get ${bestParams.p}% Off`;
                    }
                    return null;
                };

                if (cartSetDiscount !== serverSetDiscount) {
                    const activeRuleDesc = getActiveRuleDescription(item.multipleSetDiscount, totalQty);
                    const newActiveRuleDesc = getActiveRuleDescription(detail.multipleSetDiscount, totalQty);

                    // Only blocking notify if we were using it OR will start using it (if price changes drastically?)
                    // User request: "notify when changes only if cart is using that bulk discount"
                    // Strictly: If I WAS using it.
                    if (activeRuleDesc) { // implied wasUsing because returns non-null
                        // If the benefit is IDENTICAL, do not show error
                        if (activeRuleDesc === newActiveRuleDesc) {
                            // Do nothing, just update the string silently
                        } else {
                            blockingChanges = true;
                            if (!serverSetDiscount || !newActiveRuleDesc) {
                                pushChange(`Selected discount (${activeRuleDesc}) is removed.`, item.cartItemId);
                            } else {
                                // It changed to something else
                                pushChange(`Selected discount (${activeRuleDesc}) is removed.`, item.cartItemId);
                            }
                        }
                    }
                    item.multipleSetDiscount = detail.multipleSetDiscount;
                }

                const cartMoreThan = (item.multipleDiscountMoreThan || "").trim();
                const serverMoreThan = (detail.multipleDiscountMoreThan || "").trim();

                // Helper for MoreThan (Format: "Qty-Percent" e.g. "6-20") => "More than 6" usually means > 6
                const isUsingMoreThan = (rule: string, qty: number) => {
                    if (!rule || qty <= 0) return false;
                    const [thresholdStr] = rule.split('-');
                    const threshold = parseFloat(thresholdStr);
                    // "More Than" usually implies strict greater than, but let's match common logic (often inclusive in casual terms, but user code said >)
                    return !isNaN(threshold) && qty > threshold;
                };

                if (cartMoreThan !== serverMoreThan) {
                    const wasUsing = isUsingMoreThan(item.multipleDiscountMoreThan, totalQty);

                    if (wasUsing) {
                        blockingChanges = true;
                        if (!serverMoreThan) {
                            pushChange(`Special bulk offer for "${item.name}" has been removed.`, item.cartItemId);
                        } else {
                            pushChange(`Special bulk offer for "${item.name}" has been updated.`, item.cartItemId);
                        }
                    }
                    item.multipleDiscountMoreThan = detail.multipleDiscountMoreThan;
                }

                // --- 2. OFFER CHECK ---
                if (item.productOffer !== detail.productOffer) {
                    const oldOffer = item.productOffer;
                    item.productOffer = detail.productOffer;
                    if (oldOffer !== detail.productOffer) {
                        blockingChanges = true;
                        if (!detail.productOffer) {
                            pushChange(`Sorry, the offer for "${item.name}" has expired.`, item.cartItemId);
                        } else {
                            pushChange(`Offer for "${item.name}" updated: ${detail.productOffer}`, item.cartItemId);
                        }
                    }
                }

                // --- 3. STATUS CHECKS ---
                // Product Status
                if (detail.productStatus !== 'ACTIVE') {
                    blockingChanges = true;
                    pushChange(`"${item.name}" is currently unavailable (Product Inactive) and has been removed.`);
                    item.cartItemId = 'REMOVE_ME';
                    return;
                }

                // Size Status (if applicable)
                if (sizeId && detail.sizeStatus && detail.sizeStatus !== 'ACTIVE') {
                    blockingChanges = true;
                    pushChange(`"${item.name}" (${item.selectedVariants['Quantity']}) is currently unavailable and has been removed.`);
                    item.cartItemId = 'REMOVE_ME';
                    return;
                }

                // Colour Status (if applicable)
                if (item.selectedColour && detail.colourStatus && detail.colourStatus !== 'ACTIVE') {
                    blockingChanges = true;
                    pushChange(`"${item.name}" (${item.selectedColour.name}) is currently unavailable and has been removed.`);
                    item.cartItemId = 'REMOVE_ME';
                    return;
                }

                // --- 4. STOCK CHECKS ---
                let availableStock = 0;
                let stockKey = "";

                if (sizeId) {
                    // Sized Item: Stock depends on specific Variant
                    availableStock = parseInt(detail.sizeQuantity || '0');
                    stockKey = `${detail.productId}-size-${sizeId}`;
                } else {
                    // Non-Sized Item: Stock depends on Master Product
                    availableStock = parseInt(detail.productQuantityAvailable || '0');
                    stockKey = `${detail.productId}-master`;
                }

                if (isNaN(availableStock)) availableStock = 0;

                // SHARED STOCK TRACKING
                // 1. How much of this specific stock pool has already been used by previous items in this loop?
                const alreadyConsumed = stockUsageMap.get(stockKey) || 0;

                // 2. How much is left for *this* item?
                const remainingStockForThisItem = availableStock - alreadyConsumed;

                if (item.quantity > remainingStockForThisItem) {
                    blockingChanges = true;
                    if (remainingStockForThisItem <= 0) {
                        // No stock left at all for this item (consumed by previous items or just OOS)
                        pushChange(`"${item.name}" is out of stock and has been removed.`);
                        item.cartItemId = 'REMOVE_ME';
                        // Do not increase consumed count if we remove it
                    } else {
                        // Partial stock fits -> Actionable! (Can remove if user wants)
                        pushChange(`"${item.name}" quantity updated. Available Quantity: ${remainingStockForThisItem}.`, item.cartItemId);
                        item.quantity = remainingStockForThisItem;
                        // Mark these as consumed
                        stockUsageMap.set(stockKey, alreadyConsumed + item.quantity);
                    }
                } else {
                    // Fits perfectly, mark as consumed
                    stockUsageMap.set(stockKey, alreadyConsumed + item.quantity);
                }

                if (item.cartItemId === 'REMOVE_ME') return;

                // --- 5. PRICE CHECKS ---
                const isSized = !!sizeId;
                const serverPrice = isSized ? (detail.productSizePrice || 0) : detail.productPrice;

                // Resolve Discount Price
                let resolvedDiscountPrice = isSized ? detail.productSizePriceAfterDiscount : detail.productPriceAfterDiscount;

                // Fallback: If no explicit discount price, check for Percentage Offer
                if ((!resolvedDiscountPrice || resolvedDiscountPrice <= 0) && detail.productOffer) {
                    const match = detail.productOffer.match(/(\d+)\s*%?|(\d+)\s*OFF/i);
                    if (match) {
                        const percent = parseFloat(match[1] || match[2]);
                        if (!isNaN(percent)) {
                            const discountVal = (serverPrice * percent) / 100;
                            resolvedDiscountPrice = Math.round(serverPrice - discountVal);
                        }
                    }
                }

                // If still no valid resolved price, assume it's just the server price
                if (!resolvedDiscountPrice || resolvedDiscountPrice <= 0) {
                    resolvedDiscountPrice = serverPrice;
                }

                // Is there a mismatch?
                if (item.price !== resolvedDiscountPrice) {
                    blockingChanges = true;
                    pushChange(`Price for "${item.name}" updated from ₹${item.price} to ₹${resolvedDiscountPrice}.`, item.cartItemId);
                    item.price = resolvedDiscountPrice;
                }

                // --- 6. ADDON CHECKS ---
                if (item.selectedAddons && item.selectedAddons.length > 0) {
                    // Parse server addons: ["id:price", "1:20"]
                    const serverAddonsMap = new Map<string, number>();
                    if (detail.addonAndAddonPrice && Array.isArray(detail.addonAndAddonPrice)) {
                        detail.addonAndAddonPrice.forEach(str => {
                            const parts = str.split(':');
                            if (parts.length >= 2) {
                                const idStr = parts[0];
                                const priceStr = parts[parts.length - 1]; // Handle cases where ID might have :
                                serverAddonsMap.set(idStr.toString(), parseFloat(priceStr));
                            }
                        });
                    }

                    // Iterate cart addons
                    const validAddons: typeof item.selectedAddons = [];
                    let addonPriceChanged = false;

                    item.selectedAddons.forEach(addon => {
                        const serverPrice = serverAddonsMap.get(addon.id.toString());
                        if (serverPrice !== undefined) {
                            // Addon exists, check price
                            if (serverPrice !== addon.price) {
                                addonPriceChanged = true;
                                addon.price = serverPrice; // Update price in place
                            }
                            validAddons.push(addon);
                        } else {
                            // Addon no longer exists on server (removed)
                            blockingChanges = true;
                            pushChange(`Addon "${addon.name}" for "${item.name}" is no longer available and has been removed.`, item.cartItemId);
                        }
                    });

                    if (validAddons.length !== item.selectedAddons.length) {
                        item.selectedAddons = validAddons;
                    }

                    if (addonPriceChanged) {
                        blockingChanges = true;
                        pushChange(`Addon prices for "${item.name}" have been updated.`, item.cartItemId);
                    }
                }
            });
            const finalCart = newCart.filter(item => item.cartItemId !== 'REMOVE_ME');

            // Always update cart to reflect latest server data (silent updates included)
            useCart.setState({ cart: finalCart });

            if (blockingChanges && changes.length > 0) {
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

                {/* Stock Conflict Resolution Popup */}
                {showConflictPopup && stockConflicts.length > 0 && (
                    <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-background w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 slide-in-from-bottom-5">
                            <div className="bg-rose-500/10 p-6 flex flex-col items-center text-center border-b border-rose-500/20">
                                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-3 text-rose-600 dark:text-rose-500 shadow-inner">
                                    <AlertTriangle className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground tracking-tight">Stock Limit Exceeded</h3>
                                <p className="text-sm text-muted-foreground mt-2 px-4 leading-relaxed">
                                    You have requested more items than are currently available. Please adjust quantities below.
                                </p>
                            </div>

                            <ScrollArea className="max-h-[60vh]">
                                <div className="p-6 space-y-8">
                                    {stockConflicts.map((conflict, idx) => {
                                        const totalSelected = conflict.items.reduce((sum, i) => sum + i.quantity, 0);
                                        const isOverLimit = totalSelected > conflict.availableStock;

                                        return (
                                            <div key={idx} className="space-y-4">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <h4 className="font-bold text-base">{conflict.productName}</h4>
                                                    <Badge variant={isOverLimit ? "destructive" : "secondary"} className="text-xs">
                                                        Limit: {conflict.availableStock}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-3">
                                                    {conflict.items.map((item) => (
                                                        <div key={item.cartItemId} className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{item.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {item.selectedVariants?.['Quantity'] || item.selectedColour?.name || "Standard Identity"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-3 bg-background rounded-lg p-1 border shadow-sm">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-md"
                                                                    onClick={() => {
                                                                        const updatedItems = [...conflict.items];
                                                                        const target = updatedItems.find(i => i.cartItemId === item.cartItemId);
                                                                        if (target && target.quantity > 0) target.quantity--;

                                                                        const newConflicts = [...stockConflicts];
                                                                        newConflicts[idx].items = updatedItems;
                                                                        setStockConflicts(newConflicts);
                                                                    }}
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </Button>
                                                                <span className={`text-sm font-bold w-4 text-center ${item.quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                                    {item.quantity}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-md"
                                                                    onClick={() => {
                                                                        const updatedItems = [...conflict.items];
                                                                        const target = updatedItems.find(i => i.cartItemId === item.cartItemId);
                                                                        if (target) target.quantity++;

                                                                        const newConflicts = [...stockConflicts];
                                                                        newConflicts[idx].items = updatedItems;
                                                                        setStockConflicts(newConflicts);
                                                                    }}
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-between items-center text-sm font-medium pt-2">
                                                    <span className="text-muted-foreground">Total Selected:</span>
                                                    <span className={isOverLimit ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                                                        {totalSelected} / {conflict.availableStock}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                            <div className="p-6 pt-0 bg-background/50 backdrop-blur-sm">
                                <Button
                                    className="w-full h-11 rounded-xl font-bold shadow-lg"
                                    disabled={stockConflicts.some(c => c.items.reduce((s, i) => s + i.quantity, 0) > c.availableStock)}
                                    onClick={() => {
                                        // Apply Resolved Changes to Main Cart
                                        const resolvedMap = new Map<string, number>();
                                        stockConflicts.forEach(c => {
                                            c.items.forEach(i => resolvedMap.set(i.cartItemId, i.quantity));
                                        });

                                        const updatedCart = cart.map(item => {
                                            if (resolvedMap.has(item.cartItemId)) {
                                                const newQty = resolvedMap.get(item.cartItemId)!;
                                                return { ...item, quantity: newQty };
                                            }
                                            return item;
                                        }).filter(i => i.quantity > 0);

                                        useCart.setState({ cart: updatedCart });
                                        setStockConflicts([]);
                                        setShowConflictPopup(false);
                                        // Ideally, trigger checkout again or let user review
                                    }}
                                >
                                    Update Cart & Continue
                                </Button>
                            </div>
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
                                <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="text-sm border-l-2 border-amber-500 pl-3 py-1 text-muted-foreground flex items-start justify-between gap-2 bg-amber-50/50 dark:bg-amber-950/10 rounded-r-md">
                                            <span className="leading-snug">{err.message}</span>

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
                                        // Set flag to reopen cart after login
                                        if (typeof window !== 'undefined') {
                                            sessionStorage.setItem('loginRedirect', 'cart');
                                        }
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
                                    {
                                        Array.from(new Set(cart.map(item => item.id))).sort((a, b) => a.localeCompare(b)).map((productId, productIndex) => {
                                            const groupItems = cart.filter(item => item.id === productId);
                                            // Get product-level info from the first item (since they are variants of same product)
                                            const representativeItem = groupItems[0];
                                            const ruleKey = productRules[productId] || "";
                                            const moreThanRule = representativeItem.multipleDiscountMoreThan || "";
                                            const totalQty = productQuantities[productId.toString()] || 0;

                                            // --- Upsell Calculation (Compact) ---
                                            let upsellNode: React.ReactNode = null;

                                            // 1. Gather Tiers
                                            const allTiers: { threshold: number, percent: number }[] = [];
                                            if (ruleKey) {
                                                ruleKey.split('&&&').forEach(seg => {
                                                    const [t, p] = seg.split('-');
                                                    if (t && p) allTiers.push({ threshold: parseFloat(t), percent: parseFloat(p) });
                                                });
                                            }
                                            if (moreThanRule) {
                                                const [t, p] = moreThanRule.split('-');
                                                if (t && p) {
                                                    // "More than 6" -> Needs 7.
                                                    allTiers.push({ threshold: parseFloat(t) + 1, percent: parseFloat(p) });
                                                }
                                            }

                                            // 2. Find Next Best Option
                                            const potentialUpsell = allTiers
                                                .filter(t => t.threshold > totalQty)
                                                .sort((a, b) => a.threshold - b.threshold)[0];

                                            if (potentialUpsell) {
                                                const needed = potentialUpsell.threshold - totalQty;
                                                upsellNode = (
                                                    <div className="mt-2 animate-in slide-in-from-bottom-2 duration-500">
                                                        <div className="group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 cursor-default mx-auto w-fit">
                                                            <Tag className="w-4 h-4 text-white fill-white/20" />
                                                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                                                                Add {needed} more to get {potentialUpsell.percent}% Off
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <li key={`group-${productId}`} className="bg-card border border-border/40 rounded-xl p-3 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${productIndex * 50}ms` }}>
                                                    {/* Product Items List (Grouped) */}
                                                    <div className="space-y-4">
                                                        {groupItems.map((item, itemIndex) => {
                                                            const isNew = lastAddedItemId === item.cartItemId;

                                                            // Calculate Rendered Discount for this specific line item
                                                            // We must replicate the greedy distribution logic to show accurate split:
                                                            // Re-running localized greedy calc:
                                                            const distribution = productDiscounts[item.id] || [];

                                                            // Find local offset among same-product items in the cart (using groupItems order)
                                                            const prevInGroup = groupItems.slice(0, itemIndex).reduce((acc, i) => acc + i.quantity, 0);
                                                            let itemDiscounts = distribution.slice(prevInGroup, prevInGroup + item.quantity);
                                                            while (itemDiscounts.length < item.quantity) itemDiscounts.push(0);

                                                            // Group by Discount Percentage
                                                            const groups: Record<number, number> = {};
                                                            itemDiscounts.forEach(d => groups[d] = (groups[d] || 0) + 1);
                                                            const distinctDiscounts = Object.keys(groups).map(Number).sort((a, b) => b - a);

                                                            return distinctDiscounts.map((discountPercent, dIdx) => {
                                                                const qty = groups[discountPercent];
                                                                const isDiscounted = discountPercent > 0;
                                                                const basePrice = item.priceAfterDiscount || item.price;
                                                                // Note: we don't have item-specific addons easily here if splitting variants.
                                                                // Actually item is the cart item. Addons are on the item.
                                                                const addonsCost = item.selectedAddons?.reduce((acc, a) => acc + a.price, 0) || 0;
                                                                const singleItemTotal = basePrice + addonsCost;
                                                                const finalTotal = singleItemTotal * qty * (1 - discountPercent / 100);

                                                                return (
                                                                    <div key={`${item.cartItemId}-${discountPercent}`} className={cn("relative group/item flex gap-4", isNew && "ring-2 ring-primary/20 rounded-xl p-2 -m-2 bg-primary/5 transition-all duration-1000")}>
                                                                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-secondary/30">
                                                                            <Image
                                                                                src={item.selectedColour?.image || (item.images && item.images.length > 0 ? item.images[0] : item.imageUrl)}
                                                                                alt={item.name}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        </div>

                                                                        <div className="flex flex-1 flex-col justify-between py-0.5">
                                                                            <div className="flex justify-between items-start gap-2">
                                                                                <div className="space-y-1">
                                                                                    <Link href={`/product/${item.id}`} className="font-bold text-sm leading-tight hover:text-primary line-clamp-2">
                                                                                        {item.name}
                                                                                    </Link>
                                                                                    {(item.selectedVariants || item.selectedAddons) && (
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {Object.values(item.selectedVariants || {}).map((v, i) => (
                                                                                                <span key={i} className="text-[10px] uppercase font-medium text-muted-foreground">{v}</span>
                                                                                            ))}
                                                                                            {item.selectedAddons?.map((addon) => (
                                                                                                <span key={addon.id} className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded">+{addon.name}</span>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isDiscounted ? (
                                                                                        <div className="flex flex-col items-end">
                                                                                            <span className="text-[10px] text-muted-foreground line-through">₹{(singleItemTotal * qty).toFixed(0)}</span>
                                                                                            <span className="font-bold text-sm text-emerald-600">₹{finalTotal.toFixed(0)}</span>
                                                                                            <span className="text-[9px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-sm shadow-sm mt-0.5">
                                                                                                {discountPercent}% OFF
                                                                                            </span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="font-bold text-sm">₹{finalTotal.toFixed(0)}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center justify-between mt-2">
                                                                                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/50 h-7">
                                                                                    <Button variant="ghost" className="h-6 w-6 rounded-md hover:bg-white p-0"
                                                                                        onClick={() => updateQuantity(item.cartItemId, Math.max(0, item.quantity - 1))}>
                                                                                        <Minus className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <span className="w-6 text-center text-xs font-bold tabular-nums">{qty}</span>
                                                                                    <Button variant="ghost" className="h-6 w-6 rounded-md hover:bg-white p-0"
                                                                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                                                                                        <Plus className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => {
                                                                                    if (qty < item.quantity) {
                                                                                        updateQuantity(item.cartItemId, Math.max(0, item.quantity - qty));
                                                                                    } else {
                                                                                        setItemToDelete(item.cartItemId);
                                                                                    }
                                                                                }}>
                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })}
                                                    </div>

                                                    {/* Compact Upsell Nudge (Bottom of Group) */}
                                                    {upsellNode}
                                                </li>
                                            );
                                        })
                                    }
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
                                                    <Label htmlFor="cName">
                                                        Full Name <span className="text-destructive">*</span>
                                                    </Label>
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
                                                    <Label htmlFor="cEmail">
                                                        Email Address <span className="text-destructive">*</span>
                                                    </Label>
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
                                                    {[...addresses].sort((a, b) => a.customerAddressId === selectedAddressId ? -1 : b.customerAddressId === selectedAddressId ? 1 : 0).map((addr) => {
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

                                        <div className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur pb-6 mt-auto border-t">
                                            <Button
                                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all bg-gradient-to-r from-primary to-primary/90"
                                                disabled={!selectedAddressId}
                                                onClick={async () => {
                                                    if (!contactInfo.name || !contactInfo.email) {
                                                        toast({
                                                            variant: "destructive",
                                                            title: "Missing Details",
                                                            description: "Please enter your Full Name and Email Address."
                                                        });
                                                        return;
                                                    }

                                                    // Update customer details if changed
                                                    if (customer && (
                                                        contactInfo.name !== customer.customerName ||
                                                        contactInfo.email !== customer.customerEmailId ||
                                                        contactInfo.mobile !== customer.customerMobileNumber
                                                    )) {
                                                        try {
                                                            const updatedCustomer = await customerService.updateCustomer({
                                                                customerId: customer.customerId,
                                                                companyId: customer.companyId || companyDetails?.companyId || '',
                                                                customerName: contactInfo.name,
                                                                customerEmailId: contactInfo.email,
                                                                customerMobileNumber: contactInfo.mobile,
                                                                customerStatus: customer.customerStatus,
                                                                createdAt: customer.createdAt,
                                                                customerImage: customer.customerImage
                                                            });

                                                            // Update local state without fetching
                                                            if (updatedCustomer) {
                                                                setCustomer(updatedCustomer);
                                                                // Notify other components with the NEW data
                                                                window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedCustomer }));
                                                                toast({ description: "Profile details updated." });
                                                            }
                                                        } catch (error) {
                                                            console.error("Failed to update profile", error);
                                                            // We continue anyway so they can pay? Or stop? 
                                                            // Let's continue but warn? Or maybe just log. User wants update, so best to try.
                                                        }
                                                    }

                                                    setView('payment');
                                                }}
                                            >
                                                Proceed to Payment <ArrowRight className="w-5 h-5 ml-2 Group-hover:translate-x-1 transition-transform" />
                                            </Button>
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
                                                    {[
                                                        { id: 'Home', icon: Home, label: 'Home' },
                                                        { id: 'Work', icon: Briefcase, label: 'Work' },
                                                        { id: 'Other', icon: MapPin, label: 'Other' }
                                                    ].map((type) => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => handleLabelChange(type.id as any)}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 text-sm font-medium",
                                                                addressLabel === type.id
                                                                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                                                                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-200 hover:bg-teal-50"
                                                            )}
                                                        >
                                                            <type.icon className={cn("w-4 h-4", addressLabel === type.id ? "text-white" : "text-slate-400")} />
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {addressLabel === 'Other' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-2 relative">
                                                        <Label htmlFor="customName" className="sr-only">Custom Name</Label>
                                                        <Input
                                                            id="customName"
                                                            placeholder="e.g. Grandma's House, My Office"
                                                            className="h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all rounded-xl"
                                                            value={newAddress.addressName === 'Other' ? '' : newAddress.addressName}
                                                            onChange={(e) => setNewAddress({ ...newAddress, addressName: e.target.value })}
                                                            autoFocus
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="road">Street Address</Label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                        <textarea
                                                            id="road"
                                                            placeholder="e.g. 123 Main St, Apt 4B"
                                                            className="w-full min-h-[80px] pl-10 pt-3 rounded-xl border-transparent bg-secondary/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:bg-background focus:border-input"
                                                            value={newAddress.customerRoad}
                                                            onChange={e => setNewAddress({ ...newAddress, customerRoad: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="pincode">Pincode</Label>
                                                        <Input
                                                            id="pincode"
                                                            placeholder="560001"
                                                            value={newAddress.customerPin}
                                                            onChange={e => handlePincodeChange(e.target.value)}
                                                            className="bg-secondary/20 border-transparent focus:bg-background focus:border-input rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="city">City</Label>
                                                        <Input
                                                            id="city"
                                                            placeholder="City"
                                                            value={newAddress.customerCity}
                                                            readOnly
                                                            className="bg-secondary/10 border-transparent text-muted-foreground cursor-not-allowed rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="state">State</Label>
                                                    <Input
                                                        id="state"
                                                        placeholder="State"
                                                        value={newAddress.customerState}
                                                        readOnly
                                                        className="bg-secondary/10 border-transparent text-muted-foreground cursor-not-allowed rounded-xl"
                                                    />
                                                </div>

                                            </div>
                                        </div>

                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-xs font-medium leading-relaxed border border-blue-100 flex gap-3">
                                            <div className="bg-blue-100 p-1.5 rounded-full h-fit">
                                                <Info className="w-4 h-4" />
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

                        {/* Footer for Address View (Select Address) REMOVED - Moved inside scroll area with validation */}

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
