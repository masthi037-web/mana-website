
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingCart, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/admin/inventory', icon: Settings, label: 'Admin' },
];

const BottomNavigation = () => {
  const pathname = usePathname();
  const { wishlist } = useWishlist();
  const { cart } = useCart();

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto flex h-16 items-center justify-around px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", isActive ? "fill-current" : "")} strokeWidth={1.5} />
                {label === 'Wishlist' && wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {wishlist.length}
                  </span>
                )}
                {label === 'Cart' && cart.length > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavigation;
