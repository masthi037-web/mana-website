import { headers } from 'next/headers';
import Image from 'next/image';
import { fetchCategories } from '@/services/product.service';
import { fetchCompanyDetails } from '@/services/company.service';
import HomeClient from '@/components/home/HomeClient';
import { ProductInitializer } from '@/components/providers/ProductInitializer';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, ShieldCheck, Star, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function Home() {
  const headersList = await headers();
  // Middleware handles extraction and localhost fallback
  const companyDomain = headersList.get("x-company-domain") || 'babaihomefoods';

  // Chained Data Fetching: Company -> Products
  const company = await fetchCompanyDetails(companyDomain);

  // Use companyId if available, otherwise empty array (or handle error)
  const categories = company ? await fetchCategories(company.companyId) : [];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] md:h-[600px] overflow-hidden">
        <Image
          src="https://picsum.photos/seed/homepage-banner/1920/1080"
          alt="Artisanal Goods Banner"
          fill
          className="object-cover animate-in fade-in duration-1000 zoom-in-105"
          data-ai-hint="vibrant spices table"
          priority
        />
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent md:via-background/20" />

        <div className="relative container mx-auto h-full px-6 flex flex-col justify-center gap-6">
          <div className="max-w-xl space-y-4 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
              New Arrivals
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight text-foreground leading-[1.1]">
              Taste of <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Tradition</span>
            </h1>
            <p className="text-xl text-muted-foreground md:text-2xl font-light">
              Handcrafted with passion, delivering authentic flavors straight to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                <a href="#new-arrivals">
                  Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="container mx-auto px-6 -mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">100% Authentic</h3>
              <p className="text-sm text-muted-foreground">Original recipes & ingredients</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">Fresh to your door.</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">Hand-picked by experts</p>
            </div>
          </div>
        </div>
      </section>

      <ProductInitializer categories={categories} />
      <HomeClient initialCategories={categories} />
    </div>
  );
}
