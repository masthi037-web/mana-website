"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Loader2,
    Calendar as CalendarIcon,
    ClipboardList,
    TrendingUp,
    Package,
    ChevronRight,
    MapPin,
    ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/order.service';
import { useCart } from '@/hooks/use-cart'; // For company details
import { SaveOrderResponse } from '@/lib/api-types';
import { cn } from '@/lib/utils';
import { OrderDetails } from '@/components/history/OrderDetails';

export const CompanyOrdersSheet = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<SaveOrderResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SaveOrderResponse | null>(null);
    const { companyDetails } = useCart();
    const { toast } = useToast();

    // Fetch Orders - Refetch when date range changes
    useEffect(() => {
        if (open && companyDetails?.companyId) {
            fetchOrders();
        }
    }, [open, fromDate, toDate, companyDetails]);

    const fetchOrders = async () => {
        if (!companyDetails?.companyId) return;
        setLoading(true);
        try {
            const data = await orderService.getCompanyOrdersByRange(companyDetails.companyId, fromDate, toDate);
            setOrders(data || []);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast({
                title: "Error fetching orders",
                description: "Could not load relevant data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate Stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotalAmount, 0);
    const totalOrders = orders.length;

    // Reset selection when closing sheet
    useEffect(() => {
        if (!open) setSelectedOrder(null);
    }, [open]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 border-l border-border/40 bg-background/95 backdrop-blur-xl">

                {/* Header (Shared) */}
                <div className="flex flex-col border-b border-border/40 bg-background/50 sticky top-0 z-20">
                    <SheetHeader className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {selectedOrder ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="-ml-2 h-8 w-8 rounded-full"
                                        onClick={() => setSelectedOrder(null)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <SheetTitle className="text-lg font-bold">Order Details</SheetTitle>
                                </div>
                            ) : (
                                <SheetTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    Company Orders
                                </SheetTitle>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Date Picker & Stats (Only in List View) */}
                    {!selectedOrder && (
                        <div className="px-6 pb-4 space-y-4">
                            {/* Date Selector Range */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-0.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">From</span>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="pt-4 h-11 pl-3 font-medium bg-secondary/50 border-transparent focus:bg-background transition-all text-xs"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-0.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">To</span>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            // Optional: validations can be added here
                                            setToDate(newDate);
                                        }}
                                        className="pt-4 h-11 pl-3 font-medium bg-secondary/50 border-transparent focus:bg-background transition-all text-xs"
                                    />
                                </div>
                            </div>

                            {/* Daily Stats Card */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Revenue</span>
                                    <span className="text-xl font-bold text-primary flex items-center gap-1">
                                        ₹{totalRevenue.toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-3 flex flex-col justify-center items-center text-center">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Orders</span>
                                    <span className="text-xl font-bold text-foreground flex items-center gap-1">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        {totalOrders}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="h-[calc(100vh-180px)] overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : selectedOrder ? (
                        // Detail View
                        <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />
                    ) : orders.length > 0 ? (
                        // List View
                        <ScrollArea className="h-full px-6 py-4">
                            <div className="space-y-3 pb-20">
                                {orders.map((order, index) => (
                                    <div
                                        key={order.orderId}
                                        onClick={() => setSelectedOrder(order)}
                                        className={cn(
                                            "group relative bg-card hover:bg-secondary/40 border border-border/40 hover:border-primary/20 rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md",
                                            "animate-in slide-in-from-bottom-2 fade-in fill-mode-backwards"
                                        )}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground">
                                                        #{order.orderNumber}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full",
                                                        order.orderStatus === 'DELIVERED' ? "bg-emerald-100 text-emerald-700" :
                                                            order.orderStatus === 'CANCELLED' ? "bg-red-100 text-red-700" :
                                                                "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {order.orderStatus}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-foreground">{order.customerName}</h3>
                                            </div>
                                            <span className="text-lg font-bold text-primary">
                                                ₹{order.finalTotalAmount}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Package className="h-3.5 w-3.5" />
                                                <span>{order.items.length} Items</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span className="max-w-[120px] truncate">{order.deliveryCity}</span>
                                            </div>
                                        </div>

                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="h-20 w-20 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
                                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">No Orders Found</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                No orders found between {format(new Date(fromDate), "MMM d")} and {format(new Date(toDate), "MMM d")}.
                            </p>
                        </div>
                    )}
                </div>

            </SheetContent>
        </Sheet>
    );
};
