'use client';

import React, { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    User,
    Phone,
    MapPin,
    Home,
    Briefcase,
    Navigation,
    Loader2,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function AddressSheet({ children }: { children?: React.ReactNode }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        streetAddress: '',
        pinCode: '',
        city: '',
        state: '',
        label: 'Home' as 'Home' | 'Work' | 'Other'
    });

    // Listen for global open event
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-address-sidebar', handleOpen);
        return () => window.removeEventListener('open-address-sidebar', handleOpen);
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.fullName || !formData.phoneNumber || !formData.streetAddress || !formData.pinCode) {
            toast({
                title: "Missing Details",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsOpen(false);
            toast({
                title: "Address Saved",
                description: "Your delivery address has been added successfully.",
            });
            // Reset form
            setFormData(prev => ({ ...prev, streetAddress: '', pinCode: '' }));

            // Optionally redirect to checkout or payment if needed
            // For now, we just close the sheet as per flow
        }, 1500);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {children && <SheetTrigger asChild>{children}</SheetTrigger>}
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full overflow-y-auto">
                <SheetHeader className="pb-6 border-b">
                    <SheetTitle>Add Address</SheetTitle>
                </SheetHeader>

                <div className="flex-1 py-6 space-y-8">

                    {/* Contact Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Details</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        placeholder="e.g. John Doe"
                                        className="pl-10 h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="e.g. +91 9999000000"
                                        className="pl-10 h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location Details</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="street">Street Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="street"
                                        placeholder="e.g. 123 Main St, Apt 4B"
                                        className="w-full min-h-[80px] pl-10 pt-3 rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:bg-background"
                                        value={formData.streetAddress}
                                        onChange={(e) => handleChange('streetAddress', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pin Code</Label>
                                <Input
                                    id="pincode"
                                    placeholder="Pin Code"
                                    className="h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all"
                                    value={formData.pinCode}
                                    onChange={(e) => handleChange('pinCode', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        className="h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Select value={formData.state} onValueChange={(val) => handleChange('state', val)}>
                                        <SelectTrigger className="h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AP">Andhra Pradesh</SelectItem>
                                            <SelectItem value="TS">Telangana</SelectItem>
                                            <SelectItem value="KA">Karnataka</SelectItem>
                                            <SelectItem value="TN">Tamil Nadu</SelectItem>
                                            <SelectItem value="MH">Maharashtra</SelectItem>
                                            <SelectItem value="DL">Delhi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save As Chips */}
                    <div className="space-y-4">
                        <Label>Save Address As</Label>
                        <div className="flex gap-3">
                            {[
                                { id: 'Home', icon: Home, label: 'Home' },
                                { id: 'Work', icon: Briefcase, label: 'Work' },
                                { id: 'Other', icon: MapPin, label: 'Other' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleChange('label', type.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 text-sm font-medium",
                                        formData.label === type.id
                                            ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-teal-200 hover:bg-teal-50"
                                    )}
                                >
                                    <type.icon className={cn("w-4 h-4", formData.label === type.id ? "text-white" : "text-slate-400")} />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-auto border-t bg-background">
                    <Button
                        className="w-full h-12 rounded-xl text-lg font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Save Address
                            </>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
