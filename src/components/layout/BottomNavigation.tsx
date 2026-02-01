
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingCart, History, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useEffect, useState } from 'react';
import { HistorySheet } from '@/components/history/HistorySheet';
import { CompanyOrdersSheet } from '@/components/admin/CompanyOrdersSheet';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart' },
  { href: '/admin/orders', icon: ClipboardList, label: 'Company Orders' },
  { href: '/admin/inventory', icon: Settings, label: 'Admin' },
  { href: '/history', icon: History, label: 'History' },
];

const BottomNavigation = () => {
  const pathname = usePathname();
  const { wishlist } = useWishlist();
  const { cart } = useCart();
  const { isLoggedIn, userRole, isOwner } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto flex h-16 items-center justify-around px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          if (label === 'Admin' && (!isLoggedIn || !isOwner)) return null;
          if (label === 'History' && (!isLoggedIn || !userRole?.includes('CUSTOMER'))) return null;
          if (label === 'Company Orders' && (!isLoggedIn || !isOwner)) return null;


          // Hide Cart, Wishlist, and Home for Owner
          if ((label === 'Cart' || label === 'Wishlist' || label === 'Home') && isOwner) return null;

          const isActive = pathname === href;
          const isActionItem = label === 'Cart' || label === 'Wishlist';

          if (label === 'History') {
            return (
              <HistorySheet key={label}>
                <button
                  className={cn(
                    'flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-6 w-6", isActive ? "fill-current" : "")} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              </HistorySheet>
            );
          }

          if (label === 'Company Orders') {
            return (
              <CompanyOrdersSheet key={label}>
                <button
                  className={cn(
                    'flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                    isActive && 'text-primary'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-6 w-6", isActive ? "fill-current" : "")} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              </CompanyOrdersSheet>
            );
          }



          if (isActionItem) {
            return (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Cart') useCart.getState().setCartOpen(true);
                  if (label === 'Wishlist') useWishlist.getState().setWishlistOpen(true);
                }}
                className={cn(
                  'flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary',
                  isActive && 'text-primary'
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-6 w-6", isActive ? "fill-current" : "")} strokeWidth={1.5} />
                  {mounted && label === 'Wishlist' && wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-in zoom-in">
                      {wishlist.length}
                    </span>
                  )}
                  {mounted && label === 'Cart' && cart.length > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-in zoom-in">
                      {cart.length}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          }

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
