"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, ShoppingCart, Search, ShoppingBag, History, Home, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { HistorySheet } from '@/components/history/HistorySheet';
import { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProduct } from '@/hooks/use-product';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { useTenant } from '@/components/providers/TenantContext';
import { AddressSheet } from '@/components/address/AddressSheet';
import { useAuth } from '@/hooks/use-auth';
import { CompanyOrdersSheet } from '@/components/admin/CompanyOrdersSheet';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/admin/orders', label: 'Company Orders', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Admin', icon: Settings },
];

const Header = ({ companyName = "ManaBuy", fetchAllAtOnce = true }: { companyName?: string, fetchAllAtOnce?: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist } = useWishlist();
  const { cart, getCartItemsCount, companyDetails } = useCart();
  const cartItemCount = getCartItemsCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { products: allProducts } = useProduct();
  const { text } = useTenant();

  /* Hydration fix: Ensure client-only values match server on first render */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use shared auth hook
  const { isLoggedIn, userRole, isOwner } = useAuth();

  // Safe cart count
  const displayCartCount = mounted ? cartItemCount : 0;

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProductClick = (productId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/product/${productId}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 duration-300">
          {companyDetails?.logo ? (
            <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 bg-background group">
              <Image
                src={companyDetails.logo}
                alt={companyName}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 text-primary-foreground">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          )}
          <span className={cn(
            "font-headline text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80",
            companyDetails?.logo ? "hidden md:block" : "block"
          )}>
            {companyName}
          </span>
        </Link>
        {!(pathname === '/' && !fetchAllAtOnce) && !pathname.startsWith('/product/') && (
          <div className="relative flex-1 mx-2 md:mx-4 w-full max-w-md lg:max-w-lg" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={text.searchPlaceholder || "Search products, brands, and more..."}
              className="pl-10 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-input transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            />

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 w-full mt-2 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Products
                    </div>
                    {searchResults.map(product => {
                      const fallbackImage = PlaceHolderImages.find(i => i.id === product.imageId) || { imageUrl: '' };
                      const displayImage = product.productImage || (product.images && product.images.length > 0 ? product.images[0] : '') || fallbackImage.imageUrl || '';

                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => handleProductClick(product.id)}
                        >
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary relative">
                            <img src={displayImage} alt={product.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">₹{product.price}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <nav className="flex items-center gap-2 text-sm font-medium">
          <div className='hidden md:flex items-center gap-2'>
            {navItems.map(({ href, label, icon: Icon }) => {
              // Hide Admin settings if not logged in or not OWNER
              if (label === 'Admin' && (!isLoggedIn || !isOwner)) {
                return null;
              }

              // Hide Cart and Wishlist and Home for OWNER
              if ((label === 'Cart' || label === 'Wishlist' || label === 'Home') && isOwner) {
                return null;
              }

              const isActive = pathname === href;

              // Explicitly handle Company Orders (Owner Only)
              if (label === 'Company Orders') {
                if (!isLoggedIn || !isOwner) return null;
                return (
                  <CompanyOrdersSheet key={label}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                        !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="cursor-pointer font-normal">
                        {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                      </div>
                    </Button>
                  </CompanyOrdersSheet>
                );
              }

              // Explicitly handle Cart
              if (label === 'Cart') {
                return (
                  <CartSheet key={label}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                        !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="cursor-pointer font-normal">
                        {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                        {displayCartCount > 0 && (
                          <span className={cn(
                            "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                            isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                          )}>
                            {displayCartCount}
                          </span>
                        )}
                      </div>
                    </Button>
                  </CartSheet>
                );
              }

              // Explicitly handle Wishlist
              if (label === 'Wishlist') {
                return (
                  <WishlistSheet key={label}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                        !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <div className="cursor-pointer font-normal">
                        {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                        {mounted && wishlist.length > 0 && (
                          <span className={cn(
                            "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                            isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                          )}>
                            {wishlist.length}
                          </span>
                        )}
                      </div>
                    </Button>
                  </WishlistSheet>
                );
              }

              // Default Link Button
              return (
                <Button
                  key={label}
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                    !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  asChild
                >
                  <Link href={href} aria-label={label}>
                    {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                  </Link>
                </Button>
              );
            })}
            {isLoggedIn && userRole?.includes('CUSTOMER') && (
              <HistorySheet>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <History className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
                </Button>
              </HistorySheet>
            )}
          </div>
          <ProfileSheet>
            <Button
              variant={pathname === '/profile' ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                !pathname.startsWith('/profile') && "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <div className="cursor-pointer">
                <User className={cn("h-5 w-5 md:h-6 md:w-6", pathname === '/profile' && "fill-current")} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
              </div>
            </Button>
          </ProfileSheet>
        </nav>
      </div>
      <AddressSheet />
    </header>
  );
};

export default Header;
