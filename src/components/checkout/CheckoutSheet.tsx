"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MapPin,
    Plus,
    Check,
    CreditCard,
    ArrowRight,
    Loader2,
    Home,
    Briefcase,
    Building2,
    Trash2,
    ChevronRight,
    ShoppingBag
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { customerService } from '@/services/customer.service';
import { CustomerDetails, CustomerAddress } from '@/lib/api-types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useRazorpay } from '@/hooks/use-razorpay';
import { orderService } from '@/services/order.service';

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export function CheckoutSheet({ children }: { children: React.ReactNode }) {
    const { cart, getCartTotal, companyDetails, clearCart } = useCart();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { isLoaded: isRazorpayLoaded, loadRazorpay } = useRazorpay();

    // Data State
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

    // UI State
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [view, setView] = useState<'list' | 'add'>('list');
    const [processingPayment, setProcessingPayment] = useState(false);

    // Form State
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

    // Initial Load
    useEffect(() => {
        if (open) {
            loadCustomerData();
        }
    }, [open]);

    const loadCustomerData = async () => {
        setLoading(true);
        try {
            const data = await customerService.getCustomerDetails(true); // force refresh
            if (data) {
                setCustomer(data);
                setAddresses(data.customerAddress || []);
                // Auto-select first address if none selected
                if (!selectedAddressId && data.customerAddress?.length > 0) {
                    setSelectedAddressId(data.customerAddress[0].customerAddressId);
                }
            }
        } catch (error) {
            toast({ variant: "destructive", description: "Failed to load addresses." });
        } finally {
            setLoading(false);
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

    const handlePayment = async () => {
        if (!selectedAddress || !customer || !companyDetails) {
            toast({ variant: "destructive", description: "Missing details." });
            return;
        }

        const loaded = await loadRazorpay();
        if (!loaded) {
            toast({ variant: "destructive", description: "Payment gateway not loaded. Please ensure you are online." });
            return;
        }

        setProcessingPayment(true);
        try {
            // 1. Initialize Payment
            const subtotal = getCartTotal();
            const minOrder = parseFloat(companyDetails.minimumOrderCost || '0');
            const freeDeliveryThreshold = parseFloat(companyDetails.freeDeliveryCost || '0');
            const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
            const shipping = isFreeDelivery ? 0 : 40;
            const total = subtotal + shipping;

            // map cart items to payment initialization items
            const paymentItems = cart.map(item => ({
                productId: Number(item.id),
                pricingId: item.productSizeId ? parseInt(item.productSizeId) : null,
                productSizeColourId: item.productSizeColourId ? parseInt(item.productSizeColourId) : null,
                quantity: item.quantity
            }));

            const initData = {
                customerName: customer.customerName,
                customerPhoneNumber: customer.customerMobileNumber,
                customerEmailId: customer.customerEmailId,
                domainName: companyDetails.companyDomain || window.location.hostname,
                customerAddress: `${selectedAddress.customerDrNum}, ${selectedAddress.customerRoad}`,
                customerCity: selectedAddress.customerCity,
                customerState: selectedAddress.customerState,
                customerCountry: selectedAddress.customerCountry,
                addressName: selectedAddress.addressName,
                shipmentAmount: shipping,
                discount: "0",
                discountName: "",
                discountAmount: 0,
                totalCost: total,
                paymentMethod: "RAZORPAY",
                customerNote: "",
                items: paymentItems
            };

            const initResponse = await orderService.initializePayment(
                initData,
                companyDetails.razorpayKeyId,
                companyDetails.razorpayKeySecret
            );

            if (!initResponse || !initResponse.razorpayOrderId) {
                throw new Error("Failed to initialize payment.");
            }

            // 2. Open Razorpay
            const options = {
                key: initResponse.razorpayKeyId,
                amount: initResponse.amountInPaise,
                currency: initResponse.currency,
                name: companyDetails.companyName,
                description: "Order Payment",
                order_id: initResponse.razorpayOrderId,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await orderService.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });

                        if (verifyRes.status === 'success') {
                            toast({
                                title: "Payment Successful ✅",
                                description: `Order Confirmed! Order ID: ${verifyRes.orderId || 'N/A'}`,
                                className: "bg-green-50 border-green-200 text-green-800"
                            });

                            // Clear cart and close
                            /* useCart needs to be accessed outside or via hook capability inside callback? 
                               Actually simplest is to trigger a state change or an event, but since we are inside a function component 
                               we can't easily access the updated hook state inside the callback if it was stale. 
                               However, standard function refs or just calling a function passed from component scope usually works if component is mounted.
                            */
                            // We need to access the clearCart function from the hook which captures it in closure.
                            // But wait, getCartTotal and others are from useCart().
                            // I need to destructure clearCart from useCart() at top level.

                            // Since I can't edit top level in this block efficiently, I'll rely on a subsequent edit or do a multi-edit.
                            // Wait, I can just assume I will add `clearCart` to destructuring in next step or now.
                            // I'll add `clearCart` to destructuring `const { cart, getCartTotal, companyDetails, clearCart } = useCart();` first.
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
                    name: customer.customerName,
                    email: customer.customerEmailId,
                    contact: customer.customerMobileNumber
                },
                theme: {
                    color: companyDetails.theme?.colors?.primary || "#3399cc"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment Error", error);
            toast({ variant: "destructive", description: "Payment initialization failed." });
        } finally {
            setProcessingPayment(false);
        }
    };

    // Derived Logic
    const subtotal = getCartTotal();
    const minOrder = parseFloat(companyDetails?.minimumOrderCost || '0');
    const freeDeliveryThreshold = parseFloat(companyDetails?.freeDeliveryCost || '0');
    const isFreeDelivery = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
    const shipping = isFreeDelivery ? 0 : 40; // Default shipping if not free
    const total = subtotal + shipping;

    const selectedAddress = addresses.find(a => a.customerAddressId === selectedAddressId);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg h-[100dvh] p-0 flex flex-col bg-background/95 backdrop-blur-xl gap-0 border-l border-border/40 shadow-2xl">

                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        {view === 'add' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 h-8 w-8 rounded-full"
                                onClick={() => setView('list')}
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </Button>
                        )}
                        <SheetTitle className="text-xl font-bold font-headline flex items-center gap-2">
                            {view === 'add' ? 'Add New Address' : 'Select Delivery Address'}
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 bg-secondary/10">
                    <div className="p-6 space-y-8">

                        {/* View: Address List */}
                        {view === 'list' && (
                            <>
                                {/* Saved Addresses Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Saved Addresses</h3>

                                    {loading ? (
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
                                            <p className="text-sm text-muted-foreground mb-4">Add a delivery address to verify service availability.</p>
                                            <Button onClick={() => setView('add')} variant="secondary" className="rounded-full">
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
                                                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                            SELECTED
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                                    {addr.customerDrNum}, {addr.customerRoad}, {addr.customerCity} - {addr.customerPin}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Selection Ring Animation */}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 border-2 border-primary rounded-2xl animate-in zoom-in-95 duration-200 pointer-events-none" />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Add New Button */}
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

                                {/* Mini Order Summary */}
                                <div className="space-y-4 pt-4 border-t border-border/40">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Cart Summary</h3>
                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{cart.length} items</span>
                                    </div>

                                    <div className="bg-background rounded-2xl border border-border/60 p-5 space-y-4 shadow-sm">
                                        <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
                                            {cart.slice(0, 5).map((item, i) => (
                                                <div key={item.cartItemId} className="relative w-10 h-10 rounded-full border-2 border-background shadow-sm overflow-hidden bg-gray-100 z-[5] hover:z-10 hover:scale-110 transition-transform">
                                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {cart.length > 5 && (
                                                <div className="relative w-10 h-10 rounded-full border-2 border-background bg-secondary text-xs font-bold flex items-center justify-center text-muted-foreground z-0">
                                                    +{cart.length - 5}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm pt-2">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Subtotal</span>
                                                <span>₹{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Shipping</span>
                                                {isFreeDelivery ? (
                                                    <span className="text-green-600 font-bold">FREE</span>
                                                ) : (
                                                    <span>₹{shipping.toFixed(2)}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-baseline pt-2 border-t border-dashed">
                                                <span className="font-bold text-foreground">Total to Pay</span>
                                                <span className="font-extrabold text-xl text-primary">₹{total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* View: Add Address Form */}
                        {view === 'add' && (
                            <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
                                <div className="space-y-4 bg-background p-6 rounded-3xl border shadow-sm">
                                    <div className="grid gap-2">
                                        <Label htmlFor="tag" className="text-xs font-bold text-muted-foreground uppercase">Address Label</Label>
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
                    </div>
                </ScrollArea>

                {/* Footer - Only show in list view */}
                {view === 'list' && (
                    <div className="p-6 bg-background pt-4 border-t border-border/50 backdrop-blur-md">
                        <Button
                            size="lg"
                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            disabled={!selectedAddress || processingPayment}
                            onClick={handlePayment}
                        >
                            {!selectedAddress ? (
                                "Select an Address"
                            ) : processingPayment ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                                </>
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

            </SheetContent>
        </Sheet>
    );
}
