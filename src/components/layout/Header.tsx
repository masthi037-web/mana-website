"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, ShoppingCart, Search, ShoppingBag, History, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/hooks/use-cart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
];

const Header = () => {
  const pathname = usePathname();
  const { wishlist } = useWishlist();
  const { cart } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold text-foreground tracking-tight">
            ShopSphere
          </span>
        </Link>
        <div className="relative hidden w-full max-w-md md:block lg:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, brands, and more..."
            className="pl-10 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-input transition-all duration-300"
          />
        </div>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <div className='hidden md:flex items-center gap-2'>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;

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
                    {label === 'Wishlist' && wishlist.length > 0 && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                        isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                      )}>
                        {wishlist.length}
                      </span>
                    )}
                    {label === 'Cart' && cart.length > 0 && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in",
                        isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                      )}>
                        {cart.length}
                      </span>
                    )}
                  </Link>
                </Button>
              );
            })}
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
          </div>
          <Button
            variant={pathname === '/profile' ? "default" : "ghost"}
            size="icon"
            className={cn(
              "rounded-full transition-all duration-300 w-10 h-10 md:w-12 md:h-12",
              !pathname.startsWith('/profile') && "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            asChild
          >
            <Link href="/profile" aria-label="Profile">
              <User className={cn("h-5 w-5 md:h-6 md:w-6", pathname === '/profile' && "fill-current")} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
