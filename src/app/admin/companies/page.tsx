'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { CompanyDetails } from '@/lib/api-types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, Edit, ExternalLink, Loader2, MapPin, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function CompaniesListPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<CompanyDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            // Admin Access Check
            const role = localStorage.getItem('userRole');
            if (role !== 'ADMIN') {
                toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
                router.push('/');
                return;
            }

            try {
                const data = await adminService.getAllCompanies();
                setCompanies(data || []);
            } catch (error) {
                console.error("Failed to fetch companies", error);
                toast({ title: "Error", description: "Failed to load companies.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    }, [toast, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-primary" />
                        Registered Companies
                    </h1>
                    <p className="text-muted-foreground">Manage all tenant stores ({companies.length})</p>
                </div>
                <Button onClick={() => router.push('/admin/company/create')}>
                    Register New Company
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                    <Card key={company.companyId} className="flex flex-col hover:shadow-md transition-shadow">
                        <div className="relative h-32 w-full bg-muted/50 rounded-t-xl overflow-hidden">
                            {company.banner && (
                                <Image
                                    src={company.banner}
                                    alt={company.companyName}
                                    fill
                                    className="object-cover"
                                />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <Badge variant={company.companyStatus === 'ACTIVE' ? 'default' : 'secondary'} className={company.companyStatus === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                    {company.companyStatus || 'INACTIVE'}
                                </Badge>
                            </div>
                            <div className="absolute -bottom-6 left-4 border-4 border-background rounded-full overflow-hidden h-16 w-16 bg-white shadow-sm z-10">
                                {company.logo ? (
                                    <Image
                                        src={company.logo}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <CardHeader className="pt-10 pb-2">
                            <CardTitle className="text-xl font-bold truncate">{company.companyName}</CardTitle>
                            <a
                                href={`https://${company.companyDomain}.manabuy.in`}
                                target="_blank"
                                className="text-sm text-primary hover:underline flex items-center gap-1 w-fit"
                            >
                                {company.companyDomain}.manabuy.in
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground pb-4">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{company.companyCity}, {company.companyState}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0" />
                                <span>{company.companyPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="truncate">{company.companyEmail}</span>
                            </div>
                        </CardContent>

                        <CardFooter className="border-t pt-4">
                            <Button
                                variant="outline"
                                className="w-full gap-2 hover:border-primary hover:text-primary"
                                onClick={() => router.push(`/admin/company/edit/${company.companyId}`)}
                            >
                                <Edit className="h-4 w-4" />
                                Edit Details
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {companies.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">No Companies Found</h3>
                        <p>Get started by registering a new company.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
