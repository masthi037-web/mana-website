"use client";

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface FooterProps {
    companyName?: string;
    socialLinks?: string | null;
}

export function Footer({ companyName = "ShopSphere", socialLinks }: FooterProps) {
    const { isOwner } = useAuth();

    // Parse social links
    const links = socialLinks?.split(',') || [];

    const getLink = (keyword: string) => {
        const found = links.find(l => l.toLowerCase().includes(keyword));
        return found ? found.trim() : null;
    };

    const instagram = getLink('instagram') || '#';
    const facebook = getLink('facebook') || '#';
    const twitter = getLink('twitter') || getLink('x.com') || '#';

    return (
        <footer className="relative bg-background border-t border-border/40 overflow-hidden pt-24 pb-12">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[128px] translate-y-1/2 pointer-events-none" />

            <div className="container relative mx-auto px-6 z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-20">
                    {/* Brand Column (4 cols) */}
                    <div className="md:col-span-4 space-y-6">
                        <Link href="/" className="inline-block group">
                            <span className="font-headline text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:to-primary transition-all duration-500">
                                {companyName}
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed font-light text-base max-w-sm">
                            Curating the finest artisanal goods for the modern lifestyle.
                            We believe in quality, authenticity, and style in every package we deliver.
                        </p>
                        <div className="flex gap-3 pt-2">
                            {links.some(l => l.includes('instagram')) && (
                                <SocialIcon icon={Instagram} href={instagram} label="Instagram" />
                            )}
                            {links.some(l => l.includes('facebook')) && (
                                <SocialIcon icon={Facebook} href={facebook} label="Facebook" />
                            )}
                            {(links.some(l => l.includes('twitter')) || links.some(l => l.includes('x.com'))) && (
                                <SocialIcon icon={Twitter} href={twitter} label="Twitter" />
                            )}

                            {!links.some(l => l.includes('instagram')) && <SocialIcon icon={Instagram} href="#" label="Instagram" />}
                            {!links.some(l => l.includes('facebook')) && <SocialIcon icon={Facebook} href="#" label="Facebook" />}
                            {!links.some(l => l.includes('twitter')) && !links.some(l => l.includes('x.com')) && <SocialIcon icon={Twitter} href="#" label="Twitter" />}
                        </div>
                    </div>

                    {/* Quick Links (2 cols) */}
                    <div className="md:col-span-2 md:col-start-6">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-8 font-headline">Explore</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground/80 font-medium">
                            {!isOwner && <li><FooterLink href="/">Home</FooterLink></li>}
                            {!isOwner && <li><FooterLink href="/wishlist">Wishlist</FooterLink></li>}
                            {!isOwner && <li><FooterLink href="/cart">Cart</FooterLink></li>}
                        </ul>
                    </div>

                    {/* Customer Service (2 cols) */}
                    <div className="md:col-span-2">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-8 font-headline">Support</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground/80 font-medium">
                            <li><FooterLink href="#">Help Center</FooterLink></li>
                            <li><FooterLink href="#">Shipping & Returns</FooterLink></li>
                            <li><FooterLink href="#">Privacy Policy</FooterLink></li>
                            <li><FooterLink href="#">Terms of Service</FooterLink></li>
                            <li><FooterLink href="#">Track Order</FooterLink></li>
                        </ul>
                    </div>

                    {/* Newsletter (4 cols) */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-primary mb-8 font-headline">Stay Updated</h3>
                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                            Subscribe to our newsletter to receive early access to new drops and exclusive offers.
                        </p>
                        <div className="relative group">
                            <Input
                                placeholder="Enter your email address"
                                className="bg-secondary/30 border-0 border-b border-foreground/10 rounded-none px-0 py-6 focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted-foreground/50"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="absolute right-0 top-1/2 -translate-y-1/2 hover:bg-transparent text-primary hover:text-primary/80"
                            >
                                <ArrowRight className="h-5 w-5 transition-transform group-focus-within:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/40 mb-12" />

                <div className="flex flex-col lg:flex-row justify-between items-center gap-8 text-sm text-muted-foreground">
                    {/* Developer Credits Pill */}
                    <div className="bg-surface/50 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full py-2 px-2 pr-6 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group cursor-default">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <span className="font-bold text-xs">M</span>
                        </div>
                        <div className="flex flex-col leading-none gap-0.5">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Developed by</span>
                            <a
                                href="https://www.manabuy.in"
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                                Mana Buy Team
                                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                            </a>
                        </div>
                        <div className="h-8 w-px bg-border/50 mx-1" />
                        <a
                            href="tel:6303191318"
                            className="font-mono font-medium hover:text-primary transition-colors flex items-center gap-2 text-xs"
                        >
                            <Phone className="h-3 w-3" />
                            6303191318
                        </a>
                    </div>

                    {/* Standard Copyright & Contact */}
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 opacity-80">
                        <p>© {new Date().getFullYear()} Mana Buy. All rights reserved.</p>
                        <a href="mailto:masthanmasthi037@gmail.com" className="hover:text-foreground transition-colors flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            masthanmasthi037@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon: Icon, href, label }: { icon: React.ElementType, href: string, label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/50 border border-transparent hover:border-border/50 hover:bg-background hover:shadow-lg transition-all duration-300 group"
        >
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
        </a>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className={cn(
            "group flex items-center gap-2 hover:text-primary transition-all duration-300",
            "relative w-fit after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
        )}>
            {children}
        </Link>
    );
}
