import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, MapPin, Phone, User, Calendar, Receipt, ShoppingBag, CheckCircle2, Clock, Circle } from 'lucide-react';
import Image from 'next/image';
import { SaveOrderResponse, OrderResponseItem } from '@/lib/api-types';

interface OrderDetailsProps {
    order: SaveOrderResponse;
    onBack: () => void;
}

export function OrderDetails({ order, onBack }: OrderDetailsProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
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
                return 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-100';
            case 'PROCESSING':
            case 'CREATED':
                return 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-100';
            case 'CANCELLED':
                return 'bg-rose-50 text-rose-700 border-rose-100 ring-rose-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100 ring-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
            case 'CANCELLED': return <Circle className="w-5 h-5 text-rose-600" />;
            default: return <Clock className="w-5 h-5 text-blue-600" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-8 w-8 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="font-bold text-slate-900 tracking-tight text-lg">Order Details</h2>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                        #{order.orderNumber?.split('-').pop() || order.orderId}
                    </p>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8 pb-32">
                    {/* Status Card */}
                    <div className="text-center py-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl -ml-10 -mb-10" />

                        <div className="relative flex flex-col items-center gap-3">
                            <div className={`p-3 rounded-full bg-white shadow-sm ring-1 ${order.orderStatus === 'CANCELLED' ? 'ring-rose-100' : 'ring-indigo-50'}`}>
                                {getStatusIcon(order.orderStatus)}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{order.orderStatus}</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Placed on {formatDate(order.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Items
                        </h4>
                        <div className="space-y-4">
                            {order.items?.map((item, idx) => {
                                const displayImage = item.productSizeColourImage || item.productColourImage || item.productImage;
                                let variantText = [];
                                if (item.productSizeName) variantText.push(item.productSizeName);
                                if (item.productColour || item.productSizeColourName) variantText.push(item.productColour || item.productSizeColourName);

                                return (
                                    <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className="h-16 w-16 shrink-0 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative shadow-sm">
                                            {displayImage ? (
                                                <Image src={displayImage} alt={item.productName} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{item.productName}</p>
                                            <div className="flex items-center flex-wrap gap-2">
                                                {variantText.map((t, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0 h-5 border-slate-200">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs font-medium text-slate-400 mt-1.5">
                                                Qty: <span className="text-slate-900">{item.quantity}</span>
                                            </p>
                                        </div>
                                        <div className="text-right pt-0.5">
                                            <p className="font-bold text-slate-900 text-sm">
                                                {formatCurrency((item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0) * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delivery Details */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Delivery Address
                        </h4>
                        <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100/60 space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <User className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{order.customerPhone}</p>
                                </div>
                            </div>
                            <div className="h-px bg-slate-200/50 w-full" />
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <MapPin className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                        {order.deliveryRoad}, {order.deliveryCity}<br />
                                        {order.deliveryState} - {order.deliveryPin}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5" /> Payment Summary
                        </h4>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subTotal)}</span>
                            </div>
                            {order.subTotal > order.finalTotalAmount && (
                                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                                    <span>Discount</span>
                                    <span>- {formatCurrency(order.subTotal - order.finalTotalAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>Delivery</span>
                                <span>Free</span>
                            </div>
                            <div className="h-px bg-slate-200 w-full my-2" />
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-slate-900 text-sm">Total Paid</span>
                                <span className="font-black text-xl text-primary font-headline">
                                    {formatCurrency(order.finalTotalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-slate-400">Order ID: {order.orderNumber || order.orderId}</p>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
