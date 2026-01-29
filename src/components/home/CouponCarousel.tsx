"use client";

import { useState, useEffect } from 'react';
import { Tag, Copy, Check, TicketPercent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CouponCarouselProps {
    companyCoupon?: string;
}

export function CouponCarousel({ companyCoupon }: CouponCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    if (!companyCoupon) return null;

    const coupons = String(companyCoupon).split(',').map((cStr, idx) => {
        const [code, discountStr, minOrderStr] = String(cStr).split('&&&');
        return {
            id: idx,
            code,
            discount: parseFloat(discountStr || '0'),
            minOrder: parseFloat(minOrderStr || '0')
        };
    }).filter(c => c.code);

    // Auto-Rotate
    useEffect(() => {
        if (coupons.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % coupons.length);
            setCopied(false);
        }, 5000);
        return () => clearInterval(interval);
    }, [coupons.length]);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast({
            description: "Coupon code copied to clipboard!",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    if (coupons.length === 0) return null;

    const currentCoupon = coupons[currentIndex];

    // Minimal "Feature Card" Style
    return (
        <div className="w-full flex justify-center -mt-4 mb-8">
            <div className="relative animate-in fade-in zoom-in-95 duration-500">
                <div
                    key={currentIndex}
                    className="flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 min-w-[320px] max-w-md shadow-sm mx-auto transition-all hover:shadow-md hover:border-primary/20"
                >
                    {/* Icon Section (Matches Features) */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                        <TicketPercent className="w-6 h-6" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-foreground leading-tight text-base">
                                Get {currentCoupon.discount}% OFF
                            </h3>
                            <button
                                onClick={() => handleCopy(currentCoupon.code)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border",
                                    copied
                                        ? "bg-green-50 text-green-600 border-green-200"
                                        : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                                )}
                            >
                                <span>{currentCoupon.code}</span>
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            Orders above ₹{currentCoupon.minOrder} • Limited Time
                        </p>
                    </div>
                </div>

                {/* Pagination Dots (Subtle) */}
                {coupons.length > 1 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 justify-center">
                        {coupons.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    idx === currentIndex ? "w-3 bg-primary/40" : "w-1 bg-slate-200 hover:bg-slate-300"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
