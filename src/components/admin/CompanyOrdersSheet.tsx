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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    ArrowLeft,
    Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/order.service';
import { useCart } from '@/hooks/use-cart'; // For company details
import { SaveOrderResponse } from '@/lib/api-types';
import { cn } from '@/lib/utils';
import { OrderDetails } from '@/components/history/OrderDetails';

export const CompanyOrdersSheet = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [mode, setMode] = useState<'single' | 'range'>('single');
    const [orders, setOrders] = useState<SaveOrderResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SaveOrderResponse | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const { companyDetails } = useCart();
    const { toast } = useToast();

    // Fetch Orders - Refetch when params change
    useEffect(() => {
        if (open && companyDetails?.companyId) {
            fetchOrders();
        }
    }, [open, date, fromDate, toDate, mode, companyDetails]);

    const fetchOrders = async () => {
        if (!companyDetails?.companyId) return;
        setLoading(true);
        try {
            let data;
            if (mode === 'single') {
                data = await orderService.getCompanyOrdersByDate(companyDetails.companyId, date);
            } else {
                data = await orderService.getCompanyOrdersByRange(companyDetails.companyId, fromDate, toDate);
            }
            const sortedData = (data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(sortedData);
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

    // Filter Orders
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
        const matchesSearch = !searchTerm || (order.customerPhone && order.customerPhone.includes(searchTerm));
        return matchesStatus && matchesSearch;
    });

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
                                    {companyDetails?.companyName || 'Company'} Orders
                                </SheetTitle>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Date Controls & Stats (Only in List View) */}
                    {!selectedOrder && (
                        <div className="px-6 pb-4 space-y-4">
                            {/* Mode Switcher */}
                            <div className="flex p-1 bg-secondary/30 rounded-xl border border-secondary/50 relative">
                                <button
                                    onClick={() => setMode('single')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300",
                                        mode === 'single'
                                            ? "bg-background shadow-sm text-primary"
                                            : "text-muted-foreground hover:bg-background/50"
                                    )}
                                >
                                    Single Date
                                </button>
                                <button
                                    onClick={() => setMode('range')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300",
                                        mode === 'range'
                                            ? "bg-background shadow-sm text-primary"
                                            : "text-muted-foreground hover:bg-background/50"
                                    )}
                                >
                                    Date Range
                                </button>
                            </div>

                            {/* Inputs based on Mode */}
                            {mode === 'single' ? (
                                <div className="relative">
                                    <span className="absolute left-3 top-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider z-10">Select Date</span>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="pt-5 h-12 pl-3 font-semibold bg-secondary/50 border-transparent focus:bg-background transition-all"
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 group">
                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 z-20" />
                                        <span className="absolute left-3 top-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider z-10">From</span>
                                        <Input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="pt-5 h-12 pl-3 font-semibold bg-secondary/50 border-transparent focus:bg-background transition-all"
                                        />
                                    </div>
                                    <div className="relative flex-1 group">
                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 z-20" />
                                        <span className="absolute left-3 top-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider z-10">To</span>
                                        <Input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="pt-5 h-12 pl-3 font-semibold bg-secondary/50 border-transparent focus:bg-background transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Search Bar */}
                            <div className="relative">
                                <span className="absolute left-3 top-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider z-10">Search Customer Phone</span>
                                <Input
                                    placeholder="Enter phone number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pt-5 h-12 pl-3 font-semibold bg-secondary/50 border-transparent focus:bg-background transition-all"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <span className="absolute left-3 top-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider z-10">Filter Status</span>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="pt-5 h-12 pl-3 font-semibold bg-secondary/50 border-transparent focus:bg-background transition-all">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Orders</SelectItem>
                                        {['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dashboard Cards (Premium Look) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 relative z-10">Revenue</span>
                                    <span className="text-xl font-headline font-black text-primary flex items-center gap-1 relative z-10">
                                        ₹{totalRevenue.toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-secondary/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest mb-1 relative z-10">Total Orders</span>
                                    <span className="text-xl font-headline font-black text-foreground flex items-center gap-1 relative z-10">
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
                        <OrderDetails
                            order={selectedOrder}
                            onBack={() => setSelectedOrder(null)}
                            onStatusUpdate={async (newStatus) => {
                                try {
                                    const updatedOrderData = await orderService.getOrderById(selectedOrder.orderId);
                                    // Merge updated data but preserve local items as API returns null items
                                    const mergedOrder: SaveOrderResponse = {
                                        ...updatedOrderData,
                                        items: selectedOrder.items
                                    };

                                    setOrders(prev => prev.map(o =>
                                        o.orderId === selectedOrder.orderId ? mergedOrder : o
                                    ));
                                    setSelectedOrder(mergedOrder);
                                } catch (error) {
                                    console.error("Failed to fetch updated order details", error);
                                    // Fallback to local update
                                    const fallbackOrder = { ...selectedOrder, orderStatus: newStatus };
                                    setOrders(prev => prev.map(o =>
                                        o.orderId === selectedOrder.orderId ? fallbackOrder : o
                                    ));
                                    setSelectedOrder(fallbackOrder);
                                }
                            }}
                        />
                    ) : filteredOrders.length > 0 ? (
                        // List View
                        <ScrollArea className="h-full px-6 py-4">
                            <div className="space-y-3 pb-20">
                                {filteredOrders.map((order, index) => (
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
                                {statusFilter !== 'ALL'
                                    ? `No ${statusFilter.toLowerCase()} orders found.`
                                    : `No orders found between ${format(new Date(fromDate), "MMM d")} and ${format(new Date(toDate), "MMM d")}.`
                                }
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
