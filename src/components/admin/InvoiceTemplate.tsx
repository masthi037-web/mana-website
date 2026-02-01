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
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">#</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Item Details</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-[15%]">Qty</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Price</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {order.items.map((item, idx) => {
                                return (
                                    <tr key={idx} className="group">
                                        <td className="py-4 px-6 align-top">
                                            <span className="text-slate-400 text-xs font-medium">{(idx + 1).toString().padStart(2, '0')}</span>
                                        </td>
                                        <td className="py-4 px-6 align-top">
                                            <p className="font-bold text-slate-800 text-sm mb-1">{item.productName}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[item.productSizeName, item.productColour, item.productSizeColourName].filter(Boolean).map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center align-top">
                                            <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-xs">x{item.quantity}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right text-slate-600 text-sm align-top">
                                            {formatCurrency(item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0)}
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm align-top">
                                            {formatCurrency((item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0) * item.quantity)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Calculator */}
            <div className="px-12 py-8">
                <div className="flex justify-end">
                    <div className="w-[350px]">
                        <div className="space-y-3 pb-6 border-b border-slate-200">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="text-slate-900 font-semibold">{formatCurrency(order.subTotal)}</span>
                            </div>
                            {order.subTotal > order.finalTotalAmount && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-600 font-medium">Discount</span>
                                    <span className="text-emerald-700 font-bold">- {formatCurrency(order.subTotal - order.finalTotalAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Shipping</span>
                                <span className="text-slate-900 font-bold">Free</span>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-between items-end">
                            <div className="text-xs text-slate-400">Total Amount</div>
                            <div className="text-3xl font-black text-primary tracking-tight">
                                {formatCurrency(order.finalTotalAmount)}
                            </div>
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
