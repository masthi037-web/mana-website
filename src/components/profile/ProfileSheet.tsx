'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, LogOut, User, Settings, CreditCard, Heart, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth.service';
import { customerService } from '@/services/customer.service';
import { HistorySheet } from '@/components/history/HistorySheet';
import { cn } from '@/lib/utils';
import { useTenant } from '@/components/providers/TenantContext';
import { useWishlist } from '@/hooks/use-wishlist';

export function ProfileSheet({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { toast } = useToast();
    const { domain, companyId } = useTenant();
    const { setWishlistOpen } = useWishlist();

    // State for Auth Flow
    const [view, setView] = React.useState<'profile' | 'login-phone' | 'login-otp' | 'edit-profile'>('login-phone');
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [resendTimer, setResendTimer] = React.useState(0);

    // State for Feedback
    const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Profile Edit State
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [customerData, setCustomerData] = React.useState<any>(null);

    // Mock logged in state - in real app check cookie/token existence
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [userRole, setUserRole] = React.useState<string | null>(null);

    // State for Sheet Open
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    React.useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setFeedback(null); // Clear feedback on open
        };
        window.addEventListener('open-profile-sidebar', handleOpen);
        return () => window.removeEventListener('open-profile-sidebar', handleOpen);
    }, []);

    React.useEffect(() => {
        // Check local storage for persistent login state
        const storedLogin = localStorage.getItem('isLoggedIn');
        const storedRole = localStorage.getItem('userRole');

        if (storedLogin === 'true') {
            setIsLoggedIn(true);
            setView('profile');
            if (storedRole) setUserRole(storedRole);
        }
    }, []);

    const fetchProfile = async (forceRefresh = false) => {
        try {
            const data = await customerService.getCustomerDetails(forceRefresh);
            setCustomerData(data);
            if (data.customerMobileNumber) setPhoneNumber(data.customerMobileNumber);
            if (data.customerName) setName(data.customerName);
            if (data.customerEmailId) setEmail(data.customerEmailId);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    React.useEffect(() => {
        if (isLoggedIn) {
            fetchProfile();
        }
    }, [isLoggedIn]);

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit number", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        try {
            await authService.sendOtp(phoneNumber);
            // toast({ title: "OTP Sent", description: "Please check your messages" }); // REMOVED
            setFeedback({ type: 'success', message: `OTP sent to +91 ${phoneNumber}` });
            setView('login-otp');
            setResendTimer(60);
        } catch (error) {
            toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!otp || otp.length < 4) {
            toast({ title: "Invalid OTP", description: "Please enter the 4-digit code", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setFeedback(null);
        try {
            const response = await authService.login(phoneNumber, otp, domain || 'babaihomefoods');
            // Show success animation
            setShowSuccess(true);

            // Save role
            if (response.role) {
                localStorage.setItem('userRole', response.role);
                setUserRole(response.role);
            }

            // Delay transition and Redirect to Address flow
            setTimeout(() => {
                setIsLoggedIn(true);
                localStorage.setItem('isLoggedIn', 'true');
                window.dispatchEvent(new Event('auth-change'));
                setShowSuccess(false);
                setView('profile');

                // Close Login Sidebar and Open Address Sidebar
                setIsOpen(false);

                // Only open Address Sidebar if NOT owner
                if (!response.role?.includes('OWNER')) {
                    // If CUSTOMER, fetch details to warm cache
                    if (response.role?.includes('CUSTOMER')) {
                        customerService.getCustomerDetails().catch(console.error);
                    }

                    setTimeout(() => {
                        window.dispatchEvent(new Event('open-address-sidebar'));
                    }, 300);
                }

                // toast({ title: "Welcome back!", description: "Logged in successfully" }); // REMOVED
            }, 2000);

        } catch (error) {
            toast({ title: "Login Failed", description: "Invalid OTP or error occurred", variant: "destructive" });
            setFeedback({ type: 'error', message: "Invalid OTP. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProfile = async () => {
        setIsLoading(true);
        try {
            const data = await customerService.getCustomerDetails();
            setCustomerData(data);
            setName(data.customerName || '');
            setEmail(data.customerEmailId || '');
            setView('edit-profile');
        } catch (error) {
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!name || !email) {
            toast({ title: "Validation Error", description: "Name and Email are required", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            await customerService.updateCustomer({
                ...customerData,
                customerName: name,
                customerEmailId: email,
                companyId: String(companyId) // Explicitly inject companyId from context
            });
            toast({ title: "Success", description: "Profile updated successfully" });
            fetchProfile(true); // Refresh local data (Force Refresh)
            setView('profile');
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            // toast({ title: "Logged Out", description: "See you soon!" }); // REMOVED
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            // Check if OWNER before clearing state
            const wasOwner = userRole?.includes('OWNER');

            setIsLoggedIn(false);
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            window.dispatchEvent(new Event('auth-change'));
            setUserRole(null);
            setView('login-phone');
            setPhoneNumber('');
            setOtp('');
            setFeedback({ type: 'success', message: "Successfully logged out" });

            // Redirect to home if owner
            if (wasOwner) {
                router.push('/');
            }
        }
    };

    const menuItems = [
        { label: 'My Orders', icon: Package, href: '/orders' },
        { label: 'Wishlist', icon: Heart, href: '/wishlist' },
        { label: 'Addresses', icon: MapPin, href: '/addresses' },
        { label: 'Payments', icon: CreditCard, href: '/payments' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ];

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full">

                {/* VIEW: SUCCESS ANIMATION */}
                {showSuccess && (
                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
                        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in delay-150 duration-500">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold font-headline text-foreground">Login Successful!</h2>
                        <p className="text-muted-foreground mt-2">Redirecting to profile...</p>
                    </div>
                )}

                {/* VIEW: LOGGED IN PROFILE */}
                {isLoggedIn && !showSuccess && view === 'profile' && (
                    <>
                        <SheetHeader className="pb-6 border-b">
                            <SheetTitle>Profile</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-6">
                            <div className="flex items-center gap-4 mb-8 px-1">
                                <Avatar className="h-16 w-16 border-2 border-teal-100">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
                                    <AvatarFallback className="text-lg bg-teal-50 text-teal-600">
                                        {phoneNumber.slice(-2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold font-headline">
                                        {customerData?.customerName || 'User'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        +91 {customerData?.customerMobileNumber || phoneNumber}
                                    </p>
                                    <Button variant="link"
                                        className="p-0 h-auto text-teal-600 text-xs mt-1"
                                        onClick={handleEditProfile}
                                    >
                                        Edit Profile
                                    </Button>
                                </div>
                            </div>
                            <Separator className="mb-6" />
                            <div className="space-y-1">
                                {menuItems.map((item) => {
                                    // Only show Settings if role contains OWNER
                                    if (item.label === 'Settings' && !userRole?.includes('OWNER')) return null;

                                    if (item.label === 'My Orders') {
                                        return (
                                            <HistorySheet key={item.label}>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start gap-3 h-12 text-base font-normal rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                                >
                                                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-teal-600" />
                                                    {item.label}
                                                </Button>
                                            </HistorySheet>
                                        );
                                    }

                                    return (
                                        <Button
                                            key={item.label}
                                            variant="ghost"
                                            className="w-full justify-start gap-3 h-12 text-base font-normal rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                            onClick={() => {
                                                if (item.label === 'Addresses') {
                                                    setIsOpen(false);
                                                    setTimeout(() => {
                                                        window.dispatchEvent(new Event('open-address-sidebar'));
                                                    }, 300);
                                                } else if (item.label === 'Wishlist') {
                                                    setIsOpen(false);
                                                    setTimeout(() => {
                                                        setWishlistOpen(true);
                                                    }, 300);
                                                } else {
                                                    router.push(item.href);
                                                }
                                            }}
                                        >
                                            <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-teal-600" />
                                            {item.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="pt-4 mt-auto border-t">
                            <Button
                                variant="destructive"
                                className="w-full gap-2 rounded-xl h-12 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Log Out
                            </Button>
                        </div>
                    </>
                )}

                {/* VIEW: EDIT PROFILE */}
                {isLoggedIn && !showSuccess && view === 'edit-profile' && (
                    <div className="flex flex-col h-full px-4 pt-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Button variant="ghost" size="icon" onClick={() => setView('profile')} className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h2 className="text-xl font-bold font-headline">Edit Profile</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1 text-slate-700">Full Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-14 rounded-xl"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1 text-slate-700">Email Address</label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 rounded-xl"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div className="space-y-2 opacity-60">
                                <label className="text-sm font-bold ml-1 text-slate-700">Mobile Number</label>
                                <Input
                                    value={phoneNumber || customerData?.customerMobileNumber}
                                    disabled
                                    className="h-14 rounded-xl bg-slate-100"
                                />
                                <p className="text-xs text-muted-foreground ml-1">Mobile number cannot be changed.</p>
                            </div>

                            <Button
                                className="w-full h-14 rounded-xl text-lg font-bold bg-teal-500 hover:bg-teal-600 mt-4"
                                onClick={handleSaveProfile}
                                disabled={isLoading || (
                                    name === (customerData?.customerName || '') &&
                                    email === (customerData?.customerEmailId || '')
                                )}
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW: LOGIN PHONE */}
                {!isLoggedIn && !showSuccess && view === 'login-phone' && (
                    <div className="flex flex-col h-full justify-center px-4 relative">
                        {/* INLINE FEEDBACK */}
                        {feedback && (
                            <div className={cn(
                                "absolute top-6 left-4 right-4 p-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-5",
                                feedback.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {feedback.message}
                            </div>
                        )}

                        <div className="mb-10 text-center space-y-3">
                            <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-teal-50/50">
                                <User className="h-8 w-8 text-teal-600" />
                            </div>
                            <h2 className="text-3xl font-bold font-headline text-slate-800">Welcome Back</h2>
                            <p className="text-slate-500 font-medium">Enter your mobile number to login</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1 text-slate-700">Mobile Number</label>
                                <Input
                                    type="tel"
                                    placeholder="Enter 10 digit number"
                                    className="h-14 rounded-2xl text-lg tracking-wide border-2 border-slate-100 bg-slate-50/50 focus-visible:ring-teal-500 focus-visible:border-teal-500 transition-all font-medium placeholder:text-slate-300"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                />
                            </div>
                            <Button
                                className="w-full h-14 rounded-2xl text-lg font-bold bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
                                onClick={handleSendOtp}
                                disabled={isLoading || phoneNumber.length < 10}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Get OTP'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW: LOGIN OTP */}
                {!isLoggedIn && !showSuccess && view === 'login-otp' && (
                    <div className="flex flex-col h-full px-4 pt-12 relative">
                        {/* INLINE FEEDBACK */}
                        {feedback && (
                            <div className={cn(
                                "absolute top-2 left-4 right-4 p-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-5 text-center",
                                feedback.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {feedback.message}
                            </div>
                        )}

                        <Button variant="ghost" size="sm" className="self-start -ml-2 mb-8 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full px-4" onClick={() => setView('login-phone')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Change Number
                        </Button>

                        <div className="mb-10 space-y-3 text-center">
                            <h2 className="text-3xl font-bold font-headline text-slate-800">Verify OTP</h2>
                            <div className="text-slate-500 font-medium">
                                Enter the code sent to <span className="text-teal-600 font-bold">+91 {phoneNumber}</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="0000"
                                    className="h-16 rounded-2xl text-center text-3xl tracking-[0.5em] font-bold border-2 border-slate-100 bg-slate-50/50 focus-visible:ring-teal-500 focus-visible:border-teal-500 transition-all text-slate-800 placeholder:text-slate-200"
                                    maxLength={4}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                />
                            </div>
                            <Button
                                className="w-full h-14 rounded-2xl text-lg font-bold bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
                                onClick={handleLogin}
                                disabled={isLoading || otp.length < 4}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                            </Button>

                            <div className="text-center">
                                <Button
                                    variant="link"
                                    className="text-sm font-semibold text-slate-400 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSendOtp}
                                    disabled={isLoading || resendTimer > 0}
                                >
                                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet >
    );
}
