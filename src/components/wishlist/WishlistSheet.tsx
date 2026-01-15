'use client';

import Image from 'next/image';
import Link from 'next/link';
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
import {
    Heart,
    Trash2,
    ShoppingCart,
} from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { AddToCartSheet } from '@/components/cart/AddToCartSheet';
import { useSheetBackHandler } from '@/hooks/use-sheet-back-handler';

export function WishlistSheet({ children }: { children?: React.ReactNode }) {
    const { wishlist, removeFromWishlist, isWishlistOpen, setWishlistOpen } = useWishlist();
    const { toast } = useToast();

    // Handle back button on mobile
    useSheetBackHandler(isWishlistOpen, setWishlistOpen);

    return (
        <Sheet open={isWishlistOpen} onOpenChange={setWishlistOpen}>
            {children && <SheetTrigger asChild>{children}</SheetTrigger>}
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/40 bg-background shadow-2xl">
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/40 bg-background sticky top-0 z-20">
                    <SheetTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                        <div className="relative">
                            <Heart className="w-5 h-5 text-primary fill-primary" />
                        </div>
                        My Wishlist
                        {wishlist.length > 0 && (
                            <span className="ml-auto mr-12 text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-primary">
                                {wishlist.length} items
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {wishlist.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative mb-2">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center relative backdrop-blur-sm border border-white/10">
                                <Heart className="w-10 h-10 text-muted-foreground/60" />
                            </div>
                        </div>
                        <div className="space-y-2 max-w-[250px]">
                            <h3 className="font-bold text-xl tracking-tight">Your wishlist is empty</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Save items you love here for later.
                            </p>
                        </div>
                        <SheetClose asChild>
                            <Button className="rounded-full w-full max-w-[200px] h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all">
                                Discover Products
                            </Button>
                        </SheetClose>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 px-6">
                        <ul className="py-6 space-y-6">
                            {wishlist.map((item, index) => (
                                <li
                                    key={item.id}
                                    className="group relative flex gap-5 animate-in slide-in-from-bottom-4 fade-in duration-500"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Premium Image Card */}
                                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30 shadow-sm group-hover:shadow-md transition-all duration-300">
                                        <Link
                                            href={`/product/${item.id}`}
                                            onClick={() => setWishlistOpen(false)}
                                            className="block w-full h-full"
                                        >
                                            <Image
                                                src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                data-ai-hint={item.imageHint}
                                            />
                                        </Link>
                                    </div>

                                    <div className="flex flex-1 flex-col justify-between min-h-[6rem] py-0.5">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start gap-3">
                                                <Link
                                                    href={`/product/${item.id}`}
                                                    onClick={() => setWishlistOpen(false)}
                                                    className="font-bold text-base leading-snug hover:text-primary transition-colors line-clamp-2"
                                                >
                                                    {item.name}
                                                </Link>
                                                <p className="font-bold text-base text-primary whitespace-nowrap">
                                                    ₹{item.price.toFixed(0)}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 gap-3">
                                            <div className="flex-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                <AddToCartSheet
                                                    product={item}
                                                    onAddToCart={() => setWishlistOpen(false)}
                                                >
                                                    <Button size="sm" variant="secondary" className="w-full rounded-full h-8 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                                                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                                                        Add to Cart
                                                    </Button>
                                                </AddToCartSheet>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                onClick={() => {
                                                    removeFromWishlist(item.id);
                                                    toast({ description: "Removed from wishlist" });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}
            </SheetContent>
        </Sheet>
    );
}
