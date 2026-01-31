import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { fetchCompanyDetails } from '@/services/company.service';
import { StoreInitializer } from '@/components/providers/StoreInitializer';
import QueryProvider from '@/providers/QueryProvider';
import { resolveTenantConfig } from '@/config/tenant-config';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Footer } from '@/components/layout/Footer';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { GlobalScrollHandler } from '@/components/common/GlobalScrollHandler';

interface AppShellProps {
    children: React.ReactNode;
    companyDomain: string;
}

export default async function AppShell({ children, companyDomain }: AppShellProps) {
    const companyDetails = await fetchCompanyDetails(companyDomain);
    const tenantConfig = resolveTenantConfig(companyDomain);

    // Inject dynamic company ID into tenant config
    if (companyDetails?.companyId) {
        tenantConfig.companyId = companyDetails.companyId;
    }

    return (
        <ThemeProvider config={tenantConfig}>
            <GlobalScrollHandler />
            {companyDetails && <StoreInitializer companyDetails={companyDetails} />}
            <QueryProvider>
                <div className="relative flex min-h-full w-full flex-col">
                    <Header companyName={companyDetails?.companyName} fetchAllAtOnce={tenantConfig.fetchAllAtOnce ?? true} />
                    <main className="flex-1 pb-24">{children}</main>
                    <Footer companyName={companyDetails?.companyName} socialLinks={companyDetails?.socialMediaLink} />
                    <BottomNavigation />
                </div>
                <WishlistSheet />
                <Toaster />
            </QueryProvider>
        </ThemeProvider>
    );
}
