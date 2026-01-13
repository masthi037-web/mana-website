import { headers } from 'next/headers';
import Image from 'next/image';
import { fetchCategories } from '@/services/product.service';
import { fetchCompanyDetails } from '@/services/company.service';
import HomeClient from '@/components/home/HomeClient';
import { ProductInitializer } from '@/components/providers/ProductInitializer';
import { ShopNowButton } from '@/components/home/ShopNowButton';
import { ArrowRight, ChevronRight, ShieldCheck, Star, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const headersList = await headers();
  // Middleware handles extraction and localhost fallback
  const headerDomain = headersList.get("x-company-domain");
  // FORCE HARDCODED FOR DEBUGGING IF NEEDED
  const companyDomain = (headerDomain && headerDomain !== 'localhost') ? headerDomain : 'babaihomefoods';

  // Chained Data Fetching: Company -> Products
  const company = await fetchCompanyDetails(companyDomain);

  // Use companyId if available, otherwise empty array (or handle error)
  const categories = company ? await fetchCategories(company.companyId) : [];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] md:h-[600px] overflow-hidden">
        <Image
          src={company?.banner || "https://picsum.photos/seed/homepage-banner/1920/1080"}
          alt={company?.companyName || "Artisanal Goods Banner"}
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
              <ShopNowButton />
            </div>
          </div>
        </div>
      </section>


      <ProductInitializer categories={categories} />
      <HomeClient
        initialCategories={categories}
        companyCoupon={company?.companyCoupon}
        companyPhone={company?.companyPhone}
        companyName={company?.companyName}
      />
    </div>
  );
}
