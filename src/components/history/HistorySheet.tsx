'use client';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, X, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';
import { orderService } from '@/services/order.service';
import { SaveOrderResponse, OrderResponseItem } from '@/lib/api-types';

export function HistorySheet({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [orders, setOrders] = useState<SaveOrderResponse[]>([]);
    const [loading, setLoading] = useState(false);

    // Handle back button on mobile
    useSheetBackHandler(isOpen, setIsOpen);

    // Fetch orders when sheet opens
    useEffect(() => {
        if (isOpen) {
            const fetchHistory = async () => {
                const customerId = localStorage.getItem('customerId');
                if (!customerId) return;

                setLoading(true);
                try {
                    const data = await orderService.getCustomerOrders(customerId);
                    // Sort by newest first (assuming ID or createdAt usually implies order, but createdAt is safely available)
                    // If backend returns date string, parse it.
                    const sorted = (data || []).sort((a, b) => {
                        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return timeB - timeA;
                    });
                    setOrders(sorted);
                } catch (err) {
                    console.error("Failed to fetch history", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
            case 'DELIVERED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'PROCESSING':
            case 'CREATED':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'CANCELLED':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/40 bg-slate-50/50 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-50/50 shadow-2xl [&>button]:hidden">
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <SheetTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900">
                        <div className="relative">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        Order History
                    </SheetTitle>
                    <SheetClose asChild>
                        <Button variant="outline" size="icon" className="absolute right-4 top-4 h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors z-[60] shadow-sm">
                            <X className="h-4 w-4" strokeWidth={2.5} />
                            <span className="sr-only">Close</span>
                        </Button>
                    </SheetClose>
                </SheetHeader>

                {/* Content Area */}
                <ScrollArea className="flex-1 px-4 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="space-y-4 pb-12">
                            {orders.map((order) => (
                                <div key={order.orderId} className="group bg-white rounded-2xl p-4 border border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-300">
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(order.orderStatus)}`}>
                                                    {order.orderStatus}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    #{order.orderNumber?.split('-').pop() || order.orderId}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-slate-900 leading-none">
                                                {formatCurrency(order.finalTotalAmount)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                {order.items?.length || 0} items
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-3">
                                        {order.items?.map((item, idx) => {
                                            const displayImage = item.productSizeColourImage || item.productColourImage || item.productImage;

                                            // Construct variant name
                                            let variantText = [];
                                            if (item.productSizeName) variantText.push(item.productSizeName);
                                            if (item.productColour || item.productSizeColourName) variantText.push(item.productColour || item.productSizeColourName);

                                            return (
                                                <div key={idx} className="flex gap-3 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                                                    <div className="h-10 w-10 shrink-0 bg-white rounded-lg border border-slate-100 overflow-hidden relative">
                                                        {displayImage ? (
                                                            <Image
                                                                src={displayImage}
                                                                alt={item.productName}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                                <ShoppingBag className="w-4 h-4 text-slate-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                                                            {item.productName}
                                                        </p>
                                                        {variantText.length > 0 && (
                                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                {variantText.join(' • ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right pl-2">
                                                        <p className="text-xs font-bold text-slate-700">x{item.quantity}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Action Footer (Optional, e.g. Track Order) */}
                                    {/* <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5">
                                            Details <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div> */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative mb-2">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center relative backdrop-blur-sm border border-white/10">
                                    <Package className="w-10 h-10 text-muted-foreground/60" />
                                </div>
                            </div>
                            <div className="space-y-2 max-w-[250px]">
                                <h3 className="font-bold text-xl tracking-tight">No orders yet</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Your order history will appear here once you make a purchase.
                                </p>
                            </div>
                            <Button className="rounded-full w-full max-w-[200px] h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all">
                                Start Shopping
                            </Button>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
