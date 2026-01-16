"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Recommendations from '@/components/products/Recommendations';
import type { Catalog, ProductWithImage, Category } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CatalogGrid from '@/components/products/CatalogGrid';
import { FilterSortSheet, FilterState } from '@/components/products/FilterSortSheet';
import { ProductGrid } from '@/components/products/ProductGrid';
import { AddToCartSheet } from '@/components/cart/AddToCartSheet';
import { ProductCard } from '@/components/products/ProductCard';
import { FeaturesCarousel } from '@/components/home/FeaturesCarousel';
import { CouponCarousel } from '@/components/home/CouponCarousel';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

import { ArrowRight, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

interface HomeClientProps {
    initialCategories: Category[];
    companyCoupon?: string;
    companyPhone?: string;
    companyName?: string;
}

export default function HomeClient({ initialCategories, companyCoupon, companyPhone, companyName }: HomeClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to get category from URL or default
    const getInitialCategory = () => {
        const paramCat = searchParams.get('category');
        if (paramCat && initialCategories.some(c => c.id === paramCat)) return paramCat;
        return initialCategories.length > 0 ? initialCategories[0].id : "";
    };

    const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);

    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(() => {
        const categoryId = getInitialCategory();
        const category = initialCategories.find(c => c.id === categoryId);
        return category && category.catalogs.length > 0 ? category.catalogs[0].id : null;
    });

    // Sync State -> URL when user interacts
    const updateCategory = (categoryId: string) => {
        setSelectedCategory(categoryId);
        const category = initialCategories.find(c => c.id === categoryId);
        const newCatalogId = category?.catalogs[0]?.id || null;
        setSelectedCatalogId(newCatalogId);

        // Update URL manually to prevent Next.js from hijacking scroll
        const params = new URLSearchParams(searchParams.toString());
        params.set('category', categoryId);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState(null, '', newUrl);

        // Smooth scroll to product section
        const element = document.getElementById('product-catalog-section');
        if (element) {
            const yOffset = -80;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Filter & Sort State
    const [filters, setFilters] = useState<FilterState>({
        sortBy: 'recommended',
        priceRange: [0, 10000], // Default wide range
        minRating: null
    });

    // Reset filters when category/catalog changes
    useEffect(() => {
        setFilters({
            sortBy: 'recommended',
            priceRange: [0, 10000],
            minRating: null
        });
    }, [selectedCatalogId, selectedCategory]);

    useEffect(() => {
        if (initialCategories.length === 0) {
            toast({
                variant: "destructive",
                duration: 2000,
                title: "Connection Error",
                description: "Could not load categories. Please check your internet connection.",
            });
        }
    }, [initialCategories, toast]);

    // Auth State for WhatsApp Button visibility
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
            setUserRole(localStorage.getItem('userRole'));
        };

        checkAuth(); // Initial check

        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, []);

    const activeCategory = initialCategories.find(c => c.id === selectedCategory);
    const catalogs: Catalog[] = activeCategory ? activeCategory.catalogs : [];

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
    };

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

    const baseProducts: ProductWithImage[] = selectedCatalog
        ? selectedCatalog.products.map(p => {
            const image = imageMap.get(p.imageId);
            return {
                ...p,
                imageHint: image?.imageHint || 'product image',
                imageUrl: `https://picsum.photos/seed/${p.id}/300/300` // Using seed for consistent images
            }
        })
        : [];

    // Calculate dynamic price range for the current view transparency
    const currentPrices = baseProducts.map(p => p.price);
    const minProductPrice = currentPrices.length ? Math.min(...currentPrices) : 0;
    const maxProductPrice = currentPrices.length ? Math.max(...currentPrices) : 1000;

    const filteredProducts = baseProducts
        .filter(p => {
            // Price Filter
            if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
            // Rating Filter
            if (filters.minRating && p.rating < filters.minRating) return false;
            return true;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'rating_desc': return b.rating - a.rating;
                case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                default: return 0;
            }
        });

    // Logic for New Arrivals: Filter products created within the last 48 hours for the ACTIVE CATEGORY
    const allNewArrivals: ProductWithImage[] = activeCategory
        ? activeCategory.catalogs.flatMap(c => c.products)
            .filter(p => {
                const created = new Date(p.createdAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - created.getTime());
                const diffHours = diffTime / (1000 * 60 * 60);
                return diffHours <= 48;
            })
            .map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: `https://picsum.photos/seed/${p.id}/300/300`
                }
            })
        : [];

    const newArrivals = allNewArrivals.slice(0, 5);

    // Logic for Famous Products: Filter products with famous: true for the ACTIVE CATEGORY
    const allFamousProducts: ProductWithImage[] = activeCategory
        ? activeCategory.catalogs.flatMap(c => c.products)
            .filter(p => p.famous)
            .map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: `https://picsum.photos/seed/${p.id}/300/300`
                }
            })
        : [];

    const famousProducts = allFamousProducts.slice(0, 8); // Showing up to 8 famous products

    return (
        <div className="space-y-12 pb-20">
            {isLoggedIn && userRole?.includes('CUSTOMER') && companyPhone && (
                <WhatsAppButton phoneNumber={companyPhone} companyName={companyName} />
            )}
            <CouponCarousel companyCoupon={companyCoupon} />
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                <FeaturesCarousel />
            </div>
            <div className="container mx-auto px-4 space-y-24">

                {/* Categories Section */}
                <section id="shop-now" className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 scroll-mt-24">
                    <div className="flex items-center justify-center mb-8 text-center">
                        <div>
                            <h2 className="text-3xl font-headline font-bold">Discover Collections</h2>
                            <p className="text-muted-foreground mt-1">Explore our curated range of products</p>
                        </div>
                    </div>

                    {initialCategories.length > 0 ? (
                        <div className="space-y-12">
                            {/* Modern Category Tabs */}
                            <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth md:justify-center">
                                {initialCategories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => updateCategory(category.id)}
                                        className={cn(
                                            "relative group flex flex-col items-center gap-3 min-w-[100px] p-4 rounded-2xl transition-all duration-300 border border-transparent",
                                            selectedCategory === category.id
                                                ? "bg-primary/5 border-primary/20 shadow-sm"
                                                : "hover:bg-secondary/50 hover:border-border/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                                            selectedCategory === category.id
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                                                : "bg-secondary text-muted-foreground group-hover:bg-secondary/80",
                                            "overflow-hidden"
                                        )}>
                                            {category.categoryImage ? (
                                                <img
                                                    src={category.categoryImage}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Sparkles className="w-6 h-6" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-xs md:text-sm font-semibold transition-colors text-center line-clamp-2 leading-tight max-w-[120px]",
                                            selectedCategory === category.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {category.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Exclusive Offers Block - Freshly Dropped Signature Selection Style */}
                            {activeCategory && activeCategory.catalogs.flatMap(c => c.products).filter(p => p.productOffer).length > 0 && (
                                <div className="mb-16 relative">
                                    {/* Ambient Background Glow */}
                                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

                                    <div className="flex items-center justify-between mb-6 relative">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 duration-1000"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold font-headline text-foreground leading-none animate-in slide-in-from-left-4 duration-500">
                                                    Exclusive Offers
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1 animate-in slide-in-from-left-4 duration-500 delay-100">
                                                    Limited time deals just for you
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                        {(() => {
                                            const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));
                                            const offerProducts = activeCategory ? activeCategory.catalogs.flatMap(c => c.products)
                                                .filter(p => p.productOffer)
                                                .map(p => {
                                                    const image = imageMap.get(p.imageId);
                                                    return {
                                                        ...p,
                                                        imageHint: image?.imageHint || 'product image',
                                                        imageUrl: `https://picsum.photos/seed/${p.id}/300/300`
                                                    };
                                                }) : [];

                                            return offerProducts.map((product, index) => (
                                                <div
                                                    key={product.id}
                                                    className="min-w-[280px] md:min-w-[320px] snap-center h-full animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    <ProductCard product={product} />
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* New Arrivals Block - Premium Horizontal Scroll */}
                            {newArrivals.length > 0 && (
                                <div id="new-arrivals" className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 scroll-mt-24">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold font-headline text-foreground leading-none">Freshly Dropped</h3>
                                                <p className="text-sm text-muted-foreground mt-1">Just in: {activeCategory?.name}'s latest</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                        {newArrivals.map((product) => (
                                            <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-center h-full">
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Famous Products Block - Premium Horizontal Scroll */}
                            {famousProducts.length > 0 && (
                                <div className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold font-headline text-foreground leading-none">Signature Selection</h3>
                                                <p className="text-sm text-muted-foreground mt-1">Timeless favorites & bestsellers</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 scroll-smooth no-scrollbar snap-x snap-mandatory">
                                        {famousProducts.map((product) => (
                                            <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-center h-full">
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}



                            {/* Catalogs & Products Area */}
                            <div id="product-catalog-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <span className="w-1.5 h-6 rounded-full bg-primary/80 block"></span>
                                        {activeCategory?.name} Catalogs
                                    </h3>

                                </div>

                                <CatalogGrid
                                    catalogs={catalogs}
                                    selectedCatalogId={selectedCatalogId}
                                    onSelectCatalog={handleSelectCatalog}
                                />

                                {selectedCatalog && (
                                    <div className="mt-16 animate-in fade-in zoom-in-95 duration-500">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-bold font-headline">{selectedCatalog.name}</h3>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    {filteredProducts.length} items {filteredProducts.length !== baseProducts.length ? '(filtered)' : 'available'}
                                                </p>
                                            </div>
                                            {/* <FilterSortSheet
                                            currentFilters={filters}
                                            onApply={setFilters}
                                            minPrice={minProductPrice}
                                            maxPrice={maxProductPrice}
                                        /> */}
                                        </div>
                                        <ProductGrid products={filteredProducts} />
                                        {/* <div className="mt-12 text-center">
                                            <Button size="lg" variant="secondary" className="rounded-full px-8">Load More Products</Button>
                                        </div> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-secondary/20 rounded-3xl border border-dashed border-border">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">No categories found</h3>
                                <p className="text-muted-foreground">Please check back later for new arrivals.</p>
                            </div>
                        </div>
                    )
                    }
                </section >

                {/* Recommendations Section Removed as per request */}
            </div>
        </div>
    );
}
