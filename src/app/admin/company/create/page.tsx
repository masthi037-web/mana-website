'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/admin.service';
import { CompanyRegistrationRequest } from '@/lib/api-types';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';

export default function CreateCompanyPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Initial Form State - Empty defaults as requested
    const [formData, setFormData] = useState<CompanyRegistrationRequest>({
        companyName: '',
        companyDomain: '',
        companyPhone: '',
        companyMessage: '',
        companyEmail: '',
        ownerName: '',
        companyStatus: 'ACTIVE',
        gstNumber: '',
        logo: '',
        banner: '',
        razorpayKeyId: '',
        razorpayKeySecret: '',
        companyCoupon: 'WELCOME&&&5&&&1000',
        ownerEmail: '',
        ownerPhone: '',
        companyAddress: '',
        companyCity: '',
        companyState: '',
        companyPinCode: '',
        companyFssAi: '',
        companyProductCategory: '',
        deliveryBetween: '',
        companyEstDate: new Date().toISOString().split('T')[0], // Default to today
        averageRating: 0.0,
        totalRating: 0,
        noOfRatings: 0,
        freeDeliveryCost: '',
        deliveryCost: '',
        minimumOrderCost: '',
        socialMediaLink: '',
        razorpay: false,
        upiQrCode: null,
        upiId: '',
        about: ''
    });

    useEffect(() => {
        // Admin Access Check
        const role = localStorage.getItem('userRole');
        if (role !== 'ADMIN') {
            toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
            router.push('/');
            return;
        }
        setIsAdmin(true);
    }, [router, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, razorpay: checked }));
    };

    const handleImageChange = (field: 'logo' | 'banner' | 'upiQrCode', value: string | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.companyName || !formData.companyDomain || !formData.companyEmail) {
            toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const response = await adminService.registerCompany(formData);
            if (response) {
                toast({ title: "Success", description: "Company registered successfully!" });
                router.push('/admin/companies');
            }
        } catch (error) {
            console.error("Registration Failed", error);
            toast({ title: "Error", description: "Failed to register company. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Register New Company</h1>
                    <p className="text-muted-foreground">Create a new tenant store in the system.</p>
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
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="e.g. My Store" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyDomain">Domain (subdomain) *</Label>
                            <Input id="companyDomain" name="companyDomain" value={formData.companyDomain} onChange={handleChange} required placeholder="e.g. mystore" />
                            <p className="text-xs text-muted-foreground">Will be accessible at {formData.companyDomain || 'mystore'}.manabuy.in</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyEmail">Company Email *</Label>
                            <Input id="companyEmail" name="companyEmail" type="email" value={formData.companyEmail} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyStatus">Status</Label>
                            <Input id="companyStatus" name="companyStatus" value={formData.companyStatus || ''} onChange={handleChange} placeholder="ACTIVE" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyPhone">Company Phone *</Label>
                            <Input id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyEstDate">Establishment Date</Label>
                            <Input id="companyEstDate" name="companyEstDate" type="date" value={formData.companyEstDate} onChange={handleChange} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="companyMessage">Welcome Message</Label>
                            <Input id="companyMessage" name="companyMessage" value={formData.companyMessage || ''} onChange={handleChange} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="about">About Us</Label>
                            <Textarea id="about" name="about" value={formData.about} onChange={handleChange} placeholder="Describe the company..." />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Owner Details */}
                <Card>
                    <CardHeader><CardTitle>Owner Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="ownerName">Owner Name *</Label>
                            <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerEmail">Owner Email *</Label>
                            <Input id="ownerEmail" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerPhone">Owner Phone *</Label>
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

                {/* 5. Payments & Branding */}
                <Card>
                    <CardHeader><CardTitle>Payments & Branding</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Razorpay Toggle */}
                            <div className="col-span-2 flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
                                <Switch
                                    id="razorpay"
                                    checked={formData.razorpay || false}
                                    onCheckedChange={handleSwitchChange}
                                />
                                <Label htmlFor="razorpay" className="flex-1 cursor-pointer">Enable Razorpay Payment Gateway</Label>
                            </div>

                            {formData.razorpay && (
                                <>
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                                        <Input id="razorpayKeyId" name="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} required={formData.razorpay} />
                                    </div>
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                                        <Input id="razorpayKeySecret" name="razorpayKeySecret" type="password" value={formData.razorpayKeySecret || ''} onChange={handleChange} required={formData.razorpay} />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="upiId">UPI ID</Label>
                                <Input id="upiId" name="upiId" value={formData.upiId || ''} onChange={handleChange} placeholder="username@upi" />
                            </div>

                            <div className="space-y-2">
                                <Label>UPI QR Code</Label>
                                <ImageUpload
                                    value={formData.upiQrCode || ''}
                                    onChange={(val) => handleImageChange('upiQrCode', val)}
                                    companyDomain={formData.companyDomain || 'temp'}
                                    maxFiles={1}
                                    label="Upload QR Code"
                                />
                            </div>

                            <Separator className="col-span-2 my-2" />

                            <div className="space-y-2">
                                <Label>Company Logo</Label>
                                <ImageUpload
                                    value={formData.logo}
                                    onChange={(val) => handleImageChange('logo', val)}
                                    companyDomain={formData.companyDomain || 'temp'}
                                    maxFiles={1}
                                    label="Upload Logo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Banner Image</Label>
                                <ImageUpload
                                    value={formData.banner}
                                    onChange={(val) => handleImageChange('banner', val)}
                                    companyDomain={formData.companyDomain || 'temp'}
                                    maxFiles={1}
                                    label="Upload Banner"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 pt-4 pb-20">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={isLoading || !formData.companyDomain} className="min-w-[150px]">
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Register Company'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
