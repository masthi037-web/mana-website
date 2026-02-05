'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/admin.service';
import { UpdateCompanyRequest, CompanyDetails } from '@/lib/api-types';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Loader2, ArrowLeft, Building2, Save } from 'lucide-react';

export default function EditCompanyPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Form State
    const [formData, setFormData] = useState<UpdateCompanyRequest>({
        companyId: '',
        companyName: '',
        companyDomain: '',
        companyPhone: '',
        companyMessage: '',
        companyEmail: '',
        ownerName: '',
        companyStatus: '',
        gstNumber: '',
        logo: '',
        banner: '',
        razorpayKeyId: '',
        razorpayKeySecret: '',
        companyCoupon: '',
        ownerEmail: '',
        ownerPhone: '',
        companyAddress: '',
        companyCity: '',
        companyState: '',
        companyPinCode: '',
        companyFssAi: '',
        companyProductCategory: '',
        deliveryBetween: '',
        companyEstDate: '',
        averageRating: 0,
        totalRating: 0,
        noOfRatings: 0,
        freeDeliveryCost: '',
        deliveryCost: '',
        minimumOrderCost: '',
        socialMediaLink: '',
        razorpay: null,
        upiQrCode: null,
        upiId: null,
        about: ''
    });

    useEffect(() => {
        const init = async () => {
            // Admin Access Check
            const role = localStorage.getItem('userRole');
            if (role !== 'ADMIN') {
                router.push('/');
                return;
            }

            const companyId = params.id as string;
            if (!companyId) return;

            try {
                // Fetch All and Find (Since we don't have getById specific endpoint requested yet)
                const companies = await adminService.getAllCompanies();
                const company = companies.find(c => String(c.companyId) === companyId);

                if (company) {
                    // Map CompanyDetails to UpdateCompanyRequest
                    setFormData({
                        companyId: String(company.companyId),
                        companyName: company.companyName || '',
                        companyDomain: company.companyDomain || '',
                        companyPhone: company.companyPhone || '',
                        companyMessage: company.companyMessage || '',
                        companyEmail: company.companyEmail || '',
                        ownerName: company.ownerName || '',
                        companyStatus: company.companyStatus || '',
                        gstNumber: company.gstNumber || '',
                        logo: company.logo || '',
                        banner: company.banner || '',
                        razorpayKeyId: company.razorpayKeyId || '',
                        razorpayKeySecret: company.razorpayKeySecret || '',
                        companyCoupon: company.companyCoupon || '',
                        ownerEmail: company.ownerEmail || '',
                        ownerPhone: company.ownerPhone || '',
                        companyAddress: company.companyAddress || '',
                        companyCity: company.companyCity || '',
                        companyState: company.companyState || '',
                        companyPinCode: company.companyPinCode || '',
                        companyFssAi: company.companyFssAi || '',
                        companyProductCategory: company.companyProductCategory || '',
                        deliveryBetween: company.deliveryBetween || '',
                        companyEstDate: company.companyEstDate || '',
                        averageRating: company.averageRating || 0,
                        totalRating: company.totalRating || 0,
                        noOfRatings: company.noOfRatings || 0,
                        freeDeliveryCost: company.freeDeliveryCost || '',
                        deliveryCost: company.deliveryCost || '',
                        minimumOrderCost: company.minimumOrderCost || '',
                        socialMediaLink: company.socialMediaLink || '',
                        razorpay: company.razorpay,
                        upiQrCode: company.upiQrCode || '',
                        upiId: company.upiId || '',
                        about: company.about || '',
                    });
                } else {
                    toast({ title: "Error", description: "Company not found", variant: "destructive" });
                    router.push('/admin/companies');
                }
            } catch (error) {
                console.error("Failed to load company", error);
                toast({ title: "Error", description: "Failed to load company details details", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [params.id, router, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (field: 'logo' | 'banner' | 'upiQrCode', value: string | null) => {
        setFormData(prev => ({ ...prev, [field]: value || '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await adminService.updateCompany(formData);
            toast({ title: "Success", description: "Company updated successfully!" });
            router.push('/admin/companies');
        } catch (error) {
            console.error("Update Failed", error);
            toast({ title: "Error", description: "Failed to update company.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Edit Company</h1>
                    <p className="text-muted-foreground">{formData.companyName} ({formData.companyDomain})</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Basic Company Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Company Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyDomain">Domain (ReadOnly)</Label>
                            <Input id="companyDomain" name="companyDomain" value={formData.companyDomain} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyStatus">Status</Label>
                            <Input id="companyStatus" name="companyStatus" value={formData.companyStatus || ''} onChange={handleChange} placeholder="ACTIVE / INACTIVE" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyEmail">Company Email</Label>
                            <Input id="companyEmail" name="companyEmail" type="email" value={formData.companyEmail} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyPhone">Company Phone</Label>
                            <Input id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} required />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="companyMessage">Welcome Message</Label>
                            <Input id="companyMessage" name="companyMessage" value={formData.companyMessage || ''} onChange={handleChange} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="about">About Us</Label>
                            <Textarea id="about" name="about" value={formData.about} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Owner Details */}
                <Card>
                    <CardHeader><CardTitle>Owner Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="ownerName">Owner Name</Label>
                            <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerEmail">Owner Email</Label>
                            <Input id="ownerEmail" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerPhone">Owner Phone</Label>
                            <Input id="ownerPhone" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Address & Legal */}
                <Card>
                    <CardHeader><CardTitle>Address & Legal</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="companyAddress">Street Address</Label>
                            <Input id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyCity">City</Label>
                            <Input id="companyCity" name="companyCity" value={formData.companyCity} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyState">State</Label>
                            <Input id="companyState" name="companyState" value={formData.companyState} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyPinCode">Pin Code</Label>
                            <Input id="companyPinCode" name="companyPinCode" value={formData.companyPinCode} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gstNumber">GST Number</Label>
                            <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyFssAi">FSSAI License</Label>
                            <Input id="companyFssAi" name="companyFssAi" value={formData.companyFssAi} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Configuration & Settings */}
                <Card>
                    <CardHeader><CardTitle>Store Configuration</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyProductCategory">Product Category</Label>
                            <Input id="companyProductCategory" name="companyProductCategory" value={formData.companyProductCategory} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryBetween">Delivery Timeframe</Label>
                            <Input id="deliveryBetween" name="deliveryBetween" value={formData.deliveryBetween} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minimumOrderCost">Min Order Cost</Label>
                            <Input id="minimumOrderCost" name="minimumOrderCost" value={formData.minimumOrderCost} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="freeDeliveryCost">Free Delivery Above</Label>
                            <Input id="freeDeliveryCost" name="freeDeliveryCost" value={formData.freeDeliveryCost} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryCost">Delivery Cost (Fixed)</Label>
                            <Input id="deliveryCost" name="deliveryCost" value={formData.deliveryCost || ''} onChange={handleChange} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="companyCoupon">Default Coupons</Label>
                            <Input id="companyCoupon" name="companyCoupon" value={formData.companyCoupon} onChange={handleChange} placeholder="CODE&&&PERCENT&&&MIN_ORDER" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="socialMediaLink">Social Media Link</Label>
                            <Input id="socialMediaLink" name="socialMediaLink" value={formData.socialMediaLink || ''} onChange={handleChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Images & Branding */}
                <Card>
                    <CardHeader><CardTitle>Branding & Media</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label>Company Logo</Label>
                                <ImageUpload
                                    value={formData.logo}
                                    onChange={(val) => handleImageChange('logo', val)}
                                    companyDomain={formData.companyDomain}
                                    maxFiles={1}
                                    label="Upload Logo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Banner Image</Label>
                                <ImageUpload
                                    value={formData.banner}
                                    onChange={(val) => handleImageChange('banner', val)}
                                    companyDomain={formData.companyDomain}
                                    maxFiles={1}
                                    label="Upload Banner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>UPI QR Code</Label>
                                <ImageUpload
                                    value={formData.upiQrCode || ''}
                                    onChange={(val) => handleImageChange('upiQrCode', val)}
                                    companyDomain={formData.companyDomain}
                                    maxFiles={1}
                                    label="Upload QR Code"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 pt-4 pb-20">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={isSaving || !formData.companyDomain} className="min-w-[150px]">
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
