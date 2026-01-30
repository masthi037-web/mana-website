import React, { forwardRef } from 'react';
import { CompanyDetails, SaveOrderResponse } from '@/lib/api-types';
import { format } from 'date-fns';

interface InvoiceTemplateProps {
    order: SaveOrderResponse;
    companyDetails: CompanyDetails | null;
    logoOverride?: string;
    itemImagesOverride?: Record<string, string>;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order, companyDetails, logoOverride, itemImagesOverride }, ref) => {
    if (!order || !companyDetails) return null;

    const logoSrc = logoOverride || companyDetails.logo;

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

    const getItemImage = (item: any) => {
        // Prioritize specific variant images
        return item.productSizeColourImage || item.productColourImage || item.productImage;
    };

    return (
        <div ref={ref} className="bg-white w-[210mm] min-h-[297mm] mx-auto text-slate-800 flex flex-col font-sans" id="invoice-template">
            {/* Top Decorative Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>

            {/* Header Section */}
            <div className="p-12 pb-8 flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        {logoSrc && (
                            <div className="h-20 w-20 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-2 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    className="h-full w-full object-contain"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{companyDetails.companyName}</h1>
                            {companyDetails.gstNumber && <p className="text-xs text-slate-400 font-medium">GSTIN: {companyDetails.gstNumber}</p>}
                        </div>
                    </div>

                    <div className="text-sm text-slate-500 leading-relaxed">
                        <p>{companyDetails.companyAddress}</p>
                        <p>{companyDetails.companyCity}, {companyDetails.companyState} - {companyDetails.companyPinCode}</p>
                        <p className="mt-2 text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal mr-2">E:</span> {companyDetails.companyEmail}
                        </p>
                        <p className="text-slate-600 font-medium">
                            <span className="text-slate-400 font-normal mr-2">P:</span> {companyDetails.companyPhone}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase mb-6 shadow-lg shadow-slate-200">
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
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'
                                }`}>
                                {order.orderStatus}
                            </span>
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
                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Billed To
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-grow">
                        <p className="font-bold text-slate-900 text-lg mb-1">{order.customerName}</p>
                        <p className="text-sm text-slate-500 font-medium mb-3">{order.customerPhone}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-white px-2 py-0.5 rounded-md shadow-sm text-[10px] font-bold text-slate-400 border border-slate-100">ID</span>
                            <span className="font-medium">#{order.customerId}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-slate-300 rounded-full"></span>
                        Shipped To
                    </h3>
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
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[10%]">Image</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[45%]">Item Details</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-[15%]">Qty</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Price</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[15%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {order.items.map((item, idx) => {
                                const imageSrc = (itemImagesOverride && itemImagesOverride[item.orderItemId]) || getItemImage(item);
                                return (
                                    <tr key={idx} className="group">
                                        <td className="py-4 px-6 align-middle">
                                            <div className="h-12 w-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 relative group-hover:shadow-md transition-shadow">
                                                {imageSrc ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={imageSrc}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        crossOrigin="anonymous"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">Img</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 align-middle">
                                            <p className="font-bold text-slate-800 text-sm mb-1">{item.productName}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[item.productSizeName, item.productColour, item.productSizeColourName].filter(Boolean).map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center align-middle">
                                            <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 text-xs">x{item.quantity}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right text-slate-600 text-sm align-middle">
                                            {formatCurrency(item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0)}
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm align-middle">
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

            {/* Bottom Contact */}
            <div className="mt-auto bg-slate-900 text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="font-bold text-lg mb-2">Thank you!</p>
                        <p className="text-slate-400 text-sm max-w-sm">We appreciate your business. Please check your order details carefully and contact us if you need any assistance.</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{companyDetails.companyName}</p>
                        <p className="text-primary text-sm font-medium">{companyDetails.companyDomain}</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
