"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { ArrowRight, Sparkles, Star, Settings, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ShopNowButton } from '@/components/home/ShopNowButton';
import { fetchProductsByCategory } from '@/services/product.service';

// API Services removed from Client component - passed as props
import { CompanyDetails } from '@/lib/api-types';
import { ProductInitializer } from '@/components/providers/ProductInitializer';

interface HomeClientProps {
    initialCategories: Category[];
    companyDetails: CompanyDetails | null;
    fetchAllAtOnce: boolean;
}

export default function HomeClient({ initialCategories, companyDetails, fetchAllAtOnce }: HomeClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Data State
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [isLoadingCategory, setIsLoadingCategory] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchDropdownResults, setSearchDropdownResults] = useState<ProductWithImage[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const storedLogin = localStorage.getItem('isLoggedIn') === 'true';
            const storedRole = localStorage.getItem('userRole');
            setIsLoggedIn(storedLogin);
            setUserRole(storedRole);
        };

        checkAuth();
        window.addEventListener('auth-change', checkAuth);
        return () => window.removeEventListener('auth-change', checkAuth);
    }, []);

    // Helper to get category from URL or default
    const getInitialCategory = () => {
        const paramCat = searchParams.get('category');
        if (paramCat && categories.some(c => c.id === paramCat)) return paramCat;
        return categories.length > 0 ? categories[0].id : "";
    };

    const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory());

    // Sync when initialCategories update (if re-fetched or prop change)
    useEffect(() => {
        if (initialCategories.length > 0) {
            setCategories(initialCategories);
        }
    }, [initialCategories]);

    // Update selected category if needed when categories change
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(getInitialCategory());
        }
    }, [categories]);

    // If OWNER, do not show home screen content
    if (userRole?.includes('OWNER')) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
                <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <Settings className="h-10 w-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold font-headline text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                    Please use the Profile Sidebar {'>'} Settings to access your admin controls.
                </p>
                <div className="mt-8 flex gap-4">
                    <Button variant="outline" onClick={() => window.dispatchEvent(new Event('open-profile-sidebar'))}>
                        Open Sidebar
                    </Button>
                </div>
            </div>
        );
    }

    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

    // Update Catalog ID when Category changes or Data Loads
    useEffect(() => {
        if (!selectedCategory || categories.length === 0) return;

        const category = categories.find(c => c.id === selectedCategory);
        if (category && category.catalogs.length > 0) {
            // Only set if not already set or invalid
            if (!selectedCatalogId || !category.catalogs.some(c => c.id === selectedCatalogId)) {
                setSelectedCatalogId(category.catalogs[0].id);
            }
        }
    }, [selectedCategory, categories]);

    // Sync State -> URL when user interacts
    const updateCategory = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSearchQuery(""); // Clear search on category change
        const category = categories.find(c => c.id === categoryId);

        // Lazy Load Check: If category exists but has no catalogs (and isn't explicitly empty from backend which we assume implies not loaded in this logic)
        // We assume if catalogs is empty, it MIGHT need loading if we are in lazy load mode.
        // However, a category could genuinely have no products.
        // To be safe, we can check if it was already attempted or just try fetch if empty.
        // Current logic in product service returns empty arrays for non-loaded categories.

        let targetCategory = category;

        if (category && category.catalogs.length === 0 && !isLoadingCategory[categoryId]) {
            setIsLoadingCategory(prev => ({ ...prev, [categoryId]: true }));
            try {
                // Fetch Data
                const fetchedCategory = await fetchProductsByCategory(categoryId, companyDetails?.deliveryBetween);

                if (fetchedCategory) {
                    setCategories(prev => prev.map(c =>
                        c.id === categoryId ? {
                            ...c,
                            ...fetchedCategory,
                            categoryImage: fetchedCategory.categoryImage || c.categoryImage,
                            name: fetchedCategory.name || c.name,
                            catalogs: fetchedCategory.catalogs
                        } : c
                    ));
                    targetCategory = fetchedCategory;
                }
            } catch (error) {
                console.error("Failed to lazy load category", error);
                toast({ title: "Error loading category", description: "Please try again.", variant: "destructive" });
            } finally {
                setIsLoadingCategory(prev => ({ ...prev, [categoryId]: false }));
            }
        }

        const newCatalogId = targetCategory?.catalogs[0]?.id || null;
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

    // Error handling removed here as it's done in loadData

    // Auth State moved to top

    const activeCategory = categories.find(c => c.id === selectedCategory);
    const catalogs: Catalog[] = activeCategory ? activeCategory.catalogs : [];

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
        setTimeout(() => {
            const element = document.getElementById('products-anchor');
            if (element) {
                const yOffset = -100;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 100);
    };

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

    // Search Dropdown Logic
    useEffect(() => {
        if (searchQuery.trim() && activeCategory) {
            const allCategoryProducts = activeCategory.catalogs.flatMap(catalog =>
                catalog.products.map(p => {
                    const image = imageMap.get(p.imageId);
                    return {
                        ...p,
                        imageHint: image?.imageHint || 'product image',
                        imageUrl: p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || `https://picsum.photos/seed/${p.id}/300/300`
                    };
                })
            );

            const results = allCategoryProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchDropdownResults(results.slice(0, 5));
            setShowSearchDropdown(true);
        } else {
            setSearchDropdownResults([]);
            setShowSearchDropdown(false);
        }
    }, [searchQuery, activeCategory]);

    // Click outside to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };

        const handleScroll = () => {
            setShowSearchDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleSearchProductClick = (productId: string) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        router.push(`/product/${productId}`);
    };

    const baseProducts: ProductWithImage[] = (() => {
        // If searching and NOT fetching all at once, search across ALL catalogs in the active category
        if (searchQuery && activeCategory) {
            return activeCategory.catalogs.flatMap(catalog =>
                catalog.products.map(p => {
                    const image = imageMap.get(p.imageId);
                    return {
                        ...p,
                        imageHint: image?.imageHint || 'product image',
                        imageUrl: p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || `https://picsum.photos/seed/${p.id}/300/300`
                    };
                })
            );
        }

        // Standard behavior: show products for selected catalog
        return selectedCatalog
            ? selectedCatalog.products.map(p => {
                const image = imageMap.get(p.imageId);
                return {
                    ...p,
                    imageHint: image?.imageHint || 'product image',
                    imageUrl: p.productImage || (p.images && p.images.length > 0 ? p.images[0] : '') || `https://picsum.photos/seed/${p.id}/300/300` // Using seed for consistent images
                }
            })
            : [];
    })();

    // Calculate dynamic price range for the current view transparency
    const currentPrices = baseProducts.map(p => p.price);
    const minProductPrice = currentPrices.length ? Math.min(...currentPrices) : 0;
    const maxProductPrice = currentPrices.length ? Math.max(...currentPrices) : 1000;

    const filteredProducts = baseProducts
        .filter(p => {
            // Search Filter
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
                case 'newest': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
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
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        : [];

    const famousProducts = allFamousProducts.slice(0, 8); // Showing up to 8 famous products

    // If OWNER, do not show home screen content
    if (userRole?.includes('OWNER')) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
                <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <Settings className="h-10 w-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold font-headline text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                    Please use the Profile Sidebar {'>'} Settings to access your admin controls.
                </p>
                <div className="mt-8 flex gap-4">
                    <Button variant="outline" onClick={() => window.dispatchEvent(new Event('open-profile-sidebar'))}>
                        Open Sidebar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section - Rendered in Server Component */}

            <div className="space-y-12 pb-20">
                {/* Initialize Global Store Once Data is Ready */}
                {categories.length > 0 && (
                    <ProductInitializer categories={categories} companyDetails={companyDetails} />
                )}

                {isLoggedIn && userRole?.includes('CUSTOMER') && companyDetails?.companyPhone && (
                    <WhatsAppButton phoneNumber={companyDetails.companyPhone} companyName={companyDetails.companyName} />
                )}
                <CouponCarousel companyCoupon={companyDetails?.companyCoupon} />
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <FeaturesCarousel features={companyDetails?.features} />
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

                        {categories.length > 0 ? (
                            <div className="space-y-12">
                                {/* Modern Category Tabs */}
                                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth md:justify-center">
                                    {categories.map(category => (
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

                                {/* Category Search Bar - Only if NOT fetchAllAtOnce */}
                                {!fetchAllAtOnce && (
                                    <div className="flex justify-center -mt-4 mb-8 px-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="relative w-full max-w-md group" ref={searchRef}>
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                                            </div>
                                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10" />
                                            <input
                                                type="text"
                                                placeholder="Search for latest trends..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                                                className="w-full pl-12 pr-4 py-4 bg-background/80 backdrop-blur-md border border-border/50 shadow-lg shadow-black/5 focus:shadow-primary/10 rounded-full transition-all duration-300 outline-none text-base placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/30"
                                            />

                                            {/* Search Dropdown */}
                                            {showSearchDropdown && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
                                                    {searchDropdownResults.length > 0 ? (
                                                        <div className="py-2">
                                                            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                                Products in {activeCategory?.name}
                                                            </div>
                                                            {searchDropdownResults.map(product => (
                                                                <div
                                                                    key={product.id}
                                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                                                                    onClick={() => handleSearchProductClick(product.id)}
                                                                >
                                                                    <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary relative">
                                                                        <img
                                                                            src={product.imageUrl}
                                                                            alt={product.name}
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="text-sm font-medium text-foreground line-clamp-1">{product.name}</h4>
                                                                        <p className="text-xs text-muted-foreground">₹{product.price}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-muted-foreground">
                                                            <p>No results found in "{activeCategory?.name}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                                                    .sort((a, b) => {
                                                        const getVal = (s?: string) => {
                                                            const m = s?.match(/(\d+)/);
                                                            return m ? parseInt(m[0]) : 0;
                                                        };
                                                        return getVal(b.productOffer) - getVal(a.productOffer);
                                                    })
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
                                                        <ProductCard product={product} hideDescription={true} />
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
                                                    <ProductCard product={product} hideDescription={true} />
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
                                                    <ProductCard product={product} hideDescription={true} />
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

                                    {isLoadingCategory[selectedCategory] ? (
                                        <div className="flex justify-center items-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="ml-2 text-muted-foreground">Loading products...</span>
                                        </div>
                                    ) : !searchQuery ? (
                                        <CatalogGrid
                                            catalogs={catalogs}
                                            selectedCatalogId={selectedCatalogId}
                                            onSelectCatalog={handleSelectCatalog}
                                        />
                                    ) : null}

                                    {(selectedCatalog || searchQuery) && (
                                        <div id="products-anchor" className="mt-16 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-2xl font-bold font-headline">
                                                        {searchQuery ? `Search Results in ${activeCategory?.name}` : selectedCatalog?.name}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm mt-1">
                                                        {filteredProducts.length} items {filteredProducts.length !== baseProducts.length ? '(filtered)' : 'available'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ProductGrid products={filteredProducts} />
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
        </div>
    );
}
