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

import { customerService } from '@/services/customer.service';
import { CustomerAddress } from '@/lib/api-types';
import { Plus, Trash2, Pencil } from 'lucide-react';

export function AddressSheet({ children }: { children?: React.ReactNode }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // View State
    const [view, setView] = useState<'list' | 'add'>('list');
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        streetAddress: '',
        pinCode: '',
        city: '',
        state: '',
        label: 'Home' as 'Home' | 'Work' | 'Other',
        customName: ''
    });
    const [originalData, setOriginalData] = useState<typeof formData | null>(null);

    // ...

    const handleEdit = (address: CustomerAddress) => {
        setEditingId(address.customerAddressId);
        const isCustom = !['Home', 'Work'].includes(address.addressName);
        const initialData = {
            streetAddress: address.customerDrNum || '',
            pinCode: address.customerPin,
            city: address.customerCity,
            state: address.customerState,
            label: (isCustom ? 'Other' : address.addressName) as 'Home' | 'Work' | 'Other',
            customName: isCustom ? address.addressName : ''
        };
        setFormData(initialData);
        setOriginalData(initialData);
        setView('add');
    };

    const resetForm = () => {
        setFormData({
            streetAddress: '',
            pinCode: '',
            city: '',
            state: '',
            label: 'Home',
            customName: ''
        });
        setEditingId(null);
        setOriginalData(null);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.streetAddress || !formData.pinCode) {
            toast({ title: "Missing Details", description: "Please fill in address fields.", variant: "destructive" });
            return;
        }

        if (formData.label === 'Other' && !formData.customName) {
            toast({ title: "Missing Name", description: "Please enter a name for this address.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        const finalAddressName = formData.label === 'Other' ? formData.customName : formData.label;

        try {
            if (editingId) {
                // UPDATE
                await customerService.updateAddress({
                    customerAddressId: editingId,
                    addressName: finalAddressName,
                    customerDrNum: formData.streetAddress,
                    customerRoad: formData.streetAddress, // Duplicating for now as per previous pattern
                    customerCity: formData.city,
                    customerState: formData.state,
                    customerCountry: 'India',
                    customerPin: formData.pinCode
                });
                toast({ title: "Address Updated", description: "Changes saved successfully" });
            } else {
                // CREATE
                const customerId = localStorage.getItem('customerId');
                if (!customerId) {
                    toast({ title: "Error", description: "User ID not found. Please login again.", variant: "destructive" });
                    return;
                }

                await customerService.createAddress({
                    customerId: Number(customerId),
                    addressName: finalAddressName,
                    customerDrNum: formData.streetAddress,
                    customerRoad: formData.streetAddress,
                    customerCity: formData.city,
                    customerState: formData.state,
                    customerCountry: 'India',
                    customerPin: formData.pinCode
                });
                toast({ title: "Address Saved", description: "Successfully added new address" });
            }

            // Refresh and switch to list
            await fetchAddresses();
            setView('list');
            resetForm();

        } catch (error) {
            toast({ title: "Error", description: "Failed to save address", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setView('list');
                resetForm();
            }
        }}>
            {children && <SheetTrigger asChild>{children}</SheetTrigger>}
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full overflow-y-auto">
                <SheetHeader className="pb-6 border-b">
                    <SheetTitle>
                        {view === 'list' ? 'My Addresses' : (editingId ? 'Edit Address' : 'Add New Address')}
                    </SheetTitle>
                </SheetHeader>

                {/* VIEW: ADDRESS LIST */}
                {view === 'list' && (
                    <div className="flex-1 py-6 flex flex-col px-1">
                        {isLoading && addresses.length === 0 ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-600" /></div>
                        ) : addresses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center ring-4 ring-teal-50/50">
                                    <MapPin className="h-10 w-10 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-headline text-slate-800">No Addresses</h3>
                                    <p className="text-slate-500 max-w-[200px] mx-auto text-sm">Add your delivery location to get started.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((addr, idx) => (
                                    <div key={idx} className="group relative p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-teal-100 transition-all duration-300">
                                        <div className="flex items-start gap-4">
                                            {/* Icon Box */}
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                                                addr.addressName === 'Home' ? "bg-blue-50 text-blue-600" :
                                                    addr.addressName === 'Work' ? "bg-orange-50 text-orange-600" :
                                                        "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {addr.addressName === 'Home' ? <Home className="h-5 w-5" /> :
                                                    addr.addressName === 'Work' ? <Briefcase className="h-5 w-5" /> :
                                                        <MapPin className="h-5 w-5" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-[15px] font-headline text-slate-800">{addr.addressName}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 -mr-2 -mt-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                                        onClick={() => handleEdit(addr)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                                                    {addr.customerDrNum ? `${addr.customerDrNum}, ` : ''}{addr.customerRoad}
                                                </p>
                                                <p className="text-[13px] text-slate-500 font-medium">
                                                    {addr.customerCity}, {addr.customerState} - {addr.customerPin}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto pt-8">
                            <Button
                                className="w-full h-14 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/30 text-teal-700 hover:bg-teal-50 hover:border-teal-300 hover:shadow-sm transition-all duration-300 font-bold text-base"
                                variant="outline"
                                onClick={() => {
                                    resetForm();
                                    setView('add');
                                }}
                            >
                                <Plus className="mr-2 h-5 w-5" /> Add New Address
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW: ADD/EDIT ADDRESS FORM */}
                {view === 'add' && (
                    <div className="flex-1 py-6 space-y-8 animate-in slide-in-from-right-5 duration-300">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 mb-2 text-muted-foreground"
                            onClick={() => {
                                setView('list');
                                resetForm();
                            }}
                        >
                            <Navigation className="h-4 w-4 mr-1 rotate-180" /> Back to List
                        </Button>

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
                                    <div className="space-y-3">
                                        <Label htmlFor="state" className="text-sm font-bold text-slate-700 ml-1">State</Label>
                                        <Select value={formData.state} onValueChange={(val) => handleChange('state', val)}>
                                            <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 font-bold text-slate-700 px-4 data-[state=open]:border-teal-500 data-[state=open]:ring-4 data-[state=open]:ring-teal-500/10 shadow-sm">
                                                <SelectValue placeholder="Select your state" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
                                                <SelectItem value="AP" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Andhra Pradesh</SelectItem>
                                                <SelectItem value="TS" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Telangana</SelectItem>
                                                <SelectItem value="KA" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Karnataka</SelectItem>
                                                <SelectItem value="TN" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Tamil Nadu</SelectItem>
                                                <SelectItem value="MH" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Maharashtra</SelectItem>
                                                <SelectItem value="DL" className="rounded-xl py-3.5 px-4 my-1 font-semibold text-slate-600 focus:bg-teal-50 focus:text-teal-700 cursor-pointer data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700">Delhi</SelectItem>
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

                            {formData.label === 'Other' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3 relative">
                                    <Label htmlFor="customName" className="sr-only">Custom Name</Label>
                                    <Input
                                        id="customName"
                                        placeholder="e.g. Grandma's House, My Office"
                                        className="h-12 bg-secondary/30 border-transparent focus:border-primary focus:bg-background transition-all"
                                        value={formData.customName}
                                        onChange={(e) => handleChange('customName', e.target.value)}
                                        autoFocus
                                    />
                                    <Pencil className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="pt-4 mt-auto border-t bg-background">
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20"
                                onClick={handleSubmit}
                                disabled={isLoading || (editingId !== null && JSON.stringify(formData) === JSON.stringify(originalData))}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        {editingId ? 'Update Address' : 'Save Address'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
