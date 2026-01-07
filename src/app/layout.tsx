
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { CartProvider } from '@/context/CartContext';
import { headers } from 'next/headers';
import { fetchCompanyDetails } from '@/services/company.service';
import { StoreInitializer } from '@/components/providers/StoreInitializer';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'ShopSphere',
  description: 'A modern e-commerce experience.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  // Use middleware-provided domain or fallback
  const companyDomain = headersList.get('x-company-domain') || 'babaihomefoods';

  const companyDetails = await fetchCompanyDetails(companyDomain);

  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full bg-background">
        {companyDetails && <StoreInitializer companyDetails={companyDetails} />}
        <QueryProvider>
          <div className="relative flex min-h-full w-full flex-col">
            <Header companyName={companyDetails?.companyName} />
            <main className="flex-1 pb-24">{children}</main>
            <BottomNavigation />
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
