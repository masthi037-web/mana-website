
import type { Metadata } from 'next';
import './globals.css';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import Loading from './loading';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ManaBuy',
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

  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <Suspense fallback={<Loading />}>
          <AppShell companyDomain={companyDomain}>
            {children}
          </AppShell>
        </Suspense>
      </body>
    </html>
  );
}
