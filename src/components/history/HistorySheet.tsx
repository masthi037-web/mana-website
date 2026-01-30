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
import { Package, Clock, X } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';
import { orderService } from '@/services/order.service';

export function HistorySheet({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    // Handle back button on mobile
    useSheetBackHandler(isOpen, setIsOpen);

    // Fetch orders when sheet opens
    useEffect(() => {
        if (isOpen) {
            const customerId = localStorage.getItem('customerId');
            if (customerId) {
                orderService.getCustomerOrders(customerId).catch(err => console.error("Failed to fetch history", err));
            }
        }
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-2xl [&>button]:hidden">
                {/* Header */}
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
                    <SheetTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                        <div className="relative">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        Order History
                    </SheetTitle>
                    <SheetClose asChild>
                        <Button variant="outline" size="icon" className="absolute right-4 top-4 h-9 w-9 rounded-full border border-input bg-background/80 backdrop-blur-sm hover:bg-accent text-foreground hover:text-accent-foreground transition-colors z-[60] shadow-sm">
                            <X className="h-4 w-4" strokeWidth={2.5} />
                            <span className="sr-only">Close</span>
                        </Button>
                    </SheetClose>
                </SheetHeader>

                {/* Placeholder Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
            </SheetContent>
        </Sheet>
    );
}
