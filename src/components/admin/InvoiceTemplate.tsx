import React, { forwardRef } from 'react';
import { CompanyDetails, SaveOrderResponse } from '@/lib/api-types';
import { format } from 'date-fns';

interface InvoiceTemplateProps {
    order: SaveOrderResponse;
    companyDetails: CompanyDetails | null;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order, companyDetails }, ref) => {
    if (!order || !companyDetails) return null;
    const details = companyDetails;

    // Image variables removed for speed optimization

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    // getItemImage removed for speed optimization

    return (
        <div ref={ref} className="bg-white text-slate-800 flex flex-col font-sans" id="invoice-template">
            {/* Top Decorative Bar Removed for Speed */}

            {/* Header Section */}
            <div className="p-12 pb-8 flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        {/* Logo removed for speed */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{details.companyName}</h1>
                            {details.gstNumber && <p className="text-xs text-slate-400 font-medium">GSTIN: {details.gstNumber}</p>}
                        </div>
                    </div>

                    <div className="text-sm text-slate-500 leading-relaxed">
                        <p>{details.companyAddress}</p>
                        <p>{details.companyCity}, {details.companyState} - {details.companyPinCode}</p>
                        <p className="mt-2 text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal mr-2">E:</span> {details.companyEmail}
                        </p>
                        <p className="text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal mr-2">P:</span> {details.companyPhone}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
                        Invoice
                    </div>
                    <div className="space-y-1">
                        <div className="mb-4">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Order Number</p>
                            <p className="text-xl font-bold text-slate-900">{order.orderNumber}</p>
                        </div>
                        <div className="mb-4">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Date Issued</p>
                            <p className="text-base font-medium text-slate-700">{formatDate(order.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="px-12">
                <div className="h-px bg-slate-100 w-full"></div>
            </div>

            {/* Client Info Grid */}
            <div className="p-12 py-8 grid grid-cols-2 gap-12">
                <div className="flex flex-col h-full">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-grow">
                        <p className="font-bold text-slate-900 text-lg mb-1">{order.customerName}</p>
                        <p className="text-sm text-slate-500 font-medium mb-3">{order.customerPhone}</p>

                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-grow">
                        <p className="text-sm text-slate-600 leading-relaxed h-full">
                            <span className="font-bold text-slate-900 block mb-2 text-base">Delivery Address</span>
                            {order.deliveryRoad},<br />
                            {order.deliveryCity}, {order.deliveryState}<br />
                            <span className="font-medium text-slate-900 mt-1 block">{order.deliveryPin}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="px-12 flex-grow">
                <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="py-5 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] w-[6%] text-center">#</th>
                                <th className="py-5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] w-[44%]">Description</th>
                                <th className="py-5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] text-center w-[12%]">Quantity</th>
                                <th className="py-5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] text-right w-[16%]">Unit Price</th>
                                <th className="py-5 px-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] text-right w-[22%]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {order.items.map((item, idx) => {
                                const finalUnitPrice = item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0;
                                const originalUnitPrice = (item as any).productSizePrice || (item as any).productPrice || finalUnitPrice;
                                const hasDiscount = originalUnitPrice > finalUnitPrice + 0.1;
                                const discountPercent = hasDiscount ? Math.round(((originalUnitPrice - finalUnitPrice) / originalUnitPrice) * 100) : 0;

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors duration-200">
                                        <td className="py-6 px-8 align-middle text-center">
                                            <span className="text-slate-300 text-xs font-black tracking-tighter italic">{(idx + 1).toString().padStart(2, '0')}</span>
                                        </td>
                                        <td className="py-6 px-4 align-middle">
                                            <p className="font-black text-slate-900 text-[15px] mb-2 leading-none tracking-tight">{item.productName}</p>
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {[item.productSizeName, item.productColour, item.productSizeColourName].filter(Boolean).map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-widest border border-slate-200/50">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {Number(item.extraDiscount || 0) > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-500 uppercase tracking-wider border border-rose-100">
                                                        OFF: -{formatCurrency(item.extraDiscount || 0)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center align-middle">
                                            <div className="flex justify-center">
                                                <span className="inline-flex items-center justify-center min-w-[2.5rem] font-black text-slate-900 bg-slate-100/50 px-3 py-1.5 rounded-lg text-xs border border-slate-200/40">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right align-middle">
                                            <div className="flex flex-col items-end leading-tight">
                                                {hasDiscount && (
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] text-slate-400 line-through font-medium opacity-60">
                                                            {formatCurrency(originalUnitPrice)}
                                                        </span>
                                                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                                            {discountPercent}%
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="font-bold text-slate-900 text-sm tracking-tight text-opacity-80">
                                                    {formatCurrency(finalUnitPrice)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right align-middle">
                                            <span className="font-black text-slate-900 text-base tracking-tight">
                                                {formatCurrency(finalUnitPrice * item.quantity)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="px-12 py-10">
                <div className="flex justify-end pt-4">
                    <div className="w-[340px] bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="space-y-5 pb-6 border-b border-dashed border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[9px]">Subtotal</span>
                                <span className="text-slate-900 font-bold text-sm">{formatCurrency(order.subTotal)}</span>
                            </div>

                            {order.subTotal > (order.finalTotalAmount + (order.extraDiscount || 0)) && (
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-500 font-black uppercase tracking-[0.15em] text-[9px]">Discounts</span>
                                    <span className="text-emerald-600 font-black text-sm">- {formatCurrency(Math.max(0, order.subTotal - order.finalTotalAmount - (order.extraDiscount || 0)))}</span>
                                </div>
                            )}

                            {Number(order.extraDiscount || 0) > 0 ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-rose-500 font-bold uppercase tracking-[0.15em] text-[9px]">Bundle Saving</span>
                                    <span className="text-rose-600 font-black text-sm">- {formatCurrency(order.extraDiscount || 0)}</span>
                                </div>
                            ) : null}

                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[9px]">Delivery</span>
                                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    {(order.deliveryCost && parseFloat(order.deliveryCost) > 0) ? formatCurrency(parseFloat(order.deliveryCost)) : "Complementary"}
                                </span>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col gap-1 items-end">
                            <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] pr-1">Payable Amount</span>
                            <span className="text-5xl font-black text-[#f43f5e] tracking-tighter leading-none">
                                {formatCurrency(order.finalTotalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-8 pb-12 px-12 text-center border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-serif tracking-tight">Thank you for your Order</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    We appreciate your trust in {details.companyName}. Please check your order details carefully.
                </p>
                <div className="inline-flex items-center gap-6 text-sm font-medium text-slate-600 justify-center">
                    <span>{details.companyDomain}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{details.companyEmail}</span>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
