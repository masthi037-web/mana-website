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
        <div ref={ref} className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-slate-900" id="invoice-template">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-primary/20 pb-6">
                <div>
                    {logoSrc && (
                        <div className="h-24 max-w-[200px] relative mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={logoSrc}
                                alt="Logo"
                                className="h-full w-auto object-contain"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-primary mb-2">{companyDetails.companyName}</h1>
                    <div className="text-xs text-slate-500 mt-1 max-w-[250px]">
                        {companyDetails.companyAddress}<br />
                        {companyDetails.companyCity}, {companyDetails.companyState} - {companyDetails.companyPinCode}<br />
                        Phone: {companyDetails.companyPhone}<br />
                        Email: {companyDetails.companyEmail}
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-2">INVOICE</h2>
                    <div className="text-sm font-medium text-slate-600">
                        <p>Order #: <span className="font-bold text-slate-900">{order.orderNumber}</span></p>
                        <p>Date: <span className="font-bold text-slate-900">{formatDate(order.createdAt)}</span></p>
                        <p className="mt-2">Status: <span className="uppercase font-bold text-primary">{order.orderStatus}</span></p>
                    </div>
                </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="flex justify-between mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                    <p className="font-bold text-slate-900">{order.customerName}</p>
                    <p className="text-sm text-slate-500 mt-1">{order.customerPhone}</p>
                </div>
                <div className="w-px bg-slate-200 mx-6"></div>
                <div className="flex-1 text-right">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shipped To</h3>
                    <p className="text-sm text-slate-600 max-w-[250px] ml-auto">
                        {order.deliveryRoad}, {order.deliveryCity}<br />
                        {order.deliveryState} - {order.deliveryPin}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/20">
                            <th className="pb-3 px-2 text-xs font-black text-primary uppercase tracking-wider w-[15%]">Image</th>
                            <th className="pb-3 px-2 text-xs font-black text-primary uppercase tracking-wider w-[40%]">Item Description</th>
                            <th className="pb-3 px-2 text-xs font-black text-primary uppercase tracking-wider text-center">Qty</th>
                            <th className="pb-3 px-2 text-xs font-black text-primary uppercase tracking-wider text-right">Price</th>
                            <th className="pb-3 px-2 text-xs font-black text-primary uppercase tracking-wider text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => {
                            const imageSrc = (itemImagesOverride && itemImagesOverride[item.orderItemId]) || getItemImage(item);
                            return (
                                <tr key={idx} className="text-sm">
                                    <td className="py-4 px-2 align-middle">
                                        {imageSrc ? (
                                            <div className="h-12 w-12 rounded border border-slate-200 overflow-hidden bg-white">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imageSrc}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                    crossOrigin="anonymous"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                                                <span className="text-[10px] text-slate-400">No Img</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-2 align-middle">
                                        <p className="font-bold text-slate-900">{item.productName}</p>
                                        <p className="text-xs text-slate-400">
                                            {[item.productSizeName, item.productColour, item.productSizeColourName].filter(Boolean).join(' • ')}
                                        </p>
                                    </td>
                                    <td className="py-4 px-2 text-center text-slate-600 font-medium align-middle">{item.quantity}</td>
                                    <td className="py-4 px-2 text-right text-slate-600 align-middle">{formatCurrency(item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0)}</td>
                                    <td className="py-4 px-2 text-right font-bold text-slate-900 align-middle">
                                        {formatCurrency((item.productSizePriceAfterDiscount || item.productPriceAfterDiscount || 0) * item.quantity)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-[300px] bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(order.subTotal)}</span>
                    </div>
                    {order.subTotal > order.finalTotalAmount && (
                        <div className="flex justify-between text-sm text-emerald-600">
                            <span>Discount</span>
                            <span className="font-medium">- {formatCurrency(order.subTotal - order.finalTotalAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500 border-b border-slate-200 pb-2">
                        <span>Delivery</span>
                        <span className="font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-primary pt-1">
                        <span>Total</span>
                        <span>{formatCurrency(order.finalTotalAmount)}</span>
                    </div>
                    {(companyDetails.gstNumber) && (
                        <div className="text-[10px] text-center text-slate-400 mt-2 pt-2 border-t border-slate-200/50">
                            Includes GST where applicable
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-slate-400 text-xs border-t border-slate-100 pt-8 mt-auto">
                <p className="font-medium text-slate-500 mb-1">Thank you for your business!</p>
                <p>For any questions, please contact us at {companyDetails.companyEmail} or {companyDetails.companyPhone}</p>
                {companyDetails.gstNumber && <p className="mt-2">GSTIN: {companyDetails.gstNumber}</p>}
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
