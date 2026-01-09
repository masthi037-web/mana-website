"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, ShoppingCart, Search, ShoppingBag, History, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useProduct } from '@/hooks/use-product';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { useTenant } from '@/components/providers/TenantContext';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Admin', icon: Settings },
];

const Header = ({ companyName = "ShopSphere" }: { companyName?: string }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist } = useWishlist();
  const { cart, getCartItemsCount } = useCart();
  const cartItemCount = getCartItemsCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { products: allProducts } = useProduct();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { text } = useTenant();

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      setUserRole(localStorage.getItem('userRole'));
    }
  };

  useEffect(() => {
    checkAuth();
    // Listen for storage events (cross-tab) and custom auth events (same-tab)
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

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
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold text-foreground tracking-tight">
            {companyName}
          </span>
        </Link>
        <div className="relative hidden w-full max-w-md md:block lg:max-w-lg" ref={searchRef}>
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
                    // Resolve image similarly to other components or use mock/placeholder logic if needed
                    // For simplify, using placeholder or first logic
                    const image = PlaceHolderImages.find(i => i.id === product.imageId) || { imageUrl: `https://picsum.photos/seed/${product.id}/50` };

                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary relative">
                          <img src={image.imageUrl || `https://picsum.photos/seed/${product.id}/50`} alt={product.name} className="object-cover w-full h-full" />
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
        <nav className="flex items-center gap-2 text-sm font-medium">
          <div className='hidden md:flex items-center gap-2'>
            {navItems.map(({ href, label, icon: Icon }) => {
              // Hide Admin settings if not logged in or not OWNER
              if (label === 'Admin' && (!isLoggedIn || !userRole?.includes('OWNER'))) {
                return null;
              }

              const isActive = pathname === href;

              const content = (
                <div className="cursor-pointer">
                  {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                  {label === 'Cart' && cartItemCount > 0 && (
                    <span className={cn(
                      "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                      isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                    )}>
                      {cartItemCount}
                    </span>
                  )}
                  {label === 'Wishlist' && wishlist.length > 0 && (
                    <span className={cn(
                      "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                      isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                    )}>
                      {wishlist.length}
                    </span>
                  )}
                </div>
              );

              const ButtonTrigger = (
                <Button
                  key={label}
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "rounded-full relative transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                    !isActive && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  asChild={label !== 'Cart' && label !== 'Wishlist'}
                >
                  {label === 'Cart' || label === 'Wishlist' ? (
                    content
                  ) : (
                    <Link href={href} aria-label={label}>
                      {Icon && <Icon className={cn("h-5 w-5 md:h-6 md:w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />}
                    </Link>
                  )}
                </Button>
              );

              if (label === 'Cart') {
                return (
                  <CartSheet key={label}>
                    {ButtonTrigger}
                  </CartSheet>
                );
              }

              if (label === 'Wishlist') {
                return (
                  <WishlistSheet key={label}>
                    {ButtonTrigger}
                  </WishlistSheet>
                );
              }

              return ButtonTrigger;
            })}
            {isLoggedIn && userRole?.includes('CUSTOMER') && (
              <Button
                variant={pathname === '/history' ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
                  !pathname.startsWith('/history') && "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                asChild
              >
                <Link href="/history" aria-label="History">
                  <History className={cn("h-5 w-5 md:h-6 md:w-6", pathname === '/history' && "fill-current")} strokeWidth={pathname === '/history' ? 2.5 : 2} />
                </Link>
              </Button>
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
              <User className={cn("h-5 w-5 md:h-6 md:w-6", pathname === '/profile' && "fill-current")} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
            </Button>
          </ProfileSheet>
        </nav>
      </div >
    </header >
  );
};

export default Header;
